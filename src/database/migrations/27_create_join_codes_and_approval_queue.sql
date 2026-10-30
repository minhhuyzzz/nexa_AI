-- ==============================================================================
-- NEXA MIGRATION 27: JOIN CODES & MEMBERSHIP APPROVAL QUEUE (DEC-05)
-- ==============================================================================
-- Enables revocable, time-bounded join codes and a human-in-the-loop approval
-- queue so students/staff can request to join an organization without self-escalation.

-- 1. Organization Join Codes Table
CREATE TABLE IF NOT EXISTS public.organization_join_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    title TEXT,
    max_uses INTEGER NOT NULL DEFAULT 100,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_join_codes_code ON public.organization_join_codes(code);
CREATE INDEX IF NOT EXISTS idx_join_codes_org ON public.organization_join_codes(organization_id);

-- 2. Organization Membership Requests (Approval Queue)
CREATE TABLE IF NOT EXISTS public.organization_membership_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    join_code_id UUID REFERENCES public.organization_join_codes(id) ON DELETE SET NULL,
    student_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_membership_req_org_status ON public.organization_membership_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_membership_req_user ON public.organization_membership_requests(user_id);

-- 3. Security & RLS
ALTER TABLE public.organization_join_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_membership_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.organization_join_codes TO authenticated;
GRANT SELECT, INSERT ON public.organization_membership_requests TO authenticated;

-- Policies for join codes
DROP POLICY IF EXISTS "Members can view org join codes" ON public.organization_join_codes;
CREATE POLICY "Members can view org join codes" ON public.organization_join_codes
    FOR SELECT TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR (is_revoked = false AND expires_at > NOW())
    );

DROP POLICY IF EXISTS "Managers can manage org join codes" ON public.organization_join_codes;
CREATE POLICY "Managers can manage org join codes" ON public.organization_join_codes
    FOR ALL TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    )
    WITH CHECK (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    );

-- Policies for membership requests
DROP POLICY IF EXISTS "Users can create and view own join requests" ON public.organization_membership_requests;
CREATE POLICY "Users can create and view own join requests" ON public.organization_membership_requests
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view and review org join requests" ON public.organization_membership_requests;
CREATE POLICY "Managers can view and review org join requests" ON public.organization_membership_requests
    FOR ALL TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    )
    WITH CHECK (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    );
