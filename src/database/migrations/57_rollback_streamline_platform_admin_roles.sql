-- ==============================================================================
-- NEXA ROLLBACK 57: REVERT TO MIGRATION 33 ADMIN ROLES CHECK CONSTRAINT
-- ==============================================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_admin_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_admin_role_check
CHECK (admin_role IN ('SUPER_ADMIN', 'OPERATIONS_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'AI_OPERATOR', 'LEARNER'));
