-- ============================================================================
-- MIGRATION 54: AI CALIBRATION AND HITL AUDIT SCHEMA
-- File: src/database/migrations/54_ai_calibration_and_hitl_audit_schema.sql
-- Description: Đo lường và kiểm chuẩn độ lệch điểm giữa AI và Người chấm (HITL Calibration Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_calibration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES public.ai_evaluations(id) ON DELETE SET NULL,
    submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ai_score NUMERIC(10,2) NOT NULL,
    human_score NUMERIC(10,2) NOT NULL,
    score_delta NUMERIC(10,2) NOT NULL,
    criterion_deltas JSONB DEFAULT '[]'::jsonb,
    task_type TEXT NOT NULL DEFAULT 'RUBRIC_GRADING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_ai_calibration_logs_org_id ON public.ai_calibration_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_calibration_logs_assessor_id ON public.ai_calibration_logs(assessor_id);
CREATE INDEX IF NOT EXISTS idx_ai_calibration_logs_created_at ON public.ai_calibration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_calibration_logs_eval_sub ON public.ai_calibration_logs(evaluation_id, submission_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_calibration_logs ENABLE ROW LEVEL SECURITY;

-- Revoke default raw permissions
REVOKE ALL ON public.ai_calibration_logs FROM PUBLIC, anon;
GRANT SELECT ON public.ai_calibration_logs TO authenticated;
GRANT ALL ON public.ai_calibration_logs TO service_role;

-- Policy 1: Service Role has full access for inserts and system operations
DROP POLICY IF EXISTS "service_role_all_ai_calibration_logs" ON public.ai_calibration_logs;
CREATE POLICY "service_role_all_ai_calibration_logs"
    ON public.ai_calibration_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Platform Admin has full visibility across all calibration logs
DROP POLICY IF EXISTS "platform_admin_select_ai_calibration_logs" ON public.ai_calibration_logs;
CREATE POLICY "platform_admin_select_ai_calibration_logs"
    ON public.ai_calibration_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'ADMIN'
        )
    );

-- Policy 3: Org Assessors, Admins, and Owners can view calibration logs for their organization
DROP POLICY IF EXISTS "org_assessors_select_ai_calibration_logs" ON public.ai_calibration_logs;
CREATE POLICY "org_assessors_select_ai_calibration_logs"
    ON public.ai_calibration_logs
    FOR SELECT
    TO authenticated
    USING (
        org_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_organizations uo
            WHERE uo.organization_id = ai_calibration_logs.org_id
              AND uo.user_id = auth.uid()
              AND uo.status = 'ACTIVE'
              AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR')
        )
    );
