-- ==============================================================================
-- NEXA MIGRATION 28: ASSESSMENT CAMPAIGNS & VERSION LOCKING (DEC-07)
-- ==============================================================================
-- Establishes Assessment Campaigns as the central organizational workflow unit:
-- Linking standardized assessments, classes, start/end windows, and assigned assessors.

-- 1. Upgrade assessments table with versioning and immutable lock status
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED')),
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- 2. Assessment Campaigns Table
CREATE TABLE IF NOT EXISTS public.assessment_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE RESTRICT,
    class_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    assessor_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'GRADING', 'COMPLETED', 'ARCHIVED')),
    passing_score NUMERIC NOT NULL DEFAULT 70.0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.assessment_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.assessment_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_assessment ON public.assessment_campaigns(assessment_id);

-- 3. Security & RLS
ALTER TABLE public.assessment_campaigns ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.assessment_campaigns TO authenticated;
GRANT ALL ON public.assessment_campaigns TO authenticated;

-- Policies for assessment_campaigns
DROP POLICY IF EXISTS "Org members can view campaigns" ON public.assessment_campaigns;
CREATE POLICY "Org members can view campaigns" ON public.assessment_campaigns
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT uo.organization_id 
            FROM public.user_organizations uo 
            WHERE uo.user_id = auth.uid() 
              AND uo.status = 'ACTIVE'
        )
    );

DROP POLICY IF EXISTS "Org managers can manage campaigns" ON public.assessment_campaigns;
CREATE POLICY "Org managers can manage campaigns" ON public.assessment_campaigns
    FOR ALL TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    )
    WITH CHECK (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    );
