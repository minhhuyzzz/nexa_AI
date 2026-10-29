-- ==============================================================================
-- NEXA MIGRATION 22: UPDATE ORGANIZATION INVITATIONS ROLE CONSTRAINT (P1-04 FIX)
-- ==============================================================================

-- Đồng bộ check constraint của bảng organization_invitations với user_organizations
-- Cho phép các vai trò B2B chuẩn hóa: ORG_OWNER, ORG_ADMIN, ASSESSOR, EVALUATOR, REPORT_VIEWER, MEMBER

ALTER TABLE public.organization_invitations
  DROP CONSTRAINT IF EXISTS organization_invitations_org_role_check;

ALTER TABLE public.organization_invitations
  ADD CONSTRAINT organization_invitations_org_role_check
  CHECK (org_role IN ('ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'REPORT_VIEWER', 'MEMBER'));
