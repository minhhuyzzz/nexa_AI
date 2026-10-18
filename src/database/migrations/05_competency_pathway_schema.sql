-- ==============================================================================
-- NEXA SCHEMA MIGRATION 05: COMPETENCY ANALYSIS, 4-STEP PATHWAY & LEARNING MODULES
-- ==============================================================================

-- 1. Competency Analyses Table (AI Applications 2, 3, 4, 5)
CREATE TABLE IF NOT EXISTS public.competency_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_level TEXT NOT NULL DEFAULT 'INTERMEDIATE', -- FOUNDATION, INTERMEDIATE, ADVANCED, HIGHLY_SPECIALIZED
    radar_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- 5 domains: [{ domainCode, domainName, score, benchmark }]
    skill_gaps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Skills < 60%: [{ skillCode, skillName, score, maxScore, percentage, rootCause, riskImpact }]
    strengths TEXT,
    weaknesses TEXT,
    pedagogical_feedback TEXT NOT NULL,
    learning_pathway JSONB NOT NULL DEFAULT '[]'::jsonb, -- 4 steps: [{ stepNumber, title, targetSkill, durationHours, objective, actionText, moduleId }]
    model_name TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Learning Modules Table (Learning Materials & +30 Points Reward)
CREATE TABLE IF NOT EXISTS public.learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_id UUID REFERENCES public.competencies(id) ON DELETE CASCADE,
    domain_code TEXT NOT NULL,
    skill_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 20,
    point_reward INT NOT NULL DEFAULT 30, -- +30 điểm (point) khi hoàn thành
    content_markdown TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. User Learning Progress Table
CREATE TABLE IF NOT EXISTS public.user_learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    points_awarded INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_learning_module UNIQUE (user_id, module_id)
);

-- Indexes for lightning fast queries (< 0.01s)
CREATE INDEX IF NOT EXISTS idx_competency_analyses_sub ON public.competency_analyses(submission_id);
CREATE INDEX IF NOT EXISTS idx_competency_analyses_user ON public.competency_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_modules_comp ON public.learning_modules(competency_id);
CREATE INDEX IF NOT EXISTS idx_learning_modules_skill ON public.learning_modules(skill_code);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON public.user_learning_progress(user_id);

-- Enable Row Level Security (RLS) 100%
ALTER TABLE public.competency_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------------------------

-- Competency Analyses
DROP POLICY IF EXISTS "Users can view own competency analyses" ON public.competency_analyses;
CREATE POLICY "Users can view own competency analyses"
    ON public.competency_analyses FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN'))
    );

DROP POLICY IF EXISTS "Users can insert own competency analyses" ON public.competency_analyses;
CREATE POLICY "Users can insert own competency analyses"
    ON public.competency_analyses FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Learning Modules (Public read for authenticated users)
DROP POLICY IF EXISTS "Users can view published learning modules" ON public.learning_modules;
CREATE POLICY "Users can view published learning modules"
    ON public.learning_modules FOR SELECT
    TO authenticated
    USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admins can manage learning modules" ON public.learning_modules;
CREATE POLICY "Admins can manage learning modules"
    ON public.learning_modules FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- User Learning Progress
DROP POLICY IF EXISTS "Users can view own learning progress" ON public.user_learning_progress;
CREATE POLICY "Users can view own learning progress"
    ON public.user_learning_progress FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own learning progress" ON public.user_learning_progress;
CREATE POLICY "Users can manage own learning progress"
    ON public.user_learning_progress FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
