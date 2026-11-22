import type { Metadata } from 'next';
import { NotificationsView } from '@/components/dashboard/notifications/NotificationsView';

export const metadata: Metadata = {
  title: 'Thông báo | NEXA Personal',
  description: 'Theo dõi bài kiểm tra, điểm số và thông báo hệ thống',
};

export const dynamic = 'force-dynamic';

export default function PersonalNotificationsPage() {
  return <NotificationsView workspaceType="PERSONAL" />;
}
