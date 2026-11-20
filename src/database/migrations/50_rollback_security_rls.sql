-- ============================================================================
-- NEXA MIGRATION 50 ROLLBACK: KHÔI PHỤC TRẠNG THÁI TRƯỚC KHI ÁP DỤNG MIGRATION 50
-- File: src/database/migrations/50_rollback_security_rls.sql
-- ============================================================================

-- 1. Hủy hàm RPC phê duyệt
DROP FUNCTION IF EXISTS public.approve_submission_grading(UUID, UUID, JSONB, TEXT, UUID);

-- 2. Hủy các triggers và functions bảo vệ bài làm & câu trả lời
DROP TRIGGER IF EXISTS trg_assessment_submissions_integrity ON public.assessment_submissions;
DROP FUNCTION IF EXISTS public.trg_guard_assessment_submissions_integrity;

DROP TRIGGER IF EXISTS trg_submission_answers_integrity ON public.submission_answers;
DROP FUNCTION IF EXISTS public.trg_guard_submission_answers_integrity;

-- 3. Hủy policy bảo vệ ai_evaluations
DROP POLICY IF EXISTS "Strict view ai_evaluations" ON public.ai_evaluations;

-- 4. Khôi phục CHECK constraint trên user_organizations và organization_invitations
ALTER TABLE public.user_organizations
  DROP CONSTRAINT IF EXISTS user_organizations_org_role_check;

ALTER TABLE public.user_organizations
  ADD CONSTRAINT user_organizations_org_role_check
  CHECK (org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'REPORT_VIEWER', 'MEMBER'));

ALTER TABLE public.organization_invitations
  DROP CONSTRAINT IF EXISTS organization_invitations_org_role_check;

ALTER TABLE public.organization_invitations
  ADD CONSTRAINT organization_invitations_org_role_check
  CHECK (org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'REPORT_VIEWER', 'MEMBER'));
