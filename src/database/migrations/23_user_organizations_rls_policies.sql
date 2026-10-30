-- ==============================================================================
-- NEXA MIGRATION 23: USER_ORGANIZATIONS AND ORGANIZATIONS RLS POLICIES
-- ==============================================================================
-- Resolves issue where user_organizations had RLS enabled without SELECT policies,
-- causing organization memberships to return empty and preventing organization accounts
-- from entering their Organization Workspace (/org/[slug]).

-- 1. Allow authenticated SELECT on organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Allow authenticated select organizations'
  ) THEN
    CREATE POLICY "Allow authenticated select organizations" ON public.organizations
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 2. Allow SELECT and ALL on user_organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_organizations' AND policyname = 'Allow select user_organizations'
  ) THEN
    CREATE POLICY "Allow select user_organizations" ON public.user_organizations
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_organizations' AND policyname = 'Allow manage user_organizations'
  ) THEN
    CREATE POLICY "Allow manage user_organizations" ON public.user_organizations
      FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NOT NULL OR public.is_admin_or_service())
      WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL OR public.is_admin_or_service());
  END IF;
END $$;

-- 3. Ensure evaluator_nexa account is assigned ORG_ADMIN role in FPT Polytechnic
UPDATE public.user_organizations 
SET org_role = 'ORG_ADMIN' 
WHERE user_id = '22222222-2222-2222-2222-222222222222';
