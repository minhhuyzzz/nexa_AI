-- ============================================================================
-- MIGRATION 52: AI JOBS & HITL GRADING QUEUE SCHEMA
-- File: src/database/migrations/52_ai_jobs_and_grading_queue_schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TẠO BẢNG HÀNG ĐỢI CHẤM AI VÀ DUYỆT SƯ PHẠM (ai_grading_jobs)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_grading_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    assigned_assessor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    job_status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (job_status IN ('PENDING', 'RUNNING', 'AWAITING_HITL', 'COMPLETED', 'FAILED', 'CANCELLED')),
    ai_draft_scores JSONB DEFAULT '{}'::jsonb,
    hitl_reviewed_scores JSONB DEFAULT '{}'::jsonb,
    rubric_snapshot JSONB DEFAULT '{}'::jsonb,
    model_used VARCHAR(100),
    credit_reservation_id UUID REFERENCES public.ai_credit_reservations(id) ON DELETE SET NULL,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION public.set_ai_grading_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_grading_jobs_updated_at ON public.ai_grading_jobs;
CREATE TRIGGER trg_ai_grading_jobs_updated_at
    BEFORE UPDATE ON public.ai_grading_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_ai_grading_jobs_updated_at();

-- Chỉ mục tối ưu truy vấn hàng đợi chấm bài
CREATE INDEX IF NOT EXISTS idx_ai_grading_jobs_status ON public.ai_grading_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_ai_grading_jobs_org_status ON public.ai_grading_jobs(org_id, job_status);
CREATE INDEX IF NOT EXISTS idx_ai_grading_jobs_sub ON public.ai_grading_jobs(submission_id);
CREATE INDEX IF NOT EXISTS idx_ai_grading_jobs_assessor ON public.ai_grading_jobs(assigned_assessor_id);
CREATE INDEX IF NOT EXISTS idx_ai_grading_jobs_reservation ON public.ai_grading_jobs(credit_reservation_id);

-- ----------------------------------------------------------------------------
-- 2. THIẾT LẬP RLS (ROW LEVEL SECURITY)
-- ----------------------------------------------------------------------------

ALTER TABLE public.ai_grading_jobs ENABLE ROW LEVEL SECURITY;

-- Thu hồi quyền thô mặc định
REVOKE ALL ON public.ai_grading_jobs FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.ai_grading_jobs TO authenticated;
GRANT ALL ON public.ai_grading_jobs TO service_role;

-- Policy 1: Service Role toàn quyền
DROP POLICY IF EXISTS "service_role_all_ai_grading_jobs" ON public.ai_grading_jobs;
CREATE POLICY "service_role_all_ai_grading_jobs"
    ON public.ai_grading_jobs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: ORG_OWNER và ORG_ADMIN có thể SELECT tất cả công việc chấm bài của tổ chức mình
DROP POLICY IF EXISTS "org_admin_owner_select_ai_grading_jobs" ON public.ai_grading_jobs;
CREATE POLICY "org_admin_owner_select_ai_grading_jobs"
    ON public.ai_grading_jobs
    FOR SELECT
    TO authenticated
    USING (
        org_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = ai_grading_jobs.org_id
              AND om.user_id = auth.uid()
              AND om.role IN ('ORG_OWNER', 'ORG_ADMIN')
        )
    );

-- Policy 3: ASSESSOR được phân công trực tiếp vào job hoặc có quyền chấm trong tổ chức/lớp/chiến dịch
-- Được SELECT để xem danh sách chờ duyệt
DROP POLICY IF EXISTS "assessor_select_ai_grading_jobs" ON public.ai_grading_jobs;
CREATE POLICY "assessor_select_ai_grading_jobs"
    ON public.ai_grading_jobs
    FOR SELECT
    TO authenticated
    USING (
        -- Assessor được gán trực tiếp
        assigned_assessor_id = auth.uid()
        OR
        -- Hoặc thành viên tổ chức có vai trò ASSESSOR/ORG_ADMIN/ORG_OWNER
        (
            org_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.organization_members om
                WHERE om.organization_id = ai_grading_jobs.org_id
                  AND om.user_id = auth.uid()
                  AND om.role IN ('ASSESSOR', 'ORG_ADMIN', 'ORG_OWNER')
            )
        )
    );

-- Policy 4: ASSESSOR / ORG_ADMIN UPDATE (chỉ cho phép chuyển trạng thái từ AWAITING_HITL -> COMPLETED)
DROP POLICY IF EXISTS "assessor_update_hitl_ai_grading_jobs" ON public.ai_grading_jobs;
CREATE POLICY "assessor_update_hitl_ai_grading_jobs"
    ON public.ai_grading_jobs
    FOR UPDATE
    TO authenticated
    USING (
        (
            assigned_assessor_id = auth.uid()
            OR
            (org_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.organization_members om
                WHERE om.organization_id = ai_grading_jobs.org_id
                  AND om.user_id = auth.uid()
                  AND om.role IN ('ASSESSOR', 'ORG_ADMIN', 'ORG_OWNER')
            ))
        )
        AND job_status = 'AWAITING_HITL'
    )
    WITH CHECK (
        job_status IN ('AWAITING_HITL', 'COMPLETED')
    );

-- Lưu ý: Thí sinh/người làm bài (Learner) KHÔNG có policy SELECT/UPDATE trên bảng ai_grading_jobs này.
-- Điểm nháp AI (ai_draft_scores) được bảo vệ tuyệt đối, thí sinh chỉ xem điểm sau khi đã publish qua assessment_submissions.
