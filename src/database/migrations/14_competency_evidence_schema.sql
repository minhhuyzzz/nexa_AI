-- ==============================================================================
-- NEXA MIGRATION 14: COMPETENCY EVIDENCE & HISTORICAL RADAR SNAPSHOTS
-- Supports Task 3.1: True longitudinal competency tracking
-- ==============================================================================

-- 1. Competency Evidence Table
CREATE TABLE IF NOT EXISTS public.competency_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('ASSESSMENT_SUBMISSION', 'PRACTICAL_EVIDENCE', 'MODULE_COMPLETION', 'EVALUATOR_VERIFIED')),
    source_id UUID,
    score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
    weight NUMERIC NOT NULL DEFAULT 1.0,
    evidence_text TEXT,
    evidence_url TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competency_evidence_user ON public.competency_evidence(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competency_evidence_comp ON public.competency_evidence(competency_id);
CREATE INDEX IF NOT EXISTS idx_competency_evidence_source ON public.competency_evidence(source_type, source_id);

-- 2. Learner Competency Snapshots (Longitudinal Historical Evolution)
CREATE TABLE IF NOT EXISTS public.learner_competency_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    overall_score NUMERIC NOT NULL,
    domain_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    skill_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_trigger TEXT NOT NULL CHECK (snapshot_trigger IN ('ASSESSMENT_COMPLETED', 'MODULE_COMPLETED', 'MANUAL_REFRESH', 'PERIODIC_AUDIT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competency_snapshots_user ON public.learner_competency_snapshots(user_id, created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.competency_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_competency_snapshots ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'competency_evidence' AND policyname = 'Users can view own competency evidence'
    ) THEN
        CREATE POLICY "Users can view own competency evidence" ON public.competency_evidence
            FOR SELECT TO authenticated
            USING (
                auth.uid() = user_id OR
                public.is_admin_or_service() OR
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('ADMIN', 'EVALUATOR')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'learner_competency_snapshots' AND policyname = 'Users can view own competency snapshots'
    ) THEN
        CREATE POLICY "Users can view own competency snapshots" ON public.learner_competency_snapshots
            FOR SELECT TO authenticated
            USING (
                auth.uid() = user_id OR
                public.is_admin_or_service() OR
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('ADMIN', 'EVALUATOR')
                )
            );
    END IF;
END $$;
