import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrgSettingsView } from '@/components/dashboard/org/OrgSettingsView';

export const dynamic = 'force-dynamic';

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org, role, isSuperadmin } = await requireOrgPagePermission(slug, 'MANAGE_SETTINGS');

  const userRole = isSuperadmin ? 'ORG_ADMIN' : role;
  const isManager = userRole === 'ORG_ADMIN' || userRole === 'ORG_OWNER' || isSuperadmin;

  let availableAdmins: Array<{ id: string; name: string; email: string }> = [];
  if (role === 'ORG_OWNER') {
    const adminSupabase = createAdminClient();
    const { data: adminMembers } = await adminSupabase
      .from('user_organizations')
      .select(`
        user_id,
        profiles ( id, nickname, email, full_name )
      `)
      .eq('organization_id', org.id)
      .eq('org_role', 'ORG_ADMIN')
      .eq('status', 'ACTIVE');

    availableAdmins = (adminMembers || []).map((m: any) => ({
      id: m.user_id,
      name: m.profiles?.full_name || m.profiles?.nickname || m.profiles?.email || 'Quản trị viên',
      email: m.profiles?.email || '',
    }));
  }

  return (
    <OrgSettingsView
      org={org as any}
      userRole={userRole}
      isManager={isManager}
      availableAdmins={availableAdmins}
    />
  );
}
