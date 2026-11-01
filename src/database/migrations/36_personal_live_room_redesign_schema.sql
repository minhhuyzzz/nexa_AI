-- ==============================================================================
-- 36_PERSONAL_LIVE_ROOM_REDESIGN_SCHEMA.SQL
-- Phase 1: Bổ sung cấu hình giao diện (Theme), cài đặt phòng thi, trạng thái thí sinh,
-- phát thanh thông báo (Announcements) và kích hoạt Supabase Realtime.
-- ==============================================================================

-- 1. Cập nhật bảng exam_rooms
ALTER TABLE public.exam_rooms
  ADD COLUMN IF NOT EXISTS theme_id TEXT NOT NULL DEFAULT 'minimal_white',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'WAITING',
  ADD COLUMN IF NOT EXISTS allow_late_join BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_submit_on_timeout BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_pin BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS system_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS results_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS results_publish_settings JSONB NOT NULL DEFAULT '{"show_score": true, "show_ranking": true, "show_answers": false, "scope": "ALL"}'::jsonb,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS room_description TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Tạo index hỗ trợ tìm kiếm và lọc trạng thái phòng
CREATE INDEX IF NOT EXISTS idx_exam_rooms_status ON public.exam_rooms(status);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_theme ON public.exam_rooms(theme_id);

-- 2. Cập nhật bảng room_participants
ALTER TABLE public.room_participants
  ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS answers_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_questions INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_room_participants_ready ON public.room_participants(room_id, is_ready);

-- 3. Tạo bảng thông báo phát thanh (room_announcements)
CREATE TABLE IF NOT EXISTS public.room_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'ALL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_announcements_room ON public.room_announcements(room_id, created_at DESC);

-- Bật RLS
ALTER TABLE public.room_announcements ENABLE ROW LEVEL SECURITY;

-- Cấp quyền bảng
GRANT ALL ON public.room_announcements TO authenticated;
GRANT ALL ON public.room_announcements TO service_role;
GRANT ALL ON public.exam_rooms TO authenticated;
GRANT ALL ON public.room_participants TO authenticated;

-- Policies cho room_announcements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.room_announcements'::regclass AND polname = 'Users can view announcements in their room'
  ) THEN
    CREATE POLICY "Users can view announcements in their room"
      ON public.room_announcements
      FOR SELECT
      TO authenticated
      USING (
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.room_participants
          WHERE room_participants.room_id = room_announcements.room_id
            AND room_participants.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid = 'public.room_announcements'::regclass AND polname = 'Room hosts can insert announcements'
  ) THEN
    CREATE POLICY "Room hosts can insert announcements"
      ON public.room_announcements
      FOR INSERT
      TO authenticated
      WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.exam_rooms
          WHERE exam_rooms.id = room_announcements.room_id
            AND exam_rooms.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- 4. Bật Realtime cho các bảng phòng thi
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_rooms;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_announcements;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
