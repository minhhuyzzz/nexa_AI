-- ==============================================================================
-- NEXA MIGRATION 29: FIX IS_ADMIN_OR_SERVICE() SECURITY DEFINER ESCALATION (SEC-01)
-- ==============================================================================
-- Resolves SEC-01: Removes vulnerable current_user pattern
-- which inside a SECURITY DEFINER function evaluates to the function owner (postgres),
-- erroneously returning TRUE for any authenticated user.
-- Replaces with strict caller session role verification via auth.jwt() and explicit checks.

CREATE OR REPLACE FUNCTION public.is_admin_or_service()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
    v_jwt_role TEXT;
    v_user_email TEXT;
    v_profile_role TEXT;
    v_uid UUID;
BEGIN
    -- 1. Check Supabase internal service_role via JWT claim or session_user
    -- In Supabase, trusted backend requests using service_role key carry claim role = 'service_role'
    v_jwt_role := nullif(current_setting('request.jwt.claim.role', true), '');
    IF v_jwt_role = 'service_role' THEN
        RETURN TRUE;
    END IF;

    -- Also check direct database session user (e.g. CLI migrations or background cron jobs)
    IF session_user IN ('service_role') THEN
        RETURN TRUE;
    END IF;

    -- 2. Check JWT email claim against superadmin email whitelist
    v_user_email := nullif(current_setting('request.jwt.claim.email', true), '');
    IF v_user_email IS NULL THEN
        v_user_email := auth.jwt() ->> 'email';
    END IF;

    IF v_user_email IS NOT NULL AND v_user_email IN ('admin.nexa@gmail.com') THEN
        RETURN TRUE;
    END IF;

    -- 3. Check profile role in public.profiles for authenticated user
    v_uid := auth.uid();
    IF v_uid IS NOT NULL THEN
        SELECT role INTO v_profile_role 
        FROM public.profiles 
        WHERE id = v_uid;

        IF v_profile_role = 'ADMIN' THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- Revoke execute from public and anon, grant only to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.is_admin_or_service() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_service() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_service() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_service() TO service_role;
