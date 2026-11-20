-- ============================================================================
-- MIGRATION 51: CHÍNH SÁCH TÁC VỤ AI & SỔ CÁI CREDITS NGUYÊN TỬ (ATOMIC LEDGER)
-- File: src/database/migrations/51_ai_task_policies_and_atomic_credit_ledger.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BẢNG QUẢN LÝ CHÍNH SÁCH TÁC VỤ AI (AI TASK POLICIES)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_task_policies (
    task_type VARCHAR(50) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    supported_provider VARCHAR(50) NOT NULL DEFAULT 'GOOGLE_GEMINI',
    model_name VARCHAR(100) NOT NULL DEFAULT 'gemini-2.5-flash',
    price_credits INTEGER NOT NULL DEFAULT 1,
    timeout_ms INTEGER NOT NULL DEFAULT 25000,
    max_retries INTEGER NOT NULL DEFAULT 2,
    require_human_review BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

INSERT INTO public.ai_task_policies (task_type, is_enabled, supported_provider, model_name, price_credits, timeout_ms, require_human_review, description)
VALUES 
('RUBRIC_GRADING', true, 'GOOGLE_GEMINI', 'gemini-2.5-flash', 1, 25000, true, 'Chấm bài tự luận/thực hành theo Rubric sư phạm (Organization only)'),
('GRADING', true, 'GOOGLE_GEMINI', 'gemini-2.5-flash', 1, 25000, true, 'Chấm bài tự luận/thực hành (Alias của Rubric Grading)'),
('RUBRIC_EVAL', true, 'GOOGLE_GEMINI', 'gemini-2.5-flash', 1, 25000, true, 'Đánh giá rubric sư phạm'),
('COMPETENCY_ANALYSIS', true, 'GOOGLE_GEMINI', 'gemini-2.5-flash', 1, 20000, false, 'Chẩn đoán 5 miền năng lực số và đề xuất lộ trình cá nhân'),
('ORG_INSIGHT', true, 'GOOGLE_GEMINI', 'gemini-2.5-flash', 2, 30000, false, 'Nhận định chiến lược năng lực số cấp tổ chức từ dữ liệu tổng hợp'),
('AUTHORING_ASSIST', true, 'GOOGLE_GEMINI', 'gemini-2.5-flash', 1, 20000, true, 'Trợ lý biên soạn câu hỏi, giải thích và Rubric bản nháp'),
('EXPLAIN_QUESTION', true, 'GOOGLE_GEMINI', 'gemini-2.5-flash', 1, 15000, false, 'Giải thích câu hỏi sư phạm cho bài thi cá nhân đã công bố')
ON CONFLICT (task_type) DO UPDATE SET
    supported_provider = EXCLUDED.supported_provider,
    model_name = EXCLUDED.model_name,
    price_credits = EXCLUDED.price_credits,
    timeout_ms = EXCLUDED.timeout_ms,
    require_human_review = EXCLUDED.require_human_review,
    description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 2. CHUẨN HÓA BẢNG SỔ CÁI GIỮ CHỖ CREDITS (ai_credit_reservations)
-- (Bảng đã tồn tại từ Migration 39 & 46; dùng ALTER TABLE an toàn, không dùng CREATE TABLE)
-- ----------------------------------------------------------------------------

ALTER TABLE public.ai_credit_reservations
    ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'RUBRIC_GRADING',
    ADD COLUMN IF NOT EXISTS feature TEXT DEFAULT 'RUBRIC_GRADING',
    ADD COLUMN IF NOT EXISTS idempotent_hash TEXT,
    ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.assessment_campaigns(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS entitlement_id UUID REFERENCES public.organization_entitlements(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES public.assessment_submissions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.assessment_items(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS artifact_id UUID,
    ADD COLUMN IF NOT EXISTS execution_deadline_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 minutes'),
    ADD COLUMN IF NOT EXISTS release_reason TEXT;

-- Cập nhật ràng buộc status check cho phép trạng thái FLAGGED_MANUAL_REVIEW
ALTER TABLE public.ai_credit_reservations DROP CONSTRAINT IF EXISTS ai_credit_reservations_status_check;
ALTER TABLE public.ai_credit_reservations ADD CONSTRAINT ai_credit_reservations_status_check 
    CHECK (status IN ('RESERVED', 'SETTLED', 'RELEASED', 'FLAGGED_MANUAL_REVIEW'));

-- Bổ sung cột request_id vào ai_evaluations và ai_usage_events để gắn kết chính xác 1-1 với giao dịch giữ chỗ (không dùng timestamp heuristic)
ALTER TABLE public.ai_evaluations
    ADD COLUMN IF NOT EXISTS request_id TEXT;

ALTER TABLE public.ai_usage_events
    ADD COLUMN IF NOT EXISTS request_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_evaluations_request_id ON public.ai_evaluations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_request_id ON public.ai_usage_events(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_reservations_req ON public.ai_credit_reservations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_reservations_idempotent_hash ON public.ai_credit_reservations(idempotent_hash);
CREATE INDEX IF NOT EXISTS idx_ai_reservations_payer ON public.ai_credit_reservations(payer_type, payer_id);
CREATE INDEX IF NOT EXISTS idx_ai_reservations_entitlement ON public.ai_credit_reservations(entitlement_id);
CREATE INDEX IF NOT EXISTS idx_ai_reservations_status_created ON public.ai_credit_reservations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_reservations_deadline ON public.ai_credit_reservations(execution_deadline_at) WHERE status = 'RESERVED';

REVOKE ALL ON public.ai_credit_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_credit_reservations TO service_role;

-- ----------------------------------------------------------------------------
-- 3. HÀM RPC NGUYÊN TỬ: reserve_ai_credits (KÈM KHÓA DÒNG, ENTITLEMENT SOURCE & IDEMPOTENCY)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reserve_ai_credits(
    p_request_id TEXT,
    p_payer_type TEXT,
    p_payer_id UUID,
    p_amount INTEGER DEFAULT 1,
    p_feature TEXT DEFAULT 'RUBRIC_GRADING',
    p_submission_id UUID DEFAULT NULL,
    p_item_id UUID DEFAULT NULL,
    p_campaign_id UUID DEFAULT NULL,
    p_timeout_minutes INTEGER DEFAULT 3,
    p_idempotent_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing RECORD;
    v_entitlement_id UUID;
    v_granted INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
    v_current_user_credits INTEGER;
    v_effective_hash TEXT;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số lượng credits giữ trước phải lớn hơn 0.' USING ERRCODE = 'P0003';
    END IF;
    IF p_payer_type NOT IN ('PERSONAL', 'ORG') THEN
        RAISE EXCEPTION 'Loại chủ thể chi trả không hợp lệ (nhận: %).', p_payer_type USING ERRCODE = 'P0004';
    END IF;

    v_effective_hash := COALESCE(p_idempotent_hash, p_request_id);

    -- Khóa phân tán mức transaction tuần tự hóa tuyệt đối các yêu cầu trùng request_id (chống Race Condition Crash 23505)
    PERFORM pg_advisory_xact_lock(hashtext(p_request_id));

    -- Kiểm tra Idempotency có khóa dòng chống TOCTOU
    SELECT * INTO v_existing FROM public.ai_credit_reservations WHERE request_id = p_request_id FOR UPDATE;
    IF v_existing.id IS NOT NULL THEN
        IF v_existing.status = 'RESERVED' THEN
            RETURN jsonb_build_object(
                'success', true,
                'is_idempotent_replay', true,
                'reservation_id', v_existing.request_id,
                'remaining_credits', v_existing.remaining_credits
            );
        ELSE
            RAISE EXCEPTION 'Yêu cầu giữ credits này đã được xử lý (trạng thái: %).', v_existing.status USING ERRCODE = 'P0005';
        END IF;
    END IF;

    -- Khấu trừ giữ chỗ có khóa hàng FOR UPDATE
    IF p_payer_type = 'ORG' THEN
        SELECT id, ai_credits_granted, ai_credits_used
        INTO v_entitlement_id, v_granted, v_used
        FROM public.organization_entitlements
        WHERE organization_id = p_payer_id
          AND is_active = true
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE;

        IF v_entitlement_id IS NULL THEN
            RAISE EXCEPTION 'Hợp đồng tổ chức chưa được kích hoạt hoặc đã hết hạn.' USING ERRCODE = 'P0001';
        END IF;

        v_remaining := v_granted - v_used;
        IF v_remaining < p_amount THEN
            RAISE EXCEPTION 'Hạn mức AI Credits của tổ chức không đủ (còn: %, cần: %).', v_remaining, p_amount USING ERRCODE = 'P0002';
        END IF;

        UPDATE public.organization_entitlements
        SET ai_credits_used = ai_credits_used + p_amount
        WHERE id = v_entitlement_id;

        v_remaining := v_remaining - p_amount;
    ELSE
        SELECT credits INTO v_current_user_credits
        FROM public.profiles
        WHERE id = p_payer_id
        FOR UPDATE;

        IF v_current_user_credits IS NULL OR v_current_user_credits < p_amount THEN
            RAISE EXCEPTION 'Số dư AI Credits cá nhân không đủ (còn: %, cần: %).', COALESCE(v_current_user_credits, 0), p_amount USING ERRCODE = 'P0001';
        END IF;

        UPDATE public.profiles
        SET credits = credits - p_amount,
            updated_at = NOW()
        WHERE id = p_payer_id;

        v_remaining := v_current_user_credits - p_amount;
    END IF;

    -- Lưu sổ cái giữ chỗ (Ghi nhận chính xác entitlement_id gốc và hạn định deadline để xử lý tác vụ in-flight)
    INSERT INTO public.ai_credit_reservations (
        request_id, payer_type, payer_id, entitlement_id, amount, status,
        task_type, feature, idempotent_hash, campaign_id, submission_id, item_id,
        remaining_credits, execution_deadline_at
    ) VALUES (
        p_request_id, p_payer_type, p_payer_id, v_entitlement_id, p_amount, 'RESERVED',
        p_feature, p_feature, v_effective_hash, p_campaign_id, p_submission_id, p_item_id,
        v_remaining, NOW() + (p_timeout_minutes || ' minutes')::INTERVAL
    );

    RETURN jsonb_build_object(
        'success', true,
        'is_idempotent_replay', false,
        'reservation_id', p_request_id,
        'remaining_credits', v_remaining
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_credits(TEXT, TEXT, UUID, INTEGER, TEXT, UUID, UUID, UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_ai_credits(TEXT, TEXT, UUID, INTEGER, TEXT, UUID, UUID, UUID, INTEGER, TEXT) TO service_role;

-- ----------------------------------------------------------------------------
-- 4. HÀM RPC NGUYÊN TỬ: settle_ai_credits (QUYẾT TOÁN GIAO DỊCH THÀNH CÔNG)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.settle_ai_credits(
    p_request_id TEXT,
    p_artifact_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_res RECORD;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_request_id));

    SELECT * INTO v_res FROM public.ai_credit_reservations WHERE request_id = p_request_id FOR UPDATE;
    IF v_res.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy yêu cầu giữ credits: %', p_request_id USING ERRCODE = 'P0006';
    END IF;

    IF v_res.status = 'SETTLED' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'SETTLED',
            'already_settled', true,
            'reservation_id', p_request_id,
            'settled_amount', v_res.amount,
            'remaining_credits', v_res.remaining_credits
        );
    END IF;

    IF v_res.status = 'RELEASED' THEN
        RAISE EXCEPTION 'Không thể quyết toán yêu cầu đã bị hoàn trả (RELEASED).' USING ERRCODE = 'P0007';
    END IF;

    UPDATE public.ai_credit_reservations
    SET status = 'SETTLED',
        artifact_id = COALESCE(p_artifact_id, artifact_id),
        updated_at = NOW()
    WHERE id = v_res.id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'SETTLED',
        'reservation_id', p_request_id,
        'settled_amount', v_res.amount,
        'remaining_credits', v_res.remaining_credits
    );
END;
$$;

REVOKE ALL ON FUNCTION public.settle_ai_credits(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_ai_credits(TEXT, UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 5. HÀM RPC NGUYÊN TỬ: release_ai_credits (HOÀN TRẢ CREDITS AN TOÀN KHI GẶP LỖI)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.release_ai_credits(
    p_request_id TEXT,
    p_reason TEXT DEFAULT 'AI_PROCESSING_FAILED'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_res RECORD;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(p_request_id));

    SELECT * INTO v_res FROM public.ai_credit_reservations WHERE request_id = p_request_id FOR UPDATE;
    IF v_res.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy yêu cầu giữ credits: %', p_request_id USING ERRCODE = 'P0006';
    END IF;

    IF v_res.status = 'RELEASED' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'RELEASED',
            'already_released', true,
            'reservation_id', p_request_id,
            'refunded_amount', v_res.amount
        );
    END IF;

    IF v_res.status = 'SETTLED' THEN
        RAISE EXCEPTION 'Không thể hoàn trả yêu cầu đã quyết toán thành công (SETTLED).' USING ERRCODE = 'P0008';
    END IF;

    -- Hoàn tiền nguyên tử về đúng nguồn gốc gói ban đầu đã khấu trừ
    IF v_res.payer_type = 'ORG' THEN
        IF v_res.entitlement_id IS NOT NULL THEN
            UPDATE public.organization_entitlements
            SET ai_credits_used = GREATEST(0, ai_credits_used - v_res.amount)
            WHERE id = v_res.entitlement_id;
        ELSE
            -- Fallback an toàn cho bản ghi legacy nếu thiếu entitlement_id
            UPDATE public.organization_entitlements
            SET ai_credits_used = GREATEST(0, ai_credits_used - v_res.amount)
            WHERE id = (
                SELECT id FROM public.organization_entitlements
                WHERE organization_id = v_res.payer_id AND is_active = true
                ORDER BY created_at DESC LIMIT 1
            );
        END IF;
    ELSE
        UPDATE public.profiles
        SET credits = credits + v_res.amount,
            updated_at = NOW()
        WHERE id = v_res.payer_id;
    END IF;

    UPDATE public.ai_credit_reservations
    SET status = 'RELEASED',
        release_reason = p_reason,
        updated_at = NOW()
    WHERE id = v_res.id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'RELEASED',
        'reservation_id', p_request_id,
        'refunded_amount', v_res.amount
    );
END;
$$;

REVOKE ALL ON FUNCTION public.release_ai_credits(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_ai_credits(TEXT, TEXT) TO service_role;

-- ----------------------------------------------------------------------------
-- 6. HÀM RPC ĐỐI SOÁT ĐỊNH KỲ: reconcile_ai_credit_reservations (CHỐNG TREO TIỀN & XỬ LÝ TOÀN BỘ TÁC VỤ)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reconcile_ai_credit_reservations(
    p_timeout_minutes INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    r RECORD;
    v_has_eval BOOLEAN;
    v_found_artifact_id UUID;
    v_is_unsupported_task BOOLEAN;
    v_settled_count INTEGER := 0;
    v_released_count INTEGER := 0;
    v_flagged_count INTEGER := 0;
BEGIN
    FOR r IN
        SELECT *
        FROM public.ai_credit_reservations
        WHERE status = 'RESERVED'
          AND created_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL
          -- Grace window: Chỉ đối soát khi tác vụ đã vượt quá hạn định thực thi (bảo vệ tác vụ actively running / in-flight)
          AND (execution_deadline_at IS NULL OR NOW() > execution_deadline_at)
        FOR UPDATE SKIP LOCKED
    LOOP
        v_found_artifact_id := NULL;
        v_has_eval := false;
        v_is_unsupported_task := false;

        -- 1. Tác vụ Chấm Rubric / Grading / Rubric Eval: Đối chiếu trực tiếp theo request_id (không dùng heuristic timestamp)
        IF r.feature IN ('RUBRIC_GRADING', 'GRADING', 'RUBRIC_EVAL') OR r.task_type IN ('RUBRIC_GRADING', 'GRADING', 'RUBRIC_EVAL') THEN
            SELECT id INTO v_found_artifact_id
            FROM public.ai_evaluations
            WHERE request_id = r.request_id
            LIMIT 1;

            -- Fallback tương thích dữ liệu cũ chưa có request_id
            IF v_found_artifact_id IS NULL AND r.submission_id IS NOT NULL AND r.item_id IS NOT NULL THEN
                SELECT id INTO v_found_artifact_id
                FROM public.ai_evaluations
                WHERE submission_id = r.submission_id
                  AND item_id = r.item_id
                  AND created_at >= r.created_at
                ORDER BY created_at DESC
                LIMIT 1;
            END IF;
            v_has_eval := (v_found_artifact_id IS NOT NULL);

        -- 2. Tác vụ Phân tích Năng lực số:
        ELSIF r.feature = 'COMPETENCY_ANALYSIS' OR r.task_type = 'COMPETENCY_ANALYSIS' THEN
            SELECT id INTO v_found_artifact_id
            FROM public.competency_analyses
            WHERE request_id = r.request_id OR (submission_id = r.submission_id AND created_at >= r.created_at)
            ORDER BY created_at DESC
            LIMIT 1;
            v_has_eval := (v_found_artifact_id IS NOT NULL);

        -- 3. Tác vụ Giải thích Câu hỏi:
        ELSIF r.feature = 'EXPLAIN_QUESTION' OR r.task_type = 'EXPLAIN_QUESTION' THEN
            IF to_regclass('public.ai_question_explanations') IS NOT NULL THEN
                EXECUTE 'SELECT id FROM public.ai_question_explanations WHERE request_id = $1 OR (item_id = $2 AND created_at >= $3) ORDER BY created_at DESC LIMIT 1'
                INTO v_found_artifact_id
                USING r.request_id, r.item_id, r.created_at;
            END IF;
            IF v_found_artifact_id IS NULL THEN
                SELECT id INTO v_found_artifact_id
                FROM public.ai_usage_events
                WHERE request_id = r.request_id AND status = 'SUCCESS'
                LIMIT 1;
            END IF;
            v_has_eval := (v_found_artifact_id IS NOT NULL);

        -- 4. Tác vụ Trợ lý Biên soạn (AUTHORING_ASSIST):
        ELSIF r.feature = 'AUTHORING_ASSIST' OR r.task_type = 'AUTHORING_ASSIST' THEN
            SELECT id INTO v_found_artifact_id
            FROM public.ai_usage_events
            WHERE request_id = r.request_id AND status = 'SUCCESS'
            LIMIT 1;
            v_has_eval := (v_found_artifact_id IS NOT NULL);

        -- 5. Tác vụ Nhận định Tổ chức (ORG_INSIGHT):
        ELSIF r.feature = 'ORG_INSIGHT' OR r.task_type = 'ORG_INSIGHT' THEN
            IF to_regclass('public.ai_analytics_reports') IS NOT NULL THEN
                EXECUTE 'SELECT id FROM public.ai_analytics_reports WHERE request_id = $1 LIMIT 1'
                INTO v_found_artifact_id
                USING r.request_id;
            END IF;
            IF v_found_artifact_id IS NULL THEN
                SELECT id INTO v_found_artifact_id
                FROM public.ai_usage_events
                WHERE request_id = r.request_id AND status = 'SUCCESS'
                LIMIT 1;
            END IF;
            v_has_eval := (v_found_artifact_id IS NOT NULL);

        -- 6. Tác vụ chưa được hỗ trợ loại artifact trong hàm đối soát:
        ELSE
            v_is_unsupported_task := true;
        END IF;

        IF v_is_unsupported_task THEN
            -- Đánh dấu cờ chờ kiểm toán viên xử lý thủ công, tuyệt đối không auto-release
            UPDATE public.ai_credit_reservations
            SET status = 'FLAGGED_MANUAL_REVIEW',
                release_reason = 'UNSUPPORTED_ARTIFACT_TYPE_PREVENT_FALSE_REFUND',
                updated_at = NOW()
            WHERE id = r.id;
            v_flagged_count := v_flagged_count + 1;
        ELSIF v_has_eval THEN
            -- Kết quả đã lưu an toàn -> Quyết toán tự động với artifact_id tìm được (Auto-Settle)
            PERFORM public.settle_ai_credits(r.request_id, v_found_artifact_id);
            v_settled_count := v_settled_count + 1;
        ELSE
            -- Không có artifact nào và đã hết hạn TTL -> Giải phóng tự động trả tiền cho khách (Auto-Release)
            PERFORM public.release_ai_credits(r.request_id, 'RECONCILIATION_TIMEOUT_NO_ARTIFACT');
            v_released_count := v_released_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'auto_settled_count', v_settled_count,
        'auto_released_count', v_released_count,
        'flagged_manual_review_count', v_flagged_count,
        'reconciled_at', NOW()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_ai_credit_reservations(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_ai_credit_reservations(INTEGER) TO service_role;
