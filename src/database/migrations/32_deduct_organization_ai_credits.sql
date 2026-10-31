-- ==============================================================================
-- NEXA MIGRATION 32: ATOMIC DEDUCTION FOR ORGANIZATION AI CREDITS (AI-01)
-- ==============================================================================
-- Atomically decrements available AI credits for an organization entitlement with row-level locking.

CREATE OR REPLACE FUNCTION public.deduct_organization_ai_credits(
    p_org_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entitlement_id UUID;
    v_granted INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
BEGIN
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
        RAISE EXCEPTION 'Hợp đồng tổ chức chưa được kích hoạt hoặc đã hết hạn.' USING ERRCODE = 'P0001';
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

GRANT EXECUTE ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) TO authenticated, service_role;
