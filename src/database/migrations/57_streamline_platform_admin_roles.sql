-- ==============================================================================
-- NEXA MIGRATION 57: STREAMLINE PLATFORM ADMIN ROLES (2-TIER RBAC)
-- ==============================================================================

-- 1. Drop previous constraint on admin_role if exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_admin_role_check;

-- 2. Add streamlined check constraint allowing 'ADMIN' and legacy roles for compatibility
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_admin_role_check
CHECK (admin_role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'AI_OPERATOR', 'LEARNER'));
