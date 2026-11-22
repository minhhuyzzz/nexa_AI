-- ==============================================================================
-- NEXA MIGRATION 58: MULTI BASELINE SURVEY SETS
-- ==============================================================================
-- Enables managing multiple baseline survey sets where only one is active.
-- Adds baseline_group column to tag assessments as belonging to baseline intake group.
-- Removes UNIQUE constraint on system_code to allow multiple baseline sets.

-- 1. Add baseline_group tag to identify all baseline-type assessments
ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS baseline_group TEXT DEFAULT NULL;

-- 2. Drop the UNIQUE constraint on system_code so multiple baseline sets can share the code pattern
-- Only drop if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessments_system_code_key'
  ) THEN
    ALTER TABLE public.assessments DROP CONSTRAINT assessments_system_code_key;
  END IF;
END $$;

-- 3. Create index for fast lookup of baseline group
CREATE INDEX IF NOT EXISTS idx_assessments_baseline_group
ON public.assessments(baseline_group)
WHERE baseline_group IS NOT NULL;

-- 4. Mark the canonical baseline as part of the intake group
UPDATE public.assessments
SET baseline_group = 'INTAKE'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
