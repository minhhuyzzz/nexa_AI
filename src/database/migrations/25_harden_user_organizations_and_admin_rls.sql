-- ==============================================================================
-- NEXA MIGRATION 25: HARDEN USER_ORGANIZATIONS AND ORGANIZATIONS RLS (SECURITY GATE)
-- ==============================================================================
-- Resolves ORG-F01: Removes overly permissive RLS policies ('auth.uid() IS NOT NULL'
-- and 'SELECT true') from user_organizations and organizations, eliminates table-level
-- mutation grants for anon, and establishes strict multi-tenant isolation.

-- 1. Revoke unauthorized table permissions
REVOKE ALL ON public.user_organizations FROM anon;
REVOKE ALL ON public.organizations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_organizations FROM authenticated;
GRANT SELECT ON public.user_organizations TO authenticated;

-- 2. Drop insecure legacy policies
DROP POLICY IF EXISTS "Allow select user_organizations" ON public.user_organizations;
DROP POLICY IF EXISTS "Allow manage user_organizations" ON public.user_organizations;
DROP POLICY IF EXISTS "Allow authenticated select organizations" ON public.organizations;
DROP POLICY IF EXISTS "user_org_select_own" ON public.user_organizations;
DROP POLICY IF EXISTS "user_org_select_managed" ON public.user_organizations;
DROP POLICY IF EXISTS "user_org_admin_full_access" ON public.user_organizations;
DROP POLICY IF EXISTS "org_select_member" ON public.organizations;
DROP POLICY IF EXISTS "org_admin_full_access" ON public.organizations;

-- 3. Security definer helper to query managed organizations without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_managed_org_ids(p_user_id UUID)
RETURNS TABLE (organization_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT uo.organization_id 
  FROM public.user_organizations uo
  WHERE uo.user_id = p_user_id 
    AND uo.status = 'ACTIVE' 
    AND uo.org_role IN ('ORG_ADMIN', 'ORG_OWNER');
$$;

-- 4. Enable RLS explicitly
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies for user_organizations
-- 5a. Users can view their own membership records
CREATE POLICY "user_org_select_own" ON public.user_organizations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 5b. Organization managers (ORG_ADMIN, ORG_OWNER) can view memberships within their managed orgs
CREATE POLICY "user_org_select_managed" ON public.user_organizations
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid())));

-- 5c. Platform Admin and service_role have full access
CREATE POLICY "user_org_admin_full_access" ON public.user_organizations
  FOR ALL TO authenticated
  USING (public.is_admin_or_service())
  WITH CHECK (public.is_admin_or_service());

-- 6. Strict RLS Policies for organizations
-- 6a. Users can view organizations where they hold an ACTIVE membership
CREATE POLICY "org_select_member" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT uo.organization_id 
      FROM public.user_organizations uo 
      WHERE uo.user_id = auth.uid() 
        AND uo.status = 'ACTIVE'
    )
  );

-- 6b. Platform Admin and service_role have full management access
CREATE POLICY "org_admin_full_access" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_admin_or_service())
  WITH CHECK (public.is_admin_or_service());
