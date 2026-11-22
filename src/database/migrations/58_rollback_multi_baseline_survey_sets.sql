-- Rollback migration 58
ALTER TABLE public.assessments
DROP COLUMN IF EXISTS baseline_group;

-- Restore UNIQUE constraint on system_code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessments_system_code_key'
  ) THEN
    ALTER TABLE public.assessments ADD CONSTRAINT assessments_system_code_key UNIQUE (system_code);
  END IF;
END $$;

DROP INDEX IF EXISTS idx_assessments_baseline_group;
