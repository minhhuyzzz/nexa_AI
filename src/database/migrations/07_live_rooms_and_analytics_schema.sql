-- ==============================================================================
-- NEXA SCHEMA MIGRATION 07: LIVE EXAM ROOMS (PIN / QR) & PARTICIPANTS
-- ==============================================================================

-- 1. Exam Rooms Table (PIN, Link, QR)
CREATE TABLE IF NOT EXISTS public.exam_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(6) UNIQUE NOT NULL, -- 6-digit PIN e.g. '829104'
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    room_mode TEXT NOT NULL DEFAULT 'OPEN' CHECK (room_mode IN ('OPEN', 'GROUP_ONLY')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Room Participants Table
CREATE TABLE IF NOT EXISTS public.room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.assessment_submissions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'JOINED' CHECK (status IN ('JOINED', 'TAKING', 'SUBMITTED')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_user UNIQUE (room_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_rooms_code ON public.exam_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_creator ON public.exam_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON public.room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON public.room_participants(user_id);

-- Enable RLS 100%
ALTER TABLE public.exam_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------------------------

-- Exam Rooms
DROP POLICY IF EXISTS "Public can view active rooms by PIN" ON public.exam_rooms;
CREATE POLICY "Public can view active rooms by PIN"
    ON public.exam_rooms FOR SELECT
    TO authenticated
    USING (is_active = TRUE OR created_by = auth.uid());

DROP POLICY IF EXISTS "Evaluators & Admins can manage exam rooms" ON public.exam_rooms;
CREATE POLICY "Evaluators & Admins can manage exam rooms"
    ON public.exam_rooms FOR ALL
    TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN')
        )
    );

-- Room Participants
DROP POLICY IF EXISTS "Users can view participants in their room" ON public.room_participants;
CREATE POLICY "Users can view participants in their room"
    ON public.room_participants FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.exam_rooms
            WHERE id = room_participants.room_id AND created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;
CREATE POLICY "Users can join rooms"
    ON public.room_participants FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own participation" ON public.room_participants;
CREATE POLICY "Users can update own participation"
    ON public.room_participants FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
