-- Migration 45: Assessment Security Settings & Proctoring Matrix
-- Adds configurable security toggles (T1..T11), snapshot_data, and proctoring summaries

-- 1. Add snapshot_data and security_settings to assessments
ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS snapshot_data JSONB,
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{}'::jsonb;

-- 2. Add security_settings to evaluator_classes, assessment_campaigns, and class_assignments
ALTER TABLE public.evaluator_classes
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.assessment_campaigns
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.class_assignments
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{}'::jsonb;

-- 3. Add proctoring_summary to assessment_submissions
ALTER TABLE public.assessment_submissions
ADD COLUMN IF NOT EXISTS proctoring_summary JSONB DEFAULT '{}'::jsonb;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
