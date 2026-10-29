-- ==============================================================================
-- NEXA MIGRATION 21: HARDEN PAYMENT RPC & RESTRICT EXECUTE TO SERVICE_ROLE (P0-01 FIX)
-- ==============================================================================

-- 1. Triệt để thu hồi quyền thực thi từ PUBLIC, anon, authenticated
-- PostgreSQL mặc định tự động cấp EXECUTE cho PUBLIC, do đó phải thu hồi tường minh từ PUBLIC
REVOKE ALL ON FUNCTION public.fulfill_payment_transaction(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fulfill_payment_transaction(UUID, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.fulfill_payment_transaction(UUID, TEXT, JSONB) FROM authenticated;

-- 2. Chỉ cấp quyền thực thi duy nhất cho service_role
GRANT EXECUTE ON FUNCTION public.fulfill_payment_transaction(UUID, TEXT, JSONB) TO service_role;

-- 3. Tạo lại function với caller check chuẩn xác (loại bỏ CURRENT_USER bypass)
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
    v_caller_role TEXT;
BEGIN
    -- Lấy role thực tế của caller từ request JWT claims hoặc context auth
    v_caller_role := COALESCE(
        current_setting('request.jwt.claim.role', true),
        auth.role()
    );

    -- Chặn đứng mọi caller không mang claim role = 'service_role'
    -- (Tuyệt đối không kiểm tra CURRENT_USER vì hàm SECURITY DEFINER tự động gán CURRENT_USER = owner)
    IF v_caller_role IS DISTINCT FROM 'service_role' THEN
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

    -- Cập nhật trạng thái giao dịch
    UPDATE public.payment_transactions
    SET status = 'SUCCESS',
        verified_at = NOW(),
        updated_at = NOW(),
        raw_payload = COALESCE(p_raw_payload, raw_payload)
    WHERE id = p_transaction_id;

    -- Nâng cấp gói và hạn mức credits cho người dùng
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
