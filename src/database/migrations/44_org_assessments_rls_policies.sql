-- Migration 44: Organization Assessments RLS Policies
-- Grants organization members ability to view and manage their organization's assessments

-- 1. Org members can view their organization's assessments (published or drafts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Org members can view org assessments'
  ) THEN
    CREATE POLICY "Org members can view org assessments"
    ON public.assessments FOR SELECT
    TO authenticated
    USING (
      organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_organizations
        WHERE user_organizations.organization_id = assessments.organization_id
          AND user_organizations.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 2. Org managers (Owners, Admins, Assessors) can manage their organization's assessments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Org managers can manage org assessments'
  ) THEN
    CREATE POLICY "Org managers can manage org assessments"
    ON public.assessments FOR ALL
    TO authenticated
    USING (
      organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_organizations
        WHERE user_organizations.organization_id = assessments.organization_id
          AND user_organizations.user_id = auth.uid()
          AND user_organizations.org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR')
      )
    )
    WITH CHECK (
      organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_organizations
        WHERE user_organizations.organization_id = assessments.organization_id
          AND user_organizations.user_id = auth.uid()
          AND user_organizations.org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR')
      )
    );
  END IF;
END $$;
