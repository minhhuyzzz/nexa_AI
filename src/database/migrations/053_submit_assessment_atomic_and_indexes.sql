-- ==============================================================================
-- NEXA MIGRATION 053: SUBMIT ASSESSMENT ATOMIC & CORE INDEX OPTIMIZATIONS
-- Path: src/database/migrations/053_submit_assessment_atomic_and_indexes.sql
-- Description:
--   1. Tạo các chỉ mục B-tree hiệu năng cao chống full-table scan trên RLS và submissions
--   2. Tạo bảng và chỉ mục cho assignment_submissions
--   3. Tạo Stored Procedure submit_assessment_atomic thực hiện giao dịch nộp bài nguyên khối ACID
-- ==============================================================================

-- 1. Bổ sung B-Tree Indexes cốt lõi
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id 
    ON public.user_organizations (organization_id);

CREATE INDEX IF NOT EXISTS idx_user_organizations_lookup 
    ON public.user_organizations (organization_id, user_id, org_role, status);

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_asm_submitted 
    ON public.assessment_submissions (assessment_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment_id 
    ON public.assessment_submissions (assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_submitted_at_partial 
    ON public.assessment_submissions (submitted_at DESC) 
    WHERE status IN ('SUBMITTED', 'EVALUATED');

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_anti_farming 
    ON public.assessment_submissions (assessment_id, user_id, is_passed) 
    WHERE is_passed = TRUE;

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_user_status 
    ON public.assessment_submissions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id 
    ON public.class_assignments (class_id);

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assignment 
    ON public.assessment_submissions (class_assignment_id);

CREATE INDEX IF NOT EXISTS idx_submission_answers_item_id 
    ON public.submission_answers (item_id);

CREATE INDEX IF NOT EXISTS idx_submission_answers_composite 
    ON public.submission_answers (submission_id, item_id);

CREATE INDEX IF NOT EXISTS idx_item_options_correct_partial 
    ON public.item_options (item_id) 
    WHERE is_correct = TRUE;

CREATE INDEX IF NOT EXISTS idx_evaluator_classes_org_created 
    ON public.evaluator_classes (organization_id, created_at DESC);

-- Đảm bảo cột live_url tồn tại trên bảng submission_answers
ALTER TABLE public.submission_answers 
    ADD COLUMN IF NOT EXISTS live_url TEXT;

-- Bảng assignment_submissions (theo dõi bài nộp theo nhiệm vụ lớp)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_assignment_id UUID REFERENCES public.class_assignments(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'SUBMITTED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assign_id 
    ON public.assignment_submissions (class_assignment_id);

-- Cập nhật ràng buộc CHECK trên learner_competency_snapshots để nhận diện BASELINE_ASSESSMENT và ASSESSMENT_PASSED
ALTER TABLE public.learner_competency_snapshots 
    DROP CONSTRAINT IF EXISTS learner_competency_snapshots_snapshot_trigger_check;

ALTER TABLE public.learner_competency_snapshots 
    ADD CONSTRAINT learner_competency_snapshots_snapshot_trigger_check 
    CHECK (snapshot_trigger IN (
        'ASSESSMENT_COMPLETED', 
        'MODULE_COMPLETED', 
        'MANUAL_REFRESH', 
        'PERIODIC_AUDIT',
        'BASELINE_ASSESSMENT',
        'ASSESSMENT_PASSED'
    ));

-- ==============================================================================
-- 2. STORED PROCEDURE: submit_assessment_atomic
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_assessment_atomic(
    p_assessment_id UUID,
    p_submission_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_answers JSONB DEFAULT '[]'::JSONB,
    p_time_spent_seconds INTEGER DEFAULT 0,
    p_proctoring_summary JSONB DEFAULT '{}'::JSONB,
    p_class_assignment_id UUID DEFAULT NULL,
    p_campaign_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_submission RECORD;
    v_item RECORD;
    v_answer RECORD;
    v_total_score NUMERIC := 0;
    v_max_score NUMERIC := 0;
    v_correct_count INTEGER := 0;
    v_total_questions INTEGER := 0;
    v_percentage NUMERIC := 0;
    v_passed BOOLEAN := FALSE;
    v_pass_threshold NUMERIC := 70.0;
    v_point_reward INTEGER := 10;
    v_points_awarded INTEGER := 0;
    v_prev_passed BOOLEAN := FALSE;
    v_has_open_response BOOLEAN := FALSE;
    v_ans_record JSONB;
    v_item_id UUID;
    v_selected_option_id UUID;
    v_text_response TEXT;
    v_evidence_url TEXT;
    v_live_url TEXT;
BEGIN
    -- 1. Xác thực danh tính thí sinh
    IF p_user_id IS NULL THEN
        p_user_id := auth.uid();
    END IF;

    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Yêu cầu đăng nhập');
    END IF;

    -- 2. Khóa và xác thực bản ghi bài nộp (Pessimistic row lock chống double-submit)
    IF p_submission_id IS NOT NULL THEN
        SELECT * INTO v_submission
        FROM public.assessment_submissions
        WHERE id = p_submission_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy bài nộp hợp lệ');
        END IF;

        IF v_submission.user_id <> p_user_id THEN
            RETURN jsonb_build_object('success', false, 'error', 'Bạn không có quyền nộp bài thi này');
        END IF;

        IF v_submission.status IN ('SUBMITTED', 'EVALUATED') THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'Bài thi này đã được nộp hoặc đã hoàn thành đánh giá, không thể nộp lại',
                'code', 'ALREADY_SUBMITTED'
            );
        END IF;
    ELSE
        p_submission_id := gen_random_uuid();
        INSERT INTO public.assessment_submissions (
            id, assessment_id, user_id, class_assignment_id, campaign_id, status, started_at
        ) VALUES (
            p_submission_id, p_assessment_id, p_user_id, p_class_assignment_id, p_campaign_id, 'IN_PROGRESS', NOW()
        );
    END IF;

    -- 3. Xóa các câu trả lời nháp cũ
    DELETE FROM public.submission_answers WHERE submission_id = p_submission_id;

    -- 4. Chấm điểm trắc nghiệm tự động theo bộ đáp án chuẩn & lưu đáp án
    FOR v_ans_record IN SELECT * FROM jsonb_array_elements(COALESCE(p_answers, '[]'::JSONB))
    LOOP
        v_item_id := COALESCE(v_ans_record->>'item_id', v_ans_record->>'itemId')::UUID;
        v_selected_option_id := NULLIF(COALESCE(v_ans_record->>'selected_option_id', v_ans_record->>'selectedOptionId', ''), '')::UUID;
        v_text_response := COALESCE(v_ans_record->>'text_response', v_ans_record->>'textResponse');
        v_evidence_url := COALESCE(v_ans_record->>'evidence_url', v_ans_record->>'evidenceUrl');
        v_live_url := COALESCE(v_ans_record->>'live_url', v_ans_record->>'liveUrl');

        IF v_selected_option_id IS NULL AND (v_text_response IS NOT NULL OR v_evidence_url IS NOT NULL OR v_live_url IS NOT NULL) THEN
            v_has_open_response := TRUE;
            
            INSERT INTO public.submission_answers (
                submission_id, item_id, selected_option_id, text_response, evidence_url, live_url,
                score_awarded, is_correct, auto_graded, created_at
            ) VALUES (
                p_submission_id, v_item_id, NULL, v_text_response, v_evidence_url, v_live_url,
                NULL, NULL, FALSE, NOW()
            );
        ELSE
            SELECT io.is_correct, COALESCE(ai.points, 1) as item_points
            INTO v_answer
            FROM public.item_options io
            JOIN public.assessment_items ai ON ai.id = io.item_id
            WHERE io.id = v_selected_option_id
              AND io.item_id = v_item_id;

            IF FOUND AND v_answer.is_correct THEN
                v_total_score := v_total_score + v_answer.item_points;
                v_correct_count := v_correct_count + 1;
            END IF;

            INSERT INTO public.submission_answers (
                submission_id, item_id, selected_option_id, text_response, evidence_url, live_url,
                score_awarded, is_correct, auto_graded, created_at
            ) VALUES (
                p_submission_id, v_item_id, v_selected_option_id, v_text_response, v_evidence_url, v_live_url,
                CASE WHEN FOUND AND v_answer.is_correct THEN v_answer.item_points ELSE 0 END,
                COALESCE(v_answer.is_correct, FALSE),
                TRUE,
                NOW()
            );
        END IF;
    END LOOP;

    -- 5. Tính toán điểm tổng, tỉ lệ phần trăm và kết quả đạt/không đạt
    SELECT 
        COALESCE(SUM(COALESCE(points, 1)), 0),
        COUNT(*),
        COALESCE((SELECT passing_score FROM public.assessments WHERE id = p_assessment_id), 70.0),
        COALESCE((SELECT point_reward FROM public.assessments WHERE id = p_assessment_id), 10)
    INTO v_max_score, v_total_questions, v_pass_threshold, v_point_reward
    FROM public.assessment_items
    WHERE assessment_id = p_assessment_id;

    IF v_max_score > 0 THEN
        v_percentage := ROUND(((v_total_score / v_max_score) * 100)::NUMERIC, 2);
        v_passed := (v_percentage >= v_pass_threshold);
    END IF;

    -- Kiểm tra chống cày điểm thưởng (anti-farming)
    IF v_passed = TRUE AND v_point_reward > 0 THEN
        SELECT EXISTS (
            SELECT 1 FROM public.assessment_submissions
            WHERE assessment_id = p_assessment_id
              AND user_id = p_user_id
              AND is_passed = TRUE
              AND id <> p_submission_id
        ) INTO v_prev_passed;

        IF NOT v_prev_passed THEN
            v_points_awarded := v_point_reward;
        END IF;
    END IF;

    -- 6. Cập nhật bài nộp với đúng schema chuẩn Supabase
    UPDATE public.assessment_submissions
    SET status = CASE WHEN v_has_open_response THEN 'SUBMITTED' ELSE 'EVALUATED' END,
        grading_status = CASE WHEN v_has_open_response THEN 'PENDING_REVIEW' ELSE 'COMPLETED' END,
        class_assignment_id = COALESCE(p_class_assignment_id, class_assignment_id),
        campaign_id = COALESCE(p_campaign_id, campaign_id),
        total_score = CASE WHEN v_has_open_response THEN NULL ELSE v_total_score END,
        max_score = v_max_score,
        percentage = CASE WHEN v_has_open_response THEN NULL ELSE v_percentage END,
        points_awarded = v_points_awarded,
        is_passed = CASE WHEN v_has_open_response THEN NULL ELSE v_passed END,
        time_spent_seconds = p_time_spent_seconds,
        proctoring_summary = p_proctoring_summary,
        submitted_at = NOW()
    WHERE id = p_submission_id;

    -- 7. Cập nhật trạng thái nhiệm vụ / lưu vào assignment_submissions nếu được giao qua lớp
    IF p_class_assignment_id IS NOT NULL THEN
        BEGIN
            INSERT INTO public.assignment_submissions (
                class_assignment_id, submission_id, user_id, status, created_at
            ) VALUES (
                p_class_assignment_id, p_submission_id, p_user_id,
                CASE WHEN v_has_open_response THEN 'SUBMITTED' ELSE 'EVALUATED' END,
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- 8. Trả về kết quả JSON tổng hợp
    RETURN jsonb_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'status', CASE WHEN v_has_open_response THEN 'SUBMITTED' ELSE 'EVALUATED' END,
        'grading_status', CASE WHEN v_has_open_response THEN 'PENDING_REVIEW' ELSE 'COMPLETED' END,
        'total_score', CASE WHEN v_has_open_response THEN NULL ELSE v_total_score END,
        'max_score', v_max_score,
        'percentage', CASE WHEN v_has_open_response THEN NULL ELSE v_percentage END,
        'is_passed', CASE WHEN v_has_open_response THEN NULL ELSE v_passed END,
        'passing_score', v_pass_threshold,
        'points_awarded', v_points_awarded,
        'correct_count', v_correct_count,
        'total_questions_count', v_total_questions,
        'has_open_response', v_has_open_response,
        'time_spent_seconds', p_time_spent_seconds
    );
END;
$$;

-- Phân quyền thực thi Stored Procedure cho authenticated và service_role
GRANT EXECUTE ON FUNCTION public.submit_assessment_atomic(UUID, UUID, UUID, JSONB, INTEGER, JSONB, UUID, UUID) TO authenticated, service_role;
