import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PersonalLiveRoomDashboardView } from '@/components/dashboard/personal/live-room/PersonalLiveRoomDashboardView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Phòng đánh giá trực tiếp | NEXA AI',
  description: 'Tổ chức và tham gia phiên đánh giá năng lực số trực tiếp theo thời gian thực với mã PIN bảo mật.',
};

export default function PersonalLiveRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Đang nạp danh sách phòng đánh giá...
        </div>
      }
    >
      <PersonalLiveRoomDashboardView />
    </Suspense>
  );
}
