-- ==============================================================================
-- NEXA MIGRATION 13: CENTRAL QUESTION BANK & VERSIONING SCHEMA
-- Supports Task 2.1: Independent Question Bank reusable across assessments
-- ==============================================================================

-- 1. Central Question Bank Items
CREATE TABLE IF NOT EXISTS public.question_bank_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    prompt TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MCQ', 'SCENARIO', 'DIGITAL_EVIDENCE', 'PRACTICE_FILE', 'PRACTICE_URL')),
    competency_id UUID REFERENCES public.competencies(id) ON DELETE SET NULL,
    difficulty_level TEXT NOT NULL DEFAULT 'INTERMEDIATE' CHECK (difficulty_level IN ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'HIGHLY_SPECIALIZED')),
    default_points NUMERIC NOT NULL DEFAULT 10,
    rubric_id UUID REFERENCES public.rubrics(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qb_items_competency ON public.question_bank_items(competency_id);
CREATE INDEX IF NOT EXISTS idx_qb_items_type ON public.question_bank_items(type);
CREATE INDEX IF NOT EXISTS idx_qb_items_status ON public.question_bank_items(status);

-- 2. Central Question Bank Options
CREATE TABLE IF NOT EXISTS public.question_bank_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.question_bank_items(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qb_options_item ON public.question_bank_options(item_id, order_index);

-- 3. Link assessment_items to question_bank_item_id (Provenance / Snapshot link)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'assessment_items' 
          AND column_name = 'question_bank_item_id'
    ) THEN
        ALTER TABLE public.assessment_items 
        ADD COLUMN question_bank_item_id UUID REFERENCES public.question_bank_items(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.question_bank_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank_options ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Evaluators, Admins, and service_role can view and manage
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'question_bank_items' AND policyname = 'Evaluators and Admins can view question bank items'
    ) THEN
        CREATE POLICY "Evaluators and Admins can view question bank items" ON public.question_bank_items
            FOR SELECT TO authenticated
            USING (
                public.is_admin_or_service() OR
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('ADMIN', 'EVALUATOR')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'question_bank_items' AND policyname = 'Evaluators and Admins can modify question bank items'
    ) THEN
        CREATE POLICY "Evaluators and Admins can modify question bank items" ON public.question_bank_items
            FOR ALL TO authenticated
            USING (
                public.is_admin_or_service() OR
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('ADMIN', 'EVALUATOR')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'question_bank_options' AND policyname = 'Evaluators and Admins can view question bank options'
    ) THEN
        CREATE POLICY "Evaluators and Admins can view question bank options" ON public.question_bank_options
            FOR SELECT TO authenticated
            USING (
                public.is_admin_or_service() OR
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('ADMIN', 'EVALUATOR')
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'question_bank_options' AND policyname = 'Evaluators and Admins can modify question bank options'
    ) THEN
        CREATE POLICY "Evaluators and Admins can modify question bank options" ON public.question_bank_options
            FOR ALL TO authenticated
            USING (
                public.is_admin_or_service() OR
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('ADMIN', 'EVALUATOR')
                )
            );
    END IF;
END $$;

-- 6. Seed existing distinct assessment items into question bank
INSERT INTO public.question_bank_items (
    id, code, prompt, type, competency_id, difficulty_level, default_points, status, created_at
)
SELECT 
    ai.id,
    'QB-' || SUBSTRING(ai.id::text, 1, 8),
    ai.prompt,
    ai.type,
    ai.competency_id,
    COALESCE(ai.difficulty_level, 'INTERMEDIATE'),
    ai.points,
    'APPROVED',
    ai.created_at
FROM public.assessment_items ai
ON CONFLICT (id) DO NOTHING;

-- Seed existing options into question bank options
INSERT INTO public.question_bank_options (
    id, item_id, content, is_correct, explanation, order_index, created_at
)
SELECT 
    io.id,
    io.item_id,
    io.content,
    io.is_correct,
    io.explanation,
    io.order_index,
    NOW()
FROM public.item_options io
JOIN public.question_bank_items qbi ON qbi.id = io.item_id
ON CONFLICT (id) DO NOTHING;

-- Link existing assessment_items to question_bank_item_id
UPDATE public.assessment_items ai
SET question_bank_item_id = ai.id
WHERE ai.question_bank_item_id IS NULL 
  AND EXISTS (SELECT 1 FROM public.question_bank_items qbi WHERE qbi.id = ai.id);
