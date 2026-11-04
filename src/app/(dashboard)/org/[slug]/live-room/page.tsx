import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { LiveRoomDashboardView } from '@/components/dashboard/live-room/LiveRoomDashboardView';

export const dynamic = 'force-dynamic';

export default async function OrgLiveRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'VIEW_WORKSPACE');

  return (
    <LiveRoomDashboardView
      organizationId={org.id}
      orgSlug={org.slug}
      title="Phòng thi trực tiếp"
    />
  );
}
