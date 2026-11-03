-- ==============================================================================
-- NEXA SCHEMA MIGRATION 37: ORG CLASSES, DEPARTMENTS & ASSIGNMENTS ENHANCEMENT
-- ==============================================================================

-- 1. Extend evaluator_classes with group types, academic terms, and operational settings
ALTER TABLE public.evaluator_classes
  ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'CLASS',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS term TEXT,
  ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS instructor_name TEXT,
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"allow_join_code": true, "is_active_listed": true, "create_resource_folder": false}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'evaluator_classes_group_type_check'
  ) THEN
    ALTER TABLE public.evaluator_classes 
      ADD CONSTRAINT evaluator_classes_group_type_check 
      CHECK (group_type IN ('CLASS', 'DEPARTMENT', 'PROJECT_GROUP'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'evaluator_classes_status_check'
  ) THEN
    ALTER TABLE public.evaluator_classes 
      ADD CONSTRAINT evaluator_classes_status_check 
      CHECK (status IN ('ACTIVE', 'UPCOMING', 'ARCHIVED'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evaluator_classes_type ON public.evaluator_classes(group_type);
CREATE INDEX IF NOT EXISTS idx_evaluator_classes_status ON public.evaluator_classes(status);

-- 2. Extend class_members with cohort roles and sub-groups (teams/organizations)
ALTER TABLE public.class_members
  ADD COLUMN IF NOT EXISTS role_in_class TEXT DEFAULT 'STUDENT',
  ADD COLUMN IF NOT EXISTS sub_group TEXT,
  ADD COLUMN IF NOT EXISTS student_code TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'class_members_role_in_class_check'
  ) THEN
    ALTER TABLE public.class_members 
      ADD CONSTRAINT class_members_role_in_class_check 
      CHECK (role_in_class IN ('STUDENT', 'CLASS_LEADER', 'VICE_LEADER', 'ASSISTANT_TEACHER'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_class_members_subgroup ON public.class_members(sub_group);

-- 3. Extend class_assignments with scheduling, AI grading, and evidence requirements
ALTER TABLE public.class_assignments
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  ADD COLUMN IF NOT EXISTS allow_late_submission BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_before_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS ai_grading_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS immediate_results BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_evidence BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_evidence_types TEXT[] DEFAULT ARRAY['PDF', 'DOCX', 'PPTX', 'XLSX'],
  ADD COLUMN IF NOT EXISTS max_evidence_mb INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS estimated_ai_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'class_assignments_status_check'
  ) THEN
    ALTER TABLE public.class_assignments 
      ADD CONSTRAINT class_assignments_status_check 
      CHECK (status IN ('PUBLISHED', 'DRAFT', 'CLOSED'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_class_assignments_status ON public.class_assignments(status);
