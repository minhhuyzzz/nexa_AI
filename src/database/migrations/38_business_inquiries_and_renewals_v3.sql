-- ==============================================================================
-- NEXA MIGRATION 38: BUSINESS INQUIRIES & RENEWALS V3.0 (SAAS B2B LIFECYCLE)
-- ==============================================================================
-- 1. Expands business_inquiries check constraint to support streamlined V3 statuses:
--    'NEW', 'IN_PROGRESS', 'ACTIVATED', 'CLOSED', 'NEEDS_INFO' (alongside legacy states).
-- 2. Creates renewal_requests table for real B2B subscription renewal lifecycle.
-- 3. Configures Row Level Security (RLS) for tenant isolation and admin governance.

-- 1. Expand business_inquiries check constraint
ALTER TABLE public.business_inquiries 
    DROP CONSTRAINT IF EXISTS business_inquiries_status_check;

ALTER TABLE public.business_inquiries 
    ADD CONSTRAINT business_inquiries_status_check 
    CHECK (status IN (
        'NEW', 
        'CONTACTED', 
        'IN_PROGRESS', 
        'PROPOSAL_SENT', 
        'ACTIVATED', 
        'APPROVED', 
        'REJECTED', 
        'CLOSED', 
        'NEEDS_INFO'
    ));

-- 2. Create renewal_requests table
CREATE TABLE IF NOT EXISTS public.renewal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    period_months INTEGER NOT NULL DEFAULT 12 CHECK (period_months IN (1, 3, 6, 12, 24, 36)),
    requested_seats INTEGER CHECK (requested_seats IS NULL OR requested_seats > 0),
    requested_credits INTEGER CHECK (requested_credits IS NULL OR requested_credits >= 0),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_renewal_requests_org ON public.renewal_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_renewal_requests_status ON public.renewal_requests(status);
CREATE INDEX IF NOT EXISTS idx_renewal_requests_created ON public.renewal_requests(created_at DESC);

-- 3. Row Level Security for renewal_requests
ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.renewal_requests TO authenticated;
GRANT ALL ON public.renewal_requests TO service_role;

-- Org Admins & Owners can view renewal requests for their own organization
DROP POLICY IF EXISTS "Org admins can view their renewal requests" ON public.renewal_requests;
CREATE POLICY "Org admins can view their renewal requests" ON public.renewal_requests
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT uo.organization_id 
            FROM public.user_organizations uo 
            WHERE uo.user_id = auth.uid() 
              AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
              AND uo.status = 'ACTIVE'
        )
        OR public.is_admin_or_service()
    );

-- Org Admins & Owners can create renewal requests for their organization
DROP POLICY IF EXISTS "Org admins can create renewal requests" ON public.renewal_requests;
CREATE POLICY "Org admins can create renewal requests" ON public.renewal_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT uo.organization_id 
            FROM public.user_organizations uo 
            WHERE uo.user_id = auth.uid() 
              AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
              AND uo.status = 'ACTIVE'
        )
        OR public.is_admin_or_service()
    );

-- Platform Admins can manage all renewal requests
DROP POLICY IF EXISTS "Platform admin can manage all renewal requests" ON public.renewal_requests;
CREATE POLICY "Platform admin can manage all renewal requests" ON public.renewal_requests
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_service())
    WITH CHECK (public.is_admin_or_service());
