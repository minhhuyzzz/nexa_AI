-- ==============================================================================
-- NEXA COMMUNITY CONTRIBUTIONS SCHEMA
-- Migration: 18_community_contributions_schema.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.community_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('PRACTICAL_FILE', 'SCENARIO', 'MCQ', 'DIGITAL_LINK')),
    difficulty TEXT NOT NULL DEFAULT 'INTERMEDIATE' CHECK (difficulty IN ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'NEEDS_REVISION', 'REJECTED')),
    prompt TEXT NOT NULL,
    solution_notes TEXT,
    admin_feedback TEXT,
    points_rewarded INTEGER DEFAULT 0,
    attached_files JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_comm_contrib_status ON public.community_contributions(status);
CREATE INDEX IF NOT EXISTS idx_comm_contrib_user ON public.community_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_comm_contrib_code ON public.community_contributions(code);

-- Enable RLS
ALTER TABLE public.community_contributions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'community_contributions' AND policyname = 'community_contributions_select_policy'
    ) THEN
        CREATE POLICY community_contributions_select_policy ON public.community_contributions
            FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_service());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'community_contributions' AND policyname = 'community_contributions_insert_policy'
    ) THEN
        CREATE POLICY community_contributions_insert_policy ON public.community_contributions
            FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin_or_service());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'community_contributions' AND policyname = 'community_contributions_update_policy'
    ) THEN
        CREATE POLICY community_contributions_update_policy ON public.community_contributions
            FOR UPDATE USING (public.is_admin_or_service() OR (user_id = auth.uid() AND status = 'NEEDS_REVISION'));
    END IF;
END $$;

GRANT ALL ON public.community_contributions TO authenticated;
