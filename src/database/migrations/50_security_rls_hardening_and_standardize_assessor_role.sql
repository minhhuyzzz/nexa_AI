-- ============================================================================
-- NEXA MIGRATION 50: BẢO MẬT RLS CHUẨN HÓA, BẢO VỆ TRẠNG THÁI BÀI THI (TAMPER GUARD)
-- VÀ CHUẨN HÓA VAI TRÒ KHẢO THÍ VIÊN TRONG TỔ CHỨC: CHỈ GIỮ 'ASSESSOR'
-- File: src/database/migrations/50_security_rls_hardening_and_standardize_assessor_role.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHUẨN HÓA DỮ LIỆU & THU HẸP CHECK CONSTRAINT: CHỈ GIỮ 'ASSESSOR' CHO TỔ CHỨC
-- ----------------------------------------------------------------------------

-- (1.1) Chuyển đổi an toàn toàn bộ dữ liệu thành viên tổ chức cũ từ 'EVALUATOR' sang 'ASSESSOR'
UPDATE public.user_organizations
SET org_role = 'ASSESSOR'
WHERE org_role = 'EVALUATOR';

-- (1.2) Chuyển đổi toàn bộ lời mời tổ chức cũ từ 'EVALUATOR' sang 'ASSESSOR'
UPDATE public.organization_invitations
SET org_role = 'ASSESSOR'
WHERE org_role = 'EVALUATOR';

-- (1.3) Cập nhật CHECK constraint trên public.user_organizations: loại bỏ 'EVALUATOR'
ALTER TABLE public.user_organizations
  DROP CONSTRAINT IF EXISTS user_organizations_org_role_check;

ALTER TABLE public.user_organizations
  ADD CONSTRAINT user_organizations_org_role_check
  CHECK (org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'REPORT_VIEWER', 'MEMBER'));

-- (1.4) Cập nhật CHECK constraint trên public.organization_invitations: loại bỏ 'EVALUATOR'
ALTER TABLE public.organization_invitations
  DROP CONSTRAINT IF EXISTS organization_invitations_org_role_check;

ALTER TABLE public.organization_invitations
  ADD CONSTRAINT organization_invitations_org_role_check
  CHECK (org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'REPORT_VIEWER', 'MEMBER'));

-- ----------------------------------------------------------------------------
-- 2. TRIGGER BẢO VỆ TRẠNG THÁI & ĐIỂM SỐ TRÊN assessment_submissions (TAMPER GUARD)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_guard_assessment_submissions_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_assessor BOOLEAN := false;
    v_target_class_assignment_id UUID;
    v_target_campaign_id UUID;
    v_target_assessment_id UUID;
BEGIN
    -- Cho phép service_role chạy toàn quyền (backend API tin cậy)
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    v_target_class_assignment_id := CASE WHEN TG_OP = 'UPDATE' THEN OLD.class_assignment_id ELSE NEW.class_assignment_id END;
    v_target_campaign_id := CASE WHEN TG_OP = 'UPDATE' THEN OLD.campaign_id ELSE NEW.campaign_id END;
    v_target_assessment_id := CASE WHEN TG_OP = 'UPDATE' THEN OLD.assessment_id ELSE NEW.assessment_id END;

    -- Kiểm tra xem người gọi có phải là Cán bộ tổ chức hoặc Giảng viên có quyền chấm không
    -- (A) Kiểm tra vai trò trong Lớp học cá nhân
    IF v_target_class_assignment_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.evaluator_classes ec
            JOIN public.class_assignments ca ON ca.class_id = ec.id
            WHERE ca.id = v_target_class_assignment_id AND ec.owner_user_id = auth.uid()
        ) INTO v_is_assessor;
    END IF;

    -- (B) Kiểm tra vai trò trong Chiến dịch đợt thi Tổ chức
    IF NOT v_is_assessor AND v_target_campaign_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.assessment_campaigns ac
            JOIN public.user_organizations uo ON uo.organization_id = ac.organization_id
            WHERE ac.id = v_target_campaign_id 
              AND uo.user_id = auth.uid() 
              AND uo.status = 'ACTIVE'
              AND (
                  uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN') OR
                  (uo.org_role = 'ASSESSOR' AND (
                      ac.assessor_ids::jsonb ? auth.uid()::text OR
                      EXISTS (
                          SELECT 1 FROM jsonb_array_elements_text(COALESCE(ac.assessor_ids, '[]'::jsonb)) elem
                          WHERE elem = auth.uid()::text
                      )
                  ))
              )
        ) INTO v_is_assessor;
    END IF;

    -- (C) Kiểm tra vai trò Quản trị viên đề thi trong Tổ chức
    IF NOT v_is_assessor AND v_target_assessment_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.assessments a
            JOIN public.user_organizations uo ON uo.organization_id = a.organization_id
            WHERE a.id = v_target_assessment_id 
              AND a.organization_id IS NOT NULL
              AND uo.user_id = auth.uid() 
              AND uo.status = 'ACTIVE'
              AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
        ) INTO v_is_assessor;
    END IF;

    -- PHÒNG THỦ CHẶN DUAL-ROLE TỰ CHẤM:
    -- Nếu người chấm chính là thí sinh nộp bài (NEW.user_id = auth.uid()), tước quyền assessor ngay lập tức
    IF NEW.user_id = auth.uid() THEN
        v_is_assessor := false;
    END IF;

    -- [INSERT ENFORCEMENT]: Thí sinh tạo bài nộp
    IF TG_OP = 'INSERT' THEN
        IF NOT v_is_assessor THEN
            -- Thí sinh chỉ được tạo bài nộp ở trạng thái IN_PROGRESS hoặc PENDING_START
            IF NEW.status NOT IN ('IN_PROGRESS', 'PENDING_START') THEN
                RAISE EXCEPTION 'Thí sinh chỉ được phép khởi tạo bài nộp ở trạng thái IN_PROGRESS hoặc PENDING_START.' 
                USING ERRCODE = '42501';
            END IF;
            -- Điểm số và trạng thái chấm bắt buộc phải là rỗng khi tạo
            IF NEW.total_score IS NOT NULL OR NEW.percentage IS NOT NULL OR NEW.is_passed IS NOT NULL THEN
                RAISE EXCEPTION 'Thí sinh không được phép tự khởi tạo điểm số bài thi.' 
                USING ERRCODE = '42501';
            END IF;
            IF NEW.grading_status IS NOT NULL AND NEW.grading_status NOT IN ('PENDING', 'UNASSIGNED') THEN
                RAISE EXCEPTION 'Trạng thái chấm ban đầu của bài thi không hợp lệ.' 
                USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    -- [UPDATE ENFORCEMENT]: Thí sinh nộp bài hoặc cập nhật bài làm
    IF TG_OP = 'UPDATE' THEN
        -- Khóa chống sửa user_id hoặc assessment_id (Reparenting attack)
        IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.assessment_id IS DISTINCT FROM OLD.assessment_id THEN
            RAISE EXCEPTION 'Không được phép thay đổi thí sinh hoặc đề thi của bài làm.' 
            USING ERRCODE = '42501';
        END IF;

        IF NOT v_is_assessor THEN
            -- Thí sinh KHÔNG được tự chuyển trạng thái thành EVALUATED (Tamper Guard)
            IF NEW.status = 'EVALUATED' AND OLD.status IS DISTINCT FROM 'EVALUATED' THEN
                RAISE EXCEPTION 'Thí sinh không có quyền tự chuyển trạng thái bài thi thành EVALUATED. Bài thi bắt buộc phải qua quy trình chấm điểm chính thức.' 
                USING ERRCODE = '42501';
            END IF;

            -- Thí sinh KHÔNG được tự sửa điểm số
            IF NEW.total_score IS DISTINCT FROM OLD.total_score OR 
               NEW.percentage IS DISTINCT FROM OLD.percentage OR 
               NEW.is_passed IS DISTINCT FROM OLD.is_passed THEN
                RAISE EXCEPTION 'Thí sinh không có quyền can thiệp hoặc thay đổi điểm số bài thi.' 
                USING ERRCODE = '42501';
            END IF;

            -- Thí sinh KHÔNG được tự duyệt grading_status
            IF NEW.grading_status IS DISTINCT FROM OLD.grading_status AND 
               NEW.grading_status IN ('EVALUATOR_APPROVED', 'COMPLETED', 'SCORED') THEN
                RAISE EXCEPTION 'Thí sinh không có quyền tự phê duyệt trạng thái chấm bài thi.' 
                USING ERRCODE = '42501';
            END IF;

            -- Thí sinh KHÔNG được tự ghi chú nhận xét chấm điểm hoặc ngày chấm
            IF NEW.evaluator_notes IS DISTINCT FROM OLD.evaluator_notes OR 
               NEW.evaluated_by IS DISTINCT FROM OLD.evaluated_by OR 
               NEW.evaluated_at IS DISTINCT FROM OLD.evaluated_at THEN
                RAISE EXCEPTION 'Thí sinh không có quyền thay đổi thông tin người chấm hoặc nhận xét chấm điểm.' 
                USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assessment_submissions_integrity ON public.assessment_submissions;
CREATE TRIGGER trg_assessment_submissions_integrity
    BEFORE INSERT OR UPDATE ON public.assessment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_guard_assessment_submissions_integrity();

-- ----------------------------------------------------------------------------
-- 3. TRIGGER BẢO VỆ CÂU TRẢ LỜI & ĐIỂM TỪNG CÂU TRÊN submission_answers
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_guard_submission_answers_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sub_status VARCHAR(50);
    v_sub_user_id UUID;
    v_target_sub_id UUID;
BEGIN
    -- Cho phép service_role chạy toàn quyền (backend API chấm điểm tin cậy)
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    v_target_sub_id := CASE WHEN TG_OP = 'UPDATE' THEN OLD.submission_id ELSE NEW.submission_id END;

    -- Lấy thông tin bài làm cha
    SELECT status, user_id INTO v_sub_status, v_sub_user_id
    FROM public.assessment_submissions
    WHERE id = v_target_sub_id;

    -- Kiểm tra nếu là thí sinh sở hữu câu trả lời
    IF v_sub_user_id = auth.uid() THEN
        -- Khóa toàn bộ INSERT/UPDATE nếu bài thi cha đã SUBMITTED hoặc EVALUATED
        IF v_sub_status IN ('SUBMITTED', 'EVALUATED') THEN
            RAISE EXCEPTION 'Bài thi đã hoàn tất. Thí sinh không thể thêm hoặc sửa đổi câu trả lời.' 
            USING ERRCODE = '42501';
        END IF;

        -- Khóa chèn câu trả lời có sẵn điểm hoặc cờ đúng/sai (INSERT Backdoor)
        IF TG_OP = 'INSERT' AND (
            (NEW.score_awarded IS NOT NULL AND NEW.score_awarded > 0) OR
            NEW.is_correct IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Thí sinh không có quyền tự chấm điểm hoặc can thiệp kết quả câu hỏi khi tạo câu trả lời.' 
            USING ERRCODE = '42501';
        END IF;

        -- Khóa sửa đổi điểm, chấm đúng/sai, hoặc reparenting khi UPDATE
        IF TG_OP = 'UPDATE' AND (
            NEW.submission_id IS DISTINCT FROM OLD.submission_id OR
            NEW.item_id IS DISTINCT FROM OLD.item_id OR
            NEW.score_awarded IS DISTINCT FROM OLD.score_awarded OR
            NEW.is_correct IS DISTINCT FROM OLD.is_correct OR
            NEW.auto_graded IS DISTINCT FROM OLD.auto_graded
        ) THEN
            RAISE EXCEPTION 'Thí sinh không có quyền tự chấm điểm hoặc can thiệp liên kết câu hỏi.' 
            USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_submission_answers_integrity ON public.submission_answers;
CREATE TRIGGER trg_submission_answers_integrity
    BEFORE INSERT OR UPDATE ON public.submission_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_guard_submission_answers_integrity();

-- ----------------------------------------------------------------------------
-- 4. BẢO MẬT BẢNG ai_evaluations: XÓA LỖ HỔNG MIGRATION 15 & CHỐNG RÒ RỈ BẢN NHÁP
-- ----------------------------------------------------------------------------

ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;

-- Thu hồi chính sách nguy hiểm từ Migration 15 (dùng profiles.role IN ('EVALUATOR', 'ADMIN') gây rò rỉ xuyên tổ chức)
DROP POLICY IF EXISTS "Evaluators and admins can manage ai_evaluations" ON public.ai_evaluations;

-- Thu hồi các policy cũ và policy rò rỉ cho phép thí sinh tự insert bản ghi đánh giá AI
DROP POLICY IF EXISTS "Users can insert own AI evaluations" ON public.ai_evaluations;
DROP POLICY IF EXISTS "Users can view own AI evaluations" ON public.ai_evaluations;
DROP POLICY IF EXISTS "Strict view ai_evaluations" ON public.ai_evaluations;

-- SELECT: Thí sinh CHỈ được xem khi bài thi đã EVALUATED và bản đánh giá đã ACCEPTED (chống rò rỉ bản nháp);
-- Cán bộ Org: ORG_OWNER / ORG_ADMIN xem toàn tổ chức; ASSESSOR chỉ xem bài thuộc lớp/chiến dịch được phân công
CREATE POLICY "Strict view ai_evaluations"
ON public.ai_evaluations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_submissions s
        WHERE s.id = ai_evaluations.submission_id
          AND (
              -- Thí sinh chỉ được xem khi bài thi đã hoàn tất chấm điểm và bản đánh giá AI đã được chấp thuận (ACCEPTED)
              (s.user_id = auth.uid() AND s.status = 'EVALUATED' AND ai_evaluations.status = 'ACCEPTED') OR
              -- Cán bộ quản trị tổ chức (ORG_OWNER, ORG_ADMIN) xem được bản DRAFT trong tổ chức
              (s.assessment_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.assessments a
                  JOIN public.user_organizations uo ON uo.organization_id = a.organization_id
                  WHERE a.id = s.assessment_id
                    AND a.organization_id IS NOT NULL
                    AND uo.user_id = auth.uid() 
                    AND uo.status = 'ACTIVE'
                    AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
              )) OR
              -- Giám khảo / Assessor chỉ xem bản DRAFT thuộc Lớp học cá nhân mình phụ trách
              (s.class_assignment_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.evaluator_classes ec
                  JOIN public.class_assignments ca ON ca.class_id = ec.id
                  WHERE ca.id = s.class_assignment_id
                    AND (ec.owner_user_id = auth.uid() OR ec.instructor_id = auth.uid() OR ec.evaluator_id = auth.uid())
              )) OR
              -- Giám khảo / Assessor chỉ xem bản DRAFT thuộc Chiến dịch được phân công (ac.assessor_ids)
              (s.campaign_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.assessment_campaigns ac
                  JOIN public.user_organizations uo ON uo.organization_id = ac.organization_id
                  WHERE ac.id = s.campaign_id
                    AND uo.user_id = auth.uid() 
                    AND uo.status = 'ACTIVE'
                    AND (
                        uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN') OR
                        (uo.org_role = 'ASSESSOR' AND (
                            ac.assessor_ids::jsonb ? auth.uid()::text OR
                            EXISTS (
                                SELECT 1 FROM jsonb_array_elements_text(COALESCE(ac.assessor_ids, '[]'::jsonb)) elem
                                WHERE elem = auth.uid()::text
                            )
                        ))
                    )
              ))
          )
    )
);

-- INSERT & UPDATE: Tuyệt đối chỉ cấp cho service_role và Cán bộ Org có thẩm quyền
-- (Client thí sinh thông thường không thể tự tạo hoặc sửa đổi ai_evaluations)
REVOKE INSERT, UPDATE, DELETE ON public.ai_evaluations FROM anon, authenticated;
GRANT ALL ON public.ai_evaluations TO service_role;

-- ----------------------------------------------------------------------------
-- 5. HÀM RPC NGUYÊN TỬ: approve_submission_grading (PHÊ DUYỆT ĐIỂM BẢO MẬT & CHỐNG TỰ CHẤM)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_submission_grading(
    p_submission_id UUID,
    p_assessor_id UUID,
    p_item_scores JSONB, -- Mảng [{ "item_id": "...", "score": 8.5 }]
    p_feedback TEXT DEFAULT NULL,
    p_accepted_ai_eval_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sub RECORD;
    v_item JSONB;
    v_item_id UUID;
    v_score NUMERIC;
    v_item_max_score NUMERIC;
    v_total_calculated NUMERIC := 0;
    v_percentage NUMERIC;
    v_is_passed BOOLEAN;
    v_passing_score NUMERIC := 70.0;
    v_is_authorized BOOLEAN := false;
BEGIN
    -- 1. Khóa và lấy bản ghi bài nộp (FOR UPDATE chống Race Condition phê duyệt song song)
    SELECT s.id, s.user_id, s.assessment_id, s.class_assignment_id, s.campaign_id, s.status, s.max_score,
           a.organization_id, a.passing_score
    INTO v_sub
    FROM public.assessment_submissions s
    JOIN public.assessments a ON a.id = s.assessment_id
    WHERE s.id = p_submission_id
    FOR UPDATE OF s;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bài nộp không tồn tại hoặc không tìm thấy đề thi liên kết.' USING ERRCODE = 'P0002';
    END IF;

    -- 2. CHẶN TUYỆT ĐỐI HÀNH VI TỰ CHẤM BÀI (Anti-Self-Grading Guard)
    IF v_sub.user_id = p_assessor_id THEN
        RAISE EXCEPTION 'Thí sinh không được phép tự chấm bài thi của chính mình.' USING ERRCODE = '42501';
    END IF;

    -- 3. XÁC THỰC THẨM QUYỀN CHẤM CỦA ASSESSOR
    -- (A) Nếu thuộc Tổ chức: Phải là ORG_OWNER / ORG_ADMIN hoặc ASSESSOR được phân công
    IF v_sub.organization_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.user_organizations uo
            WHERE uo.organization_id = v_sub.organization_id
              AND uo.user_id = p_assessor_id
              AND uo.status = 'ACTIVE'
              AND (
                  uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN') OR
                  (uo.org_role = 'ASSESSOR' AND (
                      -- Kiểm tra phân công qua campaign
                      (v_sub.campaign_id IS NOT NULL AND EXISTS (
                          SELECT 1 FROM public.assessment_campaigns ac
                          WHERE ac.id = v_sub.campaign_id AND (
                              ac.assessor_ids::jsonb ? p_assessor_id::text OR
                              EXISTS (
                                  SELECT 1 FROM jsonb_array_elements_text(COALESCE(ac.assessor_ids, '[]'::jsonb)) elem
                                  WHERE elem = p_assessor_id::text
                              )
                          )
                      )) OR
                      -- Kiểm tra phân công qua lớp học tổ chức
                      (v_sub.class_assignment_id IS NOT NULL AND EXISTS (
                          SELECT 1 FROM public.evaluator_classes ec
                          JOIN public.class_assignments ca ON ca.class_id = ec.id
                          WHERE ca.id = v_sub.class_assignment_id
                            AND (ec.owner_user_id = p_assessor_id OR ec.instructor_id = p_assessor_id OR ec.evaluator_id = p_assessor_id)
                      ))
                  ))
              )
        ) INTO v_is_authorized;
    -- (B) Nếu là Lớp học cá nhân (Personal Evaluator Class)
    ELSIF v_sub.class_assignment_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.evaluator_classes ec
            JOIN public.class_assignments ca ON ca.class_id = ec.id
            WHERE ca.id = v_sub.class_assignment_id
              AND (ec.owner_user_id = p_assessor_id OR ec.instructor_id = p_assessor_id OR ec.evaluator_id = p_assessor_id)
        ) INTO v_is_authorized;
    END IF;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Người dùng không có thẩm quyền chấm điểm hoặc phê duyệt bài thi này.' USING ERRCODE = '42501';
    END IF;

    -- 4. CẬP NHẬT ĐIỂM TỪNG CÂU VÀ KIỂM TRA GIỚI HẠN (BOUNDS CHECK)
    IF p_item_scores IS NOT NULL AND jsonb_array_length(p_item_scores) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_item_scores)
        LOOP
            v_item_id := (v_item->>'item_id')::UUID;
            v_score := (v_item->>'score')::NUMERIC;

            -- Lấy điểm tối đa của câu hỏi để kiểm tra bounds
            SELECT points INTO v_item_max_score
            FROM public.assessment_items
            WHERE id = v_item_id;

            IF v_score < 0 THEN
                RAISE EXCEPTION 'Điểm số câu hỏi không được âm.' USING ERRCODE = '22003';
            END IF;

            IF v_item_max_score IS NOT NULL AND v_score > v_item_max_score THEN
                RAISE EXCEPTION 'Điểm chấm (%) vượt quá điểm tối đa (%) của câu hỏi %.', v_score, v_item_max_score, v_item_id 
                USING ERRCODE = '22003';
            END IF;

            -- Cập nhật câu trả lời: ghi đè điểm tự luận/thực hành, đánh dấu auto_graded = false
            UPDATE public.submission_answers
            SET score_awarded = v_score,
                auto_graded = false
            WHERE submission_id = p_submission_id AND item_id = v_item_id;
        END LOOP;
    END IF;

    -- 5. TÍNH TOÁN LẠI TỔNG ĐIỂM NGUYÊN TỬ TỪ TẤT CẢ CÂU TRẢ LỜI (BẢO TOÀN ĐIỂM MCQ)
    SELECT COALESCE(SUM(score_awarded), 0)
    INTO v_total_calculated
    FROM public.submission_answers
    WHERE submission_id = p_submission_id;

    -- Barem điểm và ngưỡng đạt
    IF v_sub.max_score IS NOT NULL AND v_sub.max_score > 0 THEN
        v_percentage := ROUND((v_total_calculated / v_sub.max_score) * 100.0, 2);
    ELSE
        v_percentage := v_total_calculated;
    END IF;

    IF v_sub.passing_score IS NOT NULL THEN
        v_passing_score := v_sub.passing_score;
    END IF;
    v_is_passed := (v_percentage >= v_passing_score);

    -- 6. DUYỆT BẢN ĐÁNH GIÁ AI NẾU CÓ (Chuyển DRAFT sang ACCEPTED)
    IF p_accepted_ai_eval_id IS NOT NULL THEN
        UPDATE public.ai_evaluations
        SET status = 'ACCEPTED'
        WHERE id = p_accepted_ai_eval_id AND submission_id = p_submission_id;
    END IF;

    -- 7. CẬP NHẬT TRẠNG THÁI BÀI THI THÀNH EVALUATED
    UPDATE public.assessment_submissions
    SET total_score = v_total_calculated,
        percentage = v_percentage,
        is_passed = v_is_passed,
        status = 'EVALUATED',
        grading_status = 'EVALUATOR_APPROVED',
        evaluated_by = p_assessor_id,
        evaluated_at = NOW(),
        evaluator_notes = p_feedback,
        updated_at = NOW()
    WHERE id = p_submission_id;

    -- 8. TRẢ VỀ KẾT QUẢ JSON CHÍNH THỨC
    RETURN jsonb_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'total_score', v_total_calculated,
        'percentage', v_percentage,
        'is_passed', v_is_passed,
        'status', 'EVALUATED',
        'grading_status', 'EVALUATOR_APPROVED',
        'evaluated_by', p_assessor_id,
        'evaluated_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_submission_grading(UUID, UUID, JSONB, TEXT, UUID) TO authenticated, service_role;
