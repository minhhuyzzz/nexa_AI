import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgSettingsView } from '@/components/dashboard/org/OrgSettingsView';

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org, role, isSuperadmin } = await requireOrgPagePermission(slug, 'MANAGE_SETTINGS');
  const adminSupabase = createAdminClient();

  const userRole = isSuperadmin ? 'ORG_ADMIN' : role;
  const isManager = userRole === 'ORG_ADMIN' || userRole === 'ORG_OWNER' || isSuperadmin;

  // Count current active members
  const { count: memberCount } = await adminSupabase
    .from('user_organizations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'ACTIVE');

  const currentMembers = memberCount || 1;

  return (
    <OrgSettingsView
      org={org}
      currentMembers={currentMembers}
      userRole={userRole}
      isManager={isManager}
    />
  );
}
