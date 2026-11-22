import type { Metadata } from 'next';
import { NotificationsView } from '@/components/dashboard/notifications/NotificationsView';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Thông báo | NEXA Business',
  description: 'Thông báo hoạt động, giao bài và phê duyệt trong tổ chức',
};

export const dynamic = 'force-dynamic';

export default async function OrgNotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let orgName = '';
  try {
    const adminSupabase = createAdminClient();
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('name')
      .eq('slug', slug)
      .maybeSingle();
    if (org?.name) orgName = org.name;
  } catch {}

  return (
    <NotificationsView
      workspaceType="ORGANIZATION"
      orgSlug={slug}
      orgName={orgName}
    />
  );
}
