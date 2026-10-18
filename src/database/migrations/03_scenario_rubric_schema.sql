-- ==============================================================================
-- NEXA SCHEMA MIGRATION 03: SCENARIO ASSESSMENT, RUBRIC & AI EVALUATIONS
-- ==============================================================================

-- 1. Rubrics Table
CREATE TABLE IF NOT EXISTS public.rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.assessment_items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Rubric Criteria (e.g. Accuracy, Legal Compliance, Communication)
CREATE TABLE IF NOT EXISTS public.rubric_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weight_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    max_points DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    order_index INT NOT NULL DEFAULT 0
);

-- 3. Rubric Levels (e.g. Excellent 100%, Proficient 75%, Developing 50%, Novice 25%)
CREATE TABLE IF NOT EXISTS public.rubric_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criterion_id UUID NOT NULL REFERENCES public.rubric_criteria(id) ON DELETE CASCADE,
    level_name TEXT NOT NULL,
    score_percent DECIMAL(5,2) NOT NULL,
    description TEXT NOT NULL
);

-- 4. AI Evaluations (App 1: On-Demand Rubric AI Grading)
CREATE TABLE IF NOT EXISTS public.ai_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.assessment_items(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    max_score DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    confidence_score DECIMAL(5,2) NOT NULL,
    confidence_flag TEXT NOT NULL CHECK (confidence_flag IN ('GREEN', 'AMBER', 'RED')),
    evidence_quote TEXT,
    strengths TEXT,
    weaknesses TEXT,
    feedback TEXT NOT NULL,
    criterion_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rubrics_item ON public.rubrics(item_id);
CREATE INDEX IF NOT EXISTS idx_rubric_criteria_rubric ON public.rubric_criteria(rubric_id);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_sub ON public.ai_evaluations(submission_id, item_id);

-- Enable RLS 100%
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------------------------

-- Rubrics: Viewable by authenticated users
DROP POLICY IF EXISTS "Authenticated can view rubrics" ON public.rubrics;
CREATE POLICY "Authenticated can view rubrics"
    ON public.rubrics FOR SELECT
    TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Evaluators & Admins can manage rubrics" ON public.rubrics;
CREATE POLICY "Evaluators & Admins can manage rubrics"
    ON public.rubrics FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN')
        )
    );

-- Rubric Criteria
DROP POLICY IF EXISTS "Authenticated can view rubric criteria" ON public.rubric_criteria;
CREATE POLICY "Authenticated can view rubric criteria"
    ON public.rubric_criteria FOR SELECT
    TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Evaluators & Admins can manage rubric criteria" ON public.rubric_criteria;
CREATE POLICY "Evaluators & Admins can manage rubric criteria"
    ON public.rubric_criteria FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN')
        )
    );

-- Rubric Levels
DROP POLICY IF EXISTS "Authenticated can view rubric levels" ON public.rubric_levels;
CREATE POLICY "Authenticated can view rubric levels"
    ON public.rubric_levels FOR SELECT
    TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Evaluators & Admins can manage rubric levels" ON public.rubric_levels;
CREATE POLICY "Evaluators & Admins can manage rubric levels"
    ON public.rubric_levels FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN')
        )
    );

-- AI Evaluations: Candidate can view their own evaluation, Evaluators & Admins can view all
DROP POLICY IF EXISTS "Users can view own AI evaluations" ON public.ai_evaluations;
CREATE POLICY "Users can view own AI evaluations"
    ON public.ai_evaluations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assessment_submissions
            WHERE id = ai_evaluations.submission_id AND (
                user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN'))
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert own AI evaluations" ON public.ai_evaluations;
CREATE POLICY "Users can insert own AI evaluations"
    ON public.ai_evaluations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessment_submissions
            WHERE id = ai_evaluations.submission_id AND user_id = auth.uid()
        )
    );
