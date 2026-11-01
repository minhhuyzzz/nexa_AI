-- Migration 35: Personal Assessment Authoring Table Grants & RLS Policies
-- Grants table privileges and establishes fine-grained RLS for personal test authors

-- 1. Table Grants for authenticated and service_role
GRANT ALL ON TABLE public.assessments TO authenticated, service_role;
GRANT ALL ON TABLE public.assessment_items TO authenticated, service_role;
GRANT ALL ON TABLE public.item_options TO authenticated, service_role;
GRANT ALL ON TABLE public.assessment_submissions TO authenticated, service_role;
GRANT ALL ON TABLE public.submission_answers TO authenticated, service_role;

-- 2. Assessments RLS Policy for Owners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Users can manage their own assessments'
  ) THEN
    CREATE POLICY "Users can manage their own assessments"
    ON public.assessments FOR ALL
    TO authenticated
    USING (owner_user_id = auth.uid() OR created_by = auth.uid())
    WITH CHECK (owner_user_id = auth.uid() OR created_by = auth.uid());
  END IF;
END $$;

-- 3. Assessment Items RLS Policy for Owners & Evaluators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessment_items' AND policyname = 'Owners can manage assessment items'
  ) THEN
    CREATE POLICY "Owners can manage assessment items"
    ON public.assessment_items FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.assessments
        WHERE assessments.id = assessment_items.assessment_id
          AND (assessments.created_by = auth.uid() OR assessments.owner_user_id = auth.uid())
      ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('EVALUATOR', 'ADMIN')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.assessments
        WHERE assessments.id = assessment_items.assessment_id
          AND (assessments.created_by = auth.uid() OR assessments.owner_user_id = auth.uid())
      ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('EVALUATOR', 'ADMIN')
      )
    );
  END IF;
END $$;

-- 4. Item Options RLS Policy for Owners & Evaluators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'item_options' AND policyname = 'Owners can manage item options'
  ) THEN
    CREATE POLICY "Owners can manage item options"
    ON public.item_options FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.assessment_items
        JOIN public.assessments ON assessments.id = assessment_items.assessment_id
        WHERE assessment_items.id = item_options.item_id
          AND (assessments.created_by = auth.uid() OR assessments.owner_user_id = auth.uid())
      ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('EVALUATOR', 'ADMIN')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.assessment_items
        JOIN public.assessments ON assessments.id = assessment_items.assessment_id
        WHERE assessment_items.id = item_options.item_id
          AND (assessments.created_by = auth.uid() OR assessments.owner_user_id = auth.uid())
      ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('EVALUATOR', 'ADMIN')
      )
    );
  END IF;
END $$;

-- 5. Submissions Visibility for Assessment Creators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessment_submissions' AND policyname = 'Creators can view submissions of their assessments'
  ) THEN
    CREATE POLICY "Creators can view submissions of their assessments"
    ON public.assessment_submissions FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.assessments
        WHERE assessments.id = assessment_submissions.assessment_id
          AND (assessments.created_by = auth.uid() OR assessments.owner_user_id = auth.uid())
      )
    );
  END IF;
END $$;
