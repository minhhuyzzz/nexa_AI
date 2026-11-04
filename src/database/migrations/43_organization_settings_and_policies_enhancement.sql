-- ==============================================================================
-- NEXA MIGRATION 43: ORGANIZATION SETTINGS, POLICIES & AUDIT LOGS ENHANCEMENT
-- ==============================================================================
-- 1. Enhances organizations with branding (description, banner_url) while preserving stable code & slug.
-- 2. Enhances organization_policies with assessment passing scores, publication modes, and access controls.
-- 3. Creates org_audit_logs to record sensitive administrative actions (ownership transfer, slug change).

-- 1. Extend organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Extend organization_policies
ALTER TABLE public.organization_policies
ADD COLUMN IF NOT EXISTS passing_score DECIMAL(5,2) DEFAULT 70.00,
ADD COLUMN IF NOT EXISTS auto_publish_results BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_detailed_breakdown BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS require_approval_for_join BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_code_join BOOLEAN DEFAULT TRUE;

-- 3. Create org_audit_logs table
CREATE TABLE IF NOT EXISTS public.org_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_audit_logs_org ON public.org_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_audit_logs_action ON public.org_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_org_audit_logs_created ON public.org_audit_logs(created_at DESC);

-- RLS for org_audit_logs
ALTER TABLE public.org_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can view their org audit logs" ON public.org_audit_logs;
CREATE POLICY "Org admins can view their org audit logs" ON public.org_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations uo
            WHERE uo.organization_id = org_audit_logs.organization_id
              AND uo.user_id = auth.uid()
              AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
              AND uo.status = 'ACTIVE'
        )
    );
