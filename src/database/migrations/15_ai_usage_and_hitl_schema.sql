-- ==============================================================================
-- 15_AI_USAGE_AND_HITL_SCHEMA.SQL
-- Phase 4: Quản Trị AI Gateway, Usage Tracking & Human-In-The-Loop Rubric
-- ==============================================================================

-- 1. AI Usage Events (token audit, model latency, cost estimation)
CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, -- 'RUBRIC_GRADING', 'COMPETENCY_ANALYSIS', 'HEALTH_CHECK'
  provider TEXT NOT NULL, -- 'GOOGLE_GEMINI', 'OPENAI', 'ANTHROPIC'
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILED'
  error_message TEXT,
  cost_estimated NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user ON public.ai_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_org ON public.ai_usage_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_feature ON public.ai_usage_events(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_created ON public.ai_usage_events(created_at);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.ai_usage_events'::regclass AND polname = 'Admins can view all ai_usage_events'
  ) THEN
    CREATE POLICY "Admins can view all ai_usage_events"
      ON public.ai_usage_events
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.ai_usage_events'::regclass AND polname = 'Users can view own ai_usage_events'
  ) THEN
    CREATE POLICY "Users can view own ai_usage_events"
      ON public.ai_usage_events
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.ai_usage_events'::regclass AND polname = 'Authenticated users can insert ai_usage_events'
  ) THEN
    CREATE POLICY "Authenticated users can insert ai_usage_events"
      ON public.ai_usage_events
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- 2. Enhance ai_evaluations with HITL (Human-in-the-loop) fields
ALTER TABLE public.ai_evaluations
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS override_score NUMERIC,
  ADD COLUMN IF NOT EXISTS override_feedback TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.ai_evaluations'::regclass AND polname = 'Evaluators and admins can manage ai_evaluations'
  ) THEN
    CREATE POLICY "Evaluators and admins can manage ai_evaluations"
      ON public.ai_evaluations
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role IN ('EVALUATOR', 'ADMIN')
        )
      );
  END IF;
END $$;

-- 3. Enhance assessment_submissions with Evaluator grading status and separate Integrity flag
ALTER TABLE public.assessment_submissions
  ADD COLUMN IF NOT EXISTS grading_status TEXT DEFAULT 'PENDING_REVIEW',
  ADD COLUMN IF NOT EXISTS evaluated_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evaluator_notes TEXT,
  ADD COLUMN IF NOT EXISTS integrity_flag TEXT DEFAULT 'NORMAL';

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_grading_status ON public.assessment_submissions(grading_status);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_integrity_flag ON public.assessment_submissions(integrity_flag);
