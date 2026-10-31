-- ==============================================================================
-- NEXA MIGRATION 33: USER SUSPENSION AND ADMIN ROLE HARDENING
-- ==============================================================================

-- 1. Add suspension fields to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT 'LEARNER' 
  CHECK (admin_role IN ('SUPER_ADMIN', 'OPERATIONS_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'AI_OPERATOR', 'LEARNER'));

CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role ON public.profiles(admin_role);

-- 2. Backfill super admin role for existing ADMIN profiles
UPDATE public.profiles
SET admin_role = 'SUPER_ADMIN'
WHERE role = 'ADMIN' AND (admin_role IS NULL OR admin_role = 'LEARNER');
