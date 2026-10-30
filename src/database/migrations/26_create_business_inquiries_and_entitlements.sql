-- ==============================================================================
-- NEXA MIGRATION 26: BUSINESS INQUIRIES & CONTRACT ENTITLEMENTS (DEC-03)
-- ==============================================================================
-- Separates public sales leads from active tenant organizations,
-- and tracks contractual seats and quota entitlements provisioned by Platform Admin.

-- 1. Business Inquiries Table (Leads / Consultations)
CREATE TABLE IF NOT EXISTS public.business_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    org_type TEXT NOT NULL DEFAULT 'EDUCATIONAL' CHECK (org_type IN ('EDUCATIONAL', 'ENTERPRISE', 'COMMUNITY')),
    expected_learners INTEGER NOT NULL DEFAULT 100,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_inquiries_status ON public.business_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_business_inquiries_created ON public.business_inquiries(created_at DESC);

-- 2. Organization Entitlements Table (Contract Quotas & Real Ledger)
CREATE TABLE IF NOT EXISTS public.organization_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contract_number TEXT,
    max_seats INTEGER NOT NULL DEFAULT 50,
    max_assessments INTEGER NOT NULL DEFAULT 500,
    ai_credits_granted INTEGER NOT NULL DEFAULT 1000,
    ai_credits_used INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_entitlements_org ON public.organization_entitlements(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_entitlements_active ON public.organization_entitlements(is_active);

-- 3. Security & RLS
ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_entitlements ENABLE ROW LEVEL SECURITY;

-- Allow public & authenticated users to submit inquiries
GRANT INSERT ON public.business_inquiries TO anon, authenticated;
GRANT SELECT ON public.organization_entitlements TO authenticated;

-- Policies for business_inquiries
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.business_inquiries;
CREATE POLICY "Anyone can submit inquiry" ON public.business_inquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can manage inquiries" ON public.business_inquiries;
CREATE POLICY "Admin can manage inquiries" ON public.business_inquiries
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_service())
    WITH CHECK (public.is_admin_or_service());

-- Policies for organization_entitlements
DROP POLICY IF EXISTS "Members can view org entitlements" ON public.organization_entitlements;
CREATE POLICY "Members can view org entitlements" ON public.organization_entitlements
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT uo.organization_id 
            FROM public.user_organizations uo 
            WHERE uo.user_id = auth.uid() 
              AND uo.status = 'ACTIVE'
        )
    );

DROP POLICY IF EXISTS "Admin can manage entitlements" ON public.organization_entitlements;
CREATE POLICY "Admin can manage entitlements" ON public.organization_entitlements
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_service())
    WITH CHECK (public.is_admin_or_service());
