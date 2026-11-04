import { requireOrgPagePermission } from '@/lib/auth/org-guard';
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

  return (
    <OrgSettingsView
      org={org as any}
      userRole={userRole}
      isManager={isManager}
    />
  );
}
