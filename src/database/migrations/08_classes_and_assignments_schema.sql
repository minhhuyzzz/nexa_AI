-- ==============================================================================
-- NEXA SCHEMA MIGRATION 08: EVALUATOR CLASSES, MEMBERS & ASSIGNMENTS
-- ==============================================================================

-- 1. Evaluator Classes Table (Long-term cohorts / groups)
CREATE TABLE IF NOT EXISTS public.evaluator_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Class Members Table
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.evaluator_classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_class_user UNIQUE (class_id, user_id)
);

-- 3. Class Assignments Table (Exams assigned to cohorts with deadlines)
CREATE TABLE IF NOT EXISTS public.class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.evaluator_classes(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_class_assessment UNIQUE (class_id, assessment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evaluator_classes_evaluator ON public.evaluator_classes(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluator_classes_code ON public.evaluator_classes(class_code);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user ON public.class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_class ON public.class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_assessment ON public.class_assignments(assessment_id);

-- Table Grants
GRANT ALL ON public.evaluator_classes TO authenticated, service_role;
GRANT ALL ON public.class_members TO authenticated, service_role;
GRANT ALL ON public.class_assignments TO authenticated, service_role;

GRANT SELECT ON public.evaluator_classes TO anon;
GRANT SELECT ON public.class_members TO anon;
GRANT SELECT ON public.class_assignments TO anon;

-- Enable RLS
ALTER TABLE public.evaluator_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;

-- Helper security definer functions to prevent circular RLS recursion
CREATE OR REPLACE FUNCTION public.is_class_evaluator(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.evaluator_classes
    WHERE id = p_class_id AND evaluator_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = p_class_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_class_evaluator(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(UUID) TO authenticated;

-- Evaluator Classes RLS
DROP POLICY IF EXISTS "Evaluators can manage their own classes" ON public.evaluator_classes;
CREATE POLICY "Evaluators can manage their own classes"
    ON public.evaluator_classes FOR ALL
    TO authenticated
    USING (evaluator_id = auth.uid())
    WITH CHECK (evaluator_id = auth.uid());

DROP POLICY IF EXISTS "Learners can view classes they belong to" ON public.evaluator_classes;
CREATE POLICY "Learners can view classes they belong to"
    ON public.evaluator_classes FOR SELECT
    TO authenticated
    USING (public.is_class_member(id));

-- Class Members RLS
DROP POLICY IF EXISTS "Evaluator can manage class members" ON public.class_members;
CREATE POLICY "Evaluator can manage class members"
    ON public.class_members FOR ALL
    TO authenticated
    USING (public.is_class_evaluator(class_id))
    WITH CHECK (public.is_class_evaluator(class_id));

DROP POLICY IF EXISTS "Members can view other members in their class" ON public.class_members;
CREATE POLICY "Members can view other members in their class"
    ON public.class_members FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Class Assignments RLS
DROP POLICY IF EXISTS "Evaluator can manage assignments" ON public.class_assignments;
CREATE POLICY "Evaluator can manage assignments"
    ON public.class_assignments FOR ALL
    TO authenticated
    USING (public.is_class_evaluator(class_id))
    WITH CHECK (public.is_class_evaluator(class_id));

DROP POLICY IF EXISTS "Members can view assigned assessments" ON public.class_assignments;
CREATE POLICY "Members can view assigned assessments"
    ON public.class_assignments FOR SELECT
    TO authenticated
    USING (public.is_class_evaluator(class_id) OR public.is_class_member(class_id));

-- Demo / Prototype Testing Mode Policies (anon)
DROP POLICY IF EXISTS "Anon demo can manage demo classes" ON public.evaluator_classes;
CREATE POLICY "Anon demo can manage demo classes"
    ON public.evaluator_classes FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon demo can manage demo class members" ON public.class_members;
CREATE POLICY "Anon demo can manage demo class members"
    ON public.class_members FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon demo can manage demo class assignments" ON public.class_assignments;
CREATE POLICY "Anon demo can manage demo class assignments"
    ON public.class_assignments FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
