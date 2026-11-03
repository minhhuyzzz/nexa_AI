-- ==============================================================================
-- NEXA MIGRATION 39: SECURE AI CREDITS RPC & IDEMPOTENT RESERVATION (SEC-01, P0-02, P0-03)
-- ==============================================================================
-- 1. Secures deduct_organization_ai_credits against unauthorized execution, input tampering (negative amount),
--    and sets strict search_path to prevent search-path hijacking.
-- 2. Creates refund_organization_ai_credits for atomic org AI credit refund.
-- 3. Hardens personal deduct_ai_credits and adds refund_ai_credits.
-- 4. Creates ai_credit_reservations table to provide durable idempotency for AI Gateway operations.

-- ------------------------------------------------------------------------------
-- 1. Hardened deduct_organization_ai_credits
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_organization_ai_credits(
    p_org_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_entitlement_id UUID;
    v_granted INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số lượng credits trừ phải lớn hơn 0 (nhận: %).', p_amount USING ERRCODE = 'P0003';
    END IF;

    SELECT id, ai_credits_granted, ai_credits_used
    INTO v_entitlement_id, v_granted, v_used
    FROM public.organization_entitlements
    WHERE organization_id = p_org_id
      AND is_active = true
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF v_entitlement_id IS NULL THEN
        RAISE EXCEPTION 'Gói dịch vụ tổ chức chưa được kích hoạt hoặc đã hết hạn.' USING ERRCODE = 'P0001';
    END IF;

    v_remaining := v_granted - v_used;
    IF v_remaining < p_amount THEN
        RAISE EXCEPTION 'Hạn mức AI Credits của tổ chức không đủ (còn: %, cần: %).', v_remaining, p_amount USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.organization_entitlements
    SET ai_credits_used = ai_credits_used + p_amount
    WHERE id = v_entitlement_id;

    RETURN v_remaining - p_amount;
END;
$$;

-- Revoke execute from public/anon/authenticated - only service_role (server backend) can deduct
REVOKE ALL ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) TO service_role;

-- ------------------------------------------------------------------------------
-- 2. Atomic refund_organization_ai_credits
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_organization_ai_credits(
    p_org_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_entitlement_id UUID;
    v_granted INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số lượng credits hoàn phải lớn hơn 0 (nhận: %).', p_amount USING ERRCODE = 'P0003';
    END IF;

    SELECT id, ai_credits_granted, ai_credits_used
    INTO v_entitlement_id, v_granted, v_used
    FROM public.organization_entitlements
    WHERE organization_id = p_org_id
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF v_entitlement_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy gói dịch vụ tổ chức để hoàn credits.' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.organization_entitlements
    SET ai_credits_used = GREATEST(0, ai_credits_used - p_amount)
    WHERE id = v_entitlement_id;

    RETURN v_granted - GREATEST(0, v_used - p_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.refund_organization_ai_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_organization_ai_credits(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.refund_organization_ai_credits(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_organization_ai_credits(UUID, INTEGER) TO service_role;

-- ------------------------------------------------------------------------------
-- 3. Hardened deduct_ai_credits (Personal)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(
    p_user_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số lượng credits trừ phải lớn hơn 0 (nhận: %).', p_amount USING ERRCODE = 'P0003';
    END IF;

    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.is_admin_or_service() THEN
        RAISE EXCEPTION 'Không có quyền trừ credits của người dùng khác.' USING ERRCODE = '42501';
    END IF;

    SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_current_credits IS NULL OR v_current_credits < p_amount THEN
        RAISE EXCEPTION 'Không đủ AI credits (còn: %, cần: %).', COALESCE(v_current_credits, 0), p_amount USING ERRCODE = 'P0001';
    END IF;

    v_new_credits := v_current_credits - p_amount;

    UPDATE public.profiles
    SET credits = v_new_credits,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN v_new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_ai_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_ai_credits(UUID, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(UUID, INTEGER) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. Atomic refund_ai_credits (Personal)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_ai_credits(
    p_user_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số lượng credits hoàn phải lớn hơn 0 (nhận: %).', p_amount USING ERRCODE = 'P0003';
    END IF;

    IF NOT public.is_admin_or_service() THEN
        RAISE EXCEPTION 'Chỉ backend service hoặc admin mới có quyền hoàn credits.' USING ERRCODE = '42501';
    END IF;

    SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    v_new_credits := COALESCE(v_current_credits, 0) + p_amount;

    UPDATE public.profiles
    SET credits = v_new_credits,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN v_new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_ai_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_ai_credits(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.refund_ai_credits(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_credits(UUID, INTEGER) TO service_role;

-- ------------------------------------------------------------------------------
-- 5. Persistent AI Credit Reservations Ledger for Idempotency
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_credit_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT UNIQUE NOT NULL,
    payer_type TEXT NOT NULL CHECK (payer_type IN ('PERSONAL', 'ORG')),
    payer_id UUID NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'SETTLED', 'RELEASED')),
    remaining_credits INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reservations_request ON public.ai_credit_reservations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_reservations_payer ON public.ai_credit_reservations(payer_type, payer_id);

ALTER TABLE public.ai_credit_reservations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_credit_reservations FROM PUBLIC;
REVOKE ALL ON public.ai_credit_reservations FROM anon;
REVOKE ALL ON public.ai_credit_reservations FROM authenticated;
GRANT ALL ON public.ai_credit_reservations TO service_role;
