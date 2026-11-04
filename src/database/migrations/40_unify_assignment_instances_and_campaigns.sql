-- ==============================================================================
-- NEXA SCHEMA MIGRATION 40: UNIFY ASSIGNMENT INSTANCES & CAMPAIGN LINKAGE
-- ==============================================================================

-- 1. Drop outdated unique constraint that prevented multiple assignments of the same assessment to a class
ALTER TABLE public.class_assignments DROP CONSTRAINT IF EXISTS uq_class_assessment;

-- 2. Add campaign_id to class_assignments so every assignment instance can be explicitly linked to an organization campaign
ALTER TABLE public.class_assignments 
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.assessment_campaigns(id) ON DELETE CASCADE;

-- 3. Add index for high performance querying
CREATE INDEX IF NOT EXISTS idx_class_assignments_campaign ON public.class_assignments(campaign_id);
