import { Suspense } from 'react';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { CreateLiveRoomWizardView } from '@/components/dashboard/live-room/CreateLiveRoomWizardView';

export const dynamic = 'force-dynamic';

export default async function OrgNewLiveRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'VIEW_WORKSPACE');

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Đang nạp trình tạo phòng thi tổ chức...
        </div>
      }
    >
      <CreateLiveRoomWizardView
        workspace="ORGANIZATION"
        orgSlug={org.slug}
        organizationId={org.id}
        orgName={org.name}
      />
    </Suspense>
  );
}
