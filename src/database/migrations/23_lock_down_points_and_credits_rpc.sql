-- NEXA migration 23: close privilege escalation in points/credits security-definer RPCs.
-- Apply after migrations 21 and 22; validate effective grants on staging before production.
-- This file is forward-only. No changes to historical migrations.

BEGIN;

-- SECURITY DEFINER changes CURRENT_USER to the function owner (often postgres).
-- Authorization must use the request JWT rather than CURRENT_USER.
CREATE OR REPLACE FUNCTION public.is_admin_or_service()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Preserve the existing platform-admin behavior while preventing a
    -- SECURITY DEFINER owner's database role from granting blanket access.
    IF lower(auth.jwt() ->> 'email') = 'admin.nexa@gmail.com' THEN
        RETURN TRUE;
    END IF;

    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN COALESCE(v_role = 'ADMIN', FALSE);
END;
$$;

-- Only trusted backend service-role requests may grant points.
-- In particular, neither authenticated users nor PUBLIC may call this RPC.
CREATE OR REPLACE FUNCTION public.grant_points_atomic(
    p_user_id UUID,
    p_delta INTEGER,
    p_event_type TEXT,
    p_source_type TEXT,
    p_source_id UUID,
    p_idempotency_key TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing_id UUID;
    v_new_points INTEGER;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized to grant points' USING ERRCODE = '42501';
    END IF;

    IF p_delta IS NULL OR p_delta <= 0 THEN
        RAISE EXCEPTION 'Points delta must be positive' USING ERRCODE = '22023';
    END IF;

    SELECT id INTO v_existing_id
    FROM public.point_ledger
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing_id IS NOT NULL THEN
        SELECT points INTO v_new_points FROM public.profiles WHERE id = p_user_id;
        RETURN jsonb_build_object(
            'success', true, 'already_awarded', true,
            'delta', 0, 'points', COALESCE(v_new_points, 0)
        );
    END IF;

    INSERT INTO public.point_ledger (
        user_id, event_type, source_type, source_id, delta, idempotency_key, metadata
    ) VALUES (
        p_user_id, p_event_type, p_source_type, p_source_id, p_delta, p_idempotency_key, p_metadata
    );

    UPDATE public.profiles
    SET points = COALESCE(points, 0) + p_delta,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING points INTO v_new_points;

    RETURN jsonb_build_object(
        'success', true, 'already_awarded', false,
        'delta', p_delta, 'points', v_new_points
    );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_points_atomic(UUID, INTEGER, TEXT, TEXT, UUID, TEXT, JSONB)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_points_atomic(UUID, INTEGER, TEXT, TEXT, UUID, TEXT, JSONB)
TO service_role;

-- Direct users may deduct only their own *positive* AI credits.
-- The old "<>" test evaluates to NULL for an anonymous caller and can
-- accidentally skip authorization; IS DISTINCT FROM is null-safe.
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
        RAISE EXCEPTION 'Credit deduction must be positive' USING ERRCODE = '22023';
    END IF;

    -- Credits are charged by a verified API route using the backend service role.
    -- Do not expose this billing-related RPC to client-side Supabase calls.
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized to deduct credits' USING ERRCODE = '42501';
    END IF;

    SELECT credits INTO v_current_credits
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_credits IS NULL OR v_current_credits < p_amount THEN
        RAISE EXCEPTION 'Không đủ AI credits' USING ERRCODE = 'P0001';
    END IF;

    v_new_credits := v_current_credits - p_amount;

    UPDATE public.profiles
    SET credits = v_new_credits,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN v_new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_ai_credits(UUID, INTEGER)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(UUID, INTEGER)
TO service_role;

COMMIT;
