-- ==============================================================================
-- NEXA MIGRATION 19: PERSONAL WORKSPACE, ORGANIZATION WORKSPACE & OWNERSHIP
-- ==============================================================================

-- 1. Extend assessments with ownership and workspace visibility
ALTER TABLE public.assessments 
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'PERSONAL';

-- Add check constraint for visibility if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessments_visibility_check'
  ) THEN
    ALTER TABLE public.assessments 
      ADD CONSTRAINT assessments_visibility_check 
      CHECK (visibility IN ('PERSONAL', 'ORGANIZATION', 'SYSTEM_CURATED', 'PUBLIC'));
  END IF;
END $$;

-- Backfill owner_user_id from created_by
UPDATE public.assessments 
SET owner_user_id = created_by 
WHERE owner_user_id IS NULL AND created_by IS NOT NULL;

-- Backfill visibility for published curated items
UPDATE public.assessments
SET visibility = 'PUBLIC'
WHERE is_published = TRUE AND visibility = 'PERSONAL' AND is_vip = FALSE;

CREATE INDEX IF NOT EXISTS idx_assessments_owner ON public.assessments(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_org ON public.assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assessments_visibility ON public.assessments(visibility);

-- ------------------------------------------------------------------------------
-- 2. Extend evaluator_classes (classes/groups) with ownership and organization
-- ------------------------------------------------------------------------------
ALTER TABLE public.evaluator_classes
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'PERSONAL';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'evaluator_classes_visibility_check'
  ) THEN
    ALTER TABLE public.evaluator_classes 
      ADD CONSTRAINT evaluator_classes_visibility_check 
      CHECK (visibility IN ('PERSONAL', 'ORGANIZATION'));
  END IF;
END $$;

-- Backfill owner_user_id from evaluator_id
UPDATE public.evaluator_classes 
SET owner_user_id = evaluator_id 
WHERE owner_user_id IS NULL AND evaluator_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classes_owner ON public.evaluator_classes(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_classes_org ON public.evaluator_classes(organization_id);

-- ------------------------------------------------------------------------------
-- 3. Extend exam_rooms (live rooms) with ownership and visibility
-- ------------------------------------------------------------------------------
ALTER TABLE public.exam_rooms
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'PERSONAL';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_rooms_visibility_check'
  ) THEN
    ALTER TABLE public.exam_rooms 
      ADD CONSTRAINT exam_rooms_visibility_check 
      CHECK (visibility IN ('PERSONAL', 'ORGANIZATION', 'PUBLIC'));
  END IF;
END $$;

UPDATE public.exam_rooms 
SET owner_user_id = created_by 
WHERE owner_user_id IS NULL AND created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exam_rooms_owner ON public.exam_rooms(owner_user_id);

-- ------------------------------------------------------------------------------
-- 4. Upgrade user_organizations org_role check to support Target Spec Roles
-- Target: ORG_OWNER, ORG_ADMIN, ASSESSOR, REPORT_VIEWER, MEMBER (and keep EVALUATOR)
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_organizations DROP CONSTRAINT IF EXISTS user_organizations_org_role_check;
ALTER TABLE public.user_organizations 
  ADD CONSTRAINT user_organizations_org_role_check 
  CHECK (org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'REPORT_VIEWER', 'MEMBER'));

-- ------------------------------------------------------------------------------
-- 5. Upgrade profiles role check to support USER (Unified Account)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('LEARNER', 'EVALUATOR', 'ADMIN', 'USER'));

-- ------------------------------------------------------------------------------
-- 6. Modernize RLS Policies: Support Owner-based access for Personal Workspace
-- ------------------------------------------------------------------------------

-- Allow owners to manage their own assessments regardless of role
DROP POLICY IF EXISTS "Users can manage their own assessments" ON public.assessments;
CREATE POLICY "Users can manage their own assessments" ON public.assessments
  FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() OR created_by = auth.uid());

-- Allow users to manage their own classes/groups
DROP POLICY IF EXISTS "Users can manage their own classes" ON public.evaluator_classes;
CREATE POLICY "Users can manage their own classes" ON public.evaluator_classes
  FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid() OR evaluator_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() OR evaluator_id = auth.uid());

-- Allow users to manage their own exam rooms
DROP POLICY IF EXISTS "Users can manage their own exam rooms" ON public.exam_rooms;
CREATE POLICY "Users can manage their own exam rooms" ON public.exam_rooms
  FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() OR created_by = auth.uid());
