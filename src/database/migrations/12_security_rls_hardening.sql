-- ==============================================================================
-- NEXA MIGRATION 12: SECURITY HARDENING, RLS & POINT LEDGER
-- Closes P0 vulnerabilities:
-- 1. Prevents direct unauthorized updates to profiles (points, credits, plan_tier, role, avg_competency_score)
-- 2. Protects item_options (is_correct, explanation) from direct learner client queries
-- 3. Creates immutable point_ledger table to eliminate point buffing and race conditions
-- 4. Atomic points granting RPC function (grant_points_atomic)
-- 5. Secure atomic assessment grading function (grade_assessment_submission)
-- ==============================================================================

-- 1. Helper function to check if current actor is SuperAdmin or service_role
CREATE OR REPLACE FUNCTION public.is_admin_or_service()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
BEGIN
    -- PostgreSQL internal user or service_role key
    IF current_user IN ('postgres', 'service_role') THEN
        RETURN TRUE;
    END IF;

    -- Check JWT email claim against superadmin email
    user_email := auth.jwt() ->> 'email';
    IF user_email IS NOT NULL AND user_email IN ('admin.nexa@gmail.com') THEN
        RETURN TRUE;
    END IF;

    -- Check if user role in profiles is ADMIN
    IF auth.uid() IS NOT NULL THEN
        SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
        IF user_role = 'ADMIN' THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- 2. Trigger on profiles to block unauthorized client-side tampering of sensitive fields
CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Allow superadmins and backend service_role
    IF public.is_admin_or_service() THEN
        RETURN NEW;
    END IF;

    -- Block non-admin from modifying points directly
    IF NEW.points IS DISTINCT FROM OLD.points THEN
        RAISE EXCEPTION 'Chỉ hệ thống mới có quyền điều chỉnh điểm tích lũy (points)'
            USING ERRCODE = '42501';
    END IF;

    -- Block non-admin from modifying credits directly
    IF NEW.credits IS DISTINCT FROM OLD.credits THEN
        RAISE EXCEPTION 'Chỉ hệ thống mới có quyền điều chỉnh AI credits'
            USING ERRCODE = '42501';
    END IF;

    -- Block non-admin from modifying plan_tier directly
    IF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier THEN
        RAISE EXCEPTION 'Chỉ hệ thống mới có quyền nâng cấp gói dịch vụ (plan_tier)'
            USING ERRCODE = '42501';
    END IF;

    -- Block non-admin from modifying role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Không thể tự ý thay đổi vai trò tài khoản'
            USING ERRCODE = '42501';
    END IF;

    -- Block non-admin from modifying avg_competency_score directly
    IF NEW.avg_competency_score IS DISTINCT FROM OLD.avg_competency_score THEN
        RAISE EXCEPTION 'Điểm năng lực trung bình được tính tự động bởi hệ thống'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

-- Drop old trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_prevent_role_change ON public.profiles;
DROP TRIGGER IF EXISTS trigger_prevent_profile_tampering ON public.profiles;

CREATE TRIGGER trigger_prevent_profile_tampering
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_tampering();

-- 3. Immutable point_ledger table for gamification points (P1)
CREATE TABLE IF NOT EXISTS public.point_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('ASSESSMENT_PASSED', 'MODULE_COMPLETED', 'STREAK_BONUS', 'ADMIN_ADJUSTMENT')),
    source_type TEXT NOT NULL CHECK (source_type IN ('ASSESSMENT', 'MODULE', 'ADMIN', 'SYSTEM')),
    source_id UUID,
    delta INTEGER NOT NULL,
    policy_version TEXT NOT NULL DEFAULT 'v1.0',
    idempotency_key TEXT UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_ledger_user ON public.point_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_ledger_idempotency ON public.point_ledger(idempotency_key);

ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;

-- Learners can only view their own point ledger
DROP POLICY IF EXISTS "Users can view own point ledger" ON public.point_ledger;
CREATE POLICY "Users can view own point ledger" ON public.point_ledger
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin_or_service());

-- 4. Atomic Points Grant Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.grant_points_atomic(
    p_user_id UUID,
    p_delta INTEGER,
    p_event_type TEXT,
    p_source_type TEXT,
    p_source_id UUID,
    p_idempotency_key TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_id UUID;
    v_new_points INTEGER;
BEGIN
    -- Check if already awarded with this idempotency key
    SELECT id INTO v_existing_id
    FROM public.point_ledger
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing_id IS NOT NULL THEN
        -- Already awarded, return current points without re-awarding
        SELECT points INTO v_new_points FROM public.profiles WHERE id = p_user_id;
        RETURN jsonb_build_object(
            'success', true,
            'already_awarded', true,
            'delta', 0,
            'points', COALESCE(v_new_points, 0)
        );
    END IF;

    -- Insert into immutable point ledger
    INSERT INTO public.point_ledger (
        user_id, event_type, source_type, source_id, delta, idempotency_key, metadata
    ) VALUES (
        p_user_id, p_event_type, p_source_type, p_source_id, p_delta, p_idempotency_key, p_metadata
    );

    -- Atomically update profiles.points
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + p_delta,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING points INTO v_new_points;

    RETURN jsonb_build_object(
        'success', true,
        'already_awarded', false,
        'delta', p_delta,
        'points', v_new_points
    );
END;
$$;

-- 5. Helper to determine if user can view raw item_options with is_correct
CREATE OR REPLACE FUNCTION public.can_view_full_item_options(p_item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Superadmin or service role
    IF public.is_admin_or_service() THEN
        RETURN TRUE;
    END IF;

    -- Evaluators and Admins
    IF auth.uid() IS NOT NULL THEN
        SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
        IF v_role IN ('ADMIN', 'EVALUATOR') THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- Assessment creator
    IF auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.assessment_items ai
        JOIN public.assessments a ON a.id = ai.assessment_id
        WHERE ai.id = p_item_id AND a.created_by = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;

    -- Learner who has already SUBMITTED or GRADED this assessment
    IF auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 
        FROM public.assessment_items ai
        JOIN public.assessment_submissions s ON s.assessment_id = ai.assessment_id
        WHERE ai.id = p_item_id
          AND s.user_id = auth.uid()
          AND s.status IN ('SUBMITTED', 'GRADED')
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- 6. Restrict RLS on item_options using can_view_full_item_options
ALTER POLICY "Authenticated can view item options" ON public.item_options 
USING (public.can_view_full_item_options(item_options.item_id));

-- 7. Sanitized candidate test retrieval RPC (Zero is_correct / explanation leaks)
CREATE OR REPLACE FUNCTION public.get_assessment_for_candidate(p_assessment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assessment JSONB;
    v_items JSONB;
BEGIN
    SELECT to_jsonb(a) INTO v_assessment
    FROM (
        SELECT id, title, description, duration_minutes, passing_score, point_reward, total_questions, framework_id
        FROM public.assessments
        WHERE id = p_assessment_id AND is_published = TRUE
    ) a;

    IF v_assessment IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ai.id,
            'prompt', ai.prompt,
            'points', ai.points,
            'type', ai.type,
            'order_index', ai.order_index,
            'difficulty_level', ai.difficulty_level,
            'competency_id', ai.competency_id,
            'competencies', jsonb_build_object(
                'skill_code', c.skill_code,
                'title', c.title
            ),
            'options', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', io.id,
                            'content', io.content,
                            'order_index', io.order_index
                        ) ORDER BY io.order_index ASC
                    )
                    FROM public.item_options io
                    WHERE io.item_id = ai.id
                ),
                '[]'::jsonb
            )
        ) ORDER BY ai.order_index ASC
    ) INTO v_items
    FROM public.assessment_items ai
    LEFT JOIN public.competencies c ON c.id = ai.competency_id
    WHERE ai.assessment_id = p_assessment_id;

    RETURN jsonb_build_object(
        'assessment', v_assessment,
        'items', COALESCE(v_items, '[]'::jsonb)
    );
END;
$$;

-- 8. Secure grading answer keys retrieval RPC
CREATE OR REPLACE FUNCTION public.get_assessment_answer_keys_for_submission(
    p_assessment_id UUID,
    p_submission_id UUID
)
RETURNS TABLE (
    item_id UUID,
    points NUMERIC,
    correct_option_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.assessment_submissions
        WHERE id = p_submission_id 
          AND user_id = auth.uid()
          AND assessment_id = p_assessment_id
    ) AND NOT public.is_admin_or_service() THEN
        RAISE EXCEPTION 'Unauthorized to grade submission' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT 
        ai.id AS item_id,
        ai.points,
        io.id AS correct_option_id
    FROM public.assessment_items ai
    LEFT JOIN public.item_options io ON io.item_id = ai.id AND io.is_correct = TRUE
    WHERE ai.assessment_id = p_assessment_id;
END;
$$;

-- 9. Atomic AI credit deduction RPC
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
BEGIN
    IF auth.uid() <> p_user_id AND NOT public.is_admin_or_service() THEN
        RAISE EXCEPTION 'Unauthorized to deduct credits' USING ERRCODE = '42501';
    END IF;

    SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_current_credits IS NULL OR v_current_credits < p_amount THEN
        RAISE EXCEPTION 'Không đủ AI credits' USING ERRCODE = 'P0001';
    END IF;

    v_new_credits := v_current_credits - p_amount;

    UPDATE public.profiles
    SET credits = v_new_credits,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN v_new_credits;
END;
$$;
