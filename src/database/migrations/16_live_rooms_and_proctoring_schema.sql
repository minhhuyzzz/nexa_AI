-- ==============================================================================
-- 16_LIVE_ROOMS_AND_PROCTORING_SCHEMA.SQL
-- Phase 5: Phòng Thi Live & Giám Sát Phía Máy Chủ
-- ==============================================================================

-- 1. Enhance exam_rooms with lockdown, access policy, and proctoring profile
ALTER TABLE public.exam_rooms
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_policy TEXT NOT NULL DEFAULT 'PUBLIC_PIN',
  ADD COLUMN IF NOT EXISTS proctoring_profile TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.evaluator_classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exam_rooms_locked ON public.exam_rooms(is_locked);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_policy ON public.exam_rooms(access_policy);

-- 2. Create proctoring_events table for verifiable audit timeline
CREATE TABLE IF NOT EXISTS public.proctoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'TAB_HIDDEN', 'FULLSCREEN_EXIT', 'FOCUS_LOST', 'DEVTOOLS_OPENED', 'RECONNECT'
  severity TEXT NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH'
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proctoring_events_room ON public.proctoring_events(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_sub ON public.proctoring_events(submission_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_user ON public.proctoring_events(user_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_type ON public.proctoring_events(event_type);

ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.proctoring_events'::regclass AND polname = 'Evaluators and Admins can view room proctoring events'
  ) THEN
    CREATE POLICY "Evaluators and Admins can view room proctoring events"
      ON public.proctoring_events
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'EVALUATOR')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.proctoring_events'::regclass AND polname = 'Candidates can view own proctoring events'
  ) THEN
    CREATE POLICY "Candidates can view own proctoring events"
      ON public.proctoring_events
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.proctoring_events'::regclass AND polname = 'Authenticated candidates can insert proctoring events'
  ) THEN
    CREATE POLICY "Authenticated candidates can insert proctoring events"
      ON public.proctoring_events
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid() OR public.is_admin_or_service());
  END IF;
END $$;
