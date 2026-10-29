-- ==============================================================================
-- NEXA MIGRATION 20: SECURITY, BILLING & STORAGE HARDENING (P0 & P1 FIXES)
-- ==============================================================================

-- 1. REVOKE & RE-SECURE fulfill_payment_transaction
REVOKE EXECUTE ON FUNCTION public.fulfill_payment_transaction(UUID, TEXT, JSONB) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fulfill_payment_transaction(UUID, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.fulfill_payment_transaction(UUID, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.fulfill_payment_transaction(
    p_transaction_id UUID,
    p_provider_ref TEXT DEFAULT NULL,
    p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx RECORD;
    v_plan RECORD;
    v_credits INTEGER := 0;
BEGIN
    -- Defense-in-depth: Chi cho phep service_role hoac superadmin DB
    IF auth.role() <> 'service_role' AND CURRENT_USER <> 'postgres' THEN
        RAISE EXCEPTION 'Unauthorized: fulfill_payment_transaction chi duoc goi tu backend service_role';
    END IF;

    SELECT * INTO v_tx
    FROM public.payment_transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;

    IF v_tx.status = 'SUCCESS' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already fulfilled', 'status', 'SUCCESS');
    END IF;

    SELECT * INTO v_plan
    FROM public.service_plans
    WHERE code = v_tx.plan_code;

    IF FOUND THEN
        v_credits := COALESCE(v_plan.credits_included, 0);
    END IF;

    -- Update transaction record
    UPDATE public.payment_transactions
    SET status = 'SUCCESS',
        verified_at = NOW(),
        updated_at = NOW(),
        raw_payload = COALESCE(p_raw_payload, raw_payload)
    WHERE id = p_transaction_id;

    -- Upgrade user profile credits and tier
    UPDATE public.profiles
    SET plan_tier = v_tx.plan_code,
        credits = credits + v_credits,
        updated_at = NOW()
    WHERE id = v_tx.user_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'plan_code', v_tx.plan_code,
        'credits_added', v_credits
    );
END;
$$;

-- 2. HARDEN STORAGE BUCKET & RLS POLICIES
-- Chuyen bucket assessment-evidence ve private, dong bo gioi han 25MB (26214400 bytes)
UPDATE storage.buckets
SET public = FALSE,
    file_size_limit = 26214400
WHERE id = 'assessment-evidence';

-- Xoa policy cu co nguy co bi bypass
DROP POLICY IF EXISTS "Public and Evaluators can view assessment evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own assessment evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload assessment evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users and evaluators can view assessment evidence" ON storage.objects;

-- Policy INSERT: Chi nguoi dung authenticated moi duoc upload vao thu muc submission cua chinh ho
CREATE POLICY "Users can upload own assessment evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assessment-evidence' AND
    (auth.uid()::text = (storage.foldername(name))[2])
);

-- Policy UPDATE: Chi chinh chu moi duoc sua doi file trong thu muc cua minh
CREATE POLICY "Users can update own assessment evidence"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'assessment-evidence' AND
    (auth.uid()::text = (storage.foldername(name))[2])
);

-- Policy SELECT: Chu so huu file, Evaluator, Org Admin hoac Superadmin duoc xem
CREATE POLICY "Users and evaluators can view assessment evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assessment-evidence' AND (
        (auth.uid()::text = (storage.foldername(name))[2])
        OR public.is_admin_or_service()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN')
        )
    )
);
