-- ==============================================================================
-- NEXA ASSESSMENT SCHEMA MIGRATION 02: MCQ ASSESSMENT ENGINE & SUBMISSIONS
-- ==============================================================================

-- 1. Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    framework_id UUID REFERENCES public.assessment_frameworks(id) ON DELETE SET NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    passing_score DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    point_reward INT NOT NULL DEFAULT 50, -- +50 điểm (point) khi hoàn thành
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Assessment Items (Questions / Scenarios / Tasks)
CREATE TABLE IF NOT EXISTS public.assessment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    competency_id UUID REFERENCES public.competencies(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'MCQ' CHECK (type IN ('MCQ', 'SCENARIO', 'PRACTICAL_TASK', 'DIGITAL_EVIDENCE')),
    prompt TEXT NOT NULL,
    points DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    order_index INT NOT NULL DEFAULT 0,
    difficulty_level TEXT NOT NULL DEFAULT 'FOUNDATION' CHECK (difficulty_level IN ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Item Options (For MCQ and Scenario Choices)
CREATE TABLE IF NOT EXISTS public.item_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.assessment_items(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    explanation TEXT,
    order_index INT NOT NULL DEFAULT 0
);

-- 4. Assessment Submissions (Sessions)
CREATE TABLE IF NOT EXISTS public.assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'EVALUATED')),
    total_score DECIMAL(5,2) DEFAULT 0.00,
    max_score DECIMAL(5,2) DEFAULT 100.00,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    points_awarded INT DEFAULT 0,
    is_passed BOOLEAN DEFAULT FALSE,
    time_spent_seconds INT DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

-- 5. Submission Answers (Candidate responses)
CREATE TABLE IF NOT EXISTS public.submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.assessment_items(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.item_options(id) ON DELETE SET NULL,
    text_response TEXT,
    evidence_url TEXT,
    score_awarded DECIMAL(5,2) DEFAULT 0.00,
    is_correct BOOLEAN,
    auto_graded BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast queries (< 0.01s)
CREATE INDEX IF NOT EXISTS idx_assessment_items_assessment ON public.assessment_items(assessment_id, order_index);
CREATE INDEX IF NOT EXISTS idx_item_options_item ON public.item_options(item_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.assessment_submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_submission_answers_sub ON public.submission_answers(submission_id);

-- Enable Row Level Security (RLS) 100%
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------------------------

-- Assessments: Everyone can read published assessments
DROP POLICY IF EXISTS "Public can view published assessments" ON public.assessments;
CREATE POLICY "Public can view published assessments"
    ON public.assessments FOR SELECT
    USING (is_published = TRUE);

DROP POLICY IF EXISTS "Evaluators & Admins can manage assessments" ON public.assessments;
CREATE POLICY "Evaluators & Admins can manage assessments"
    ON public.assessments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN')
        )
    );

-- Assessment Items: Authenticated users can view items
DROP POLICY IF EXISTS "Authenticated can view items of published assessments" ON public.assessment_items;
CREATE POLICY "Authenticated can view items of published assessments"
    ON public.assessment_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments
            WHERE id = assessment_items.assessment_id AND is_published = TRUE
        )
    );

-- Item Options: Authenticated can view options
DROP POLICY IF EXISTS "Authenticated can view item options" ON public.item_options;
CREATE POLICY "Authenticated can view item options"
    ON public.item_options FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assessment_items
            JOIN public.assessments ON assessments.id = assessment_items.assessment_id
            WHERE assessment_items.id = item_options.item_id AND assessments.is_published = TRUE
        )
    );

-- Submissions: Users can view & create their own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON public.assessment_submissions;
CREATE POLICY "Users can view own submissions"
    ON public.assessment_submissions FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN'))
    );

DROP POLICY IF EXISTS "Users can insert own submissions" ON public.assessment_submissions;
CREATE POLICY "Users can insert own submissions"
    ON public.assessment_submissions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own submissions" ON public.assessment_submissions;
CREATE POLICY "Users can update own submissions"
    ON public.assessment_submissions FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN'))
    );

-- Submission Answers: Users can view and manage their own answers
DROP POLICY IF EXISTS "Users can view own answers" ON public.submission_answers;
CREATE POLICY "Users can view own answers"
    ON public.submission_answers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assessment_submissions
            WHERE id = submission_answers.submission_id AND (
                user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN'))
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert own answers" ON public.submission_answers;
CREATE POLICY "Users can insert own answers"
    ON public.submission_answers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessment_submissions
            WHERE id = submission_answers.submission_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own answers" ON public.submission_answers;
CREATE POLICY "Users can update own answers"
    ON public.submission_answers FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assessment_submissions
            WHERE id = submission_answers.submission_id AND (
                user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN'))
            )
        )
    );
