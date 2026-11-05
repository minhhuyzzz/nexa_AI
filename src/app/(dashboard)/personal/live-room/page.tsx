import { Suspense } from 'react';
import { PersonalLiveRoomDashboardView } from '@/components/dashboard/personal/live-room/PersonalLiveRoomDashboardView';

export const dynamic = 'force-dynamic';

export default function PersonalLiveRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Đang nạp danh sách phòng thi...
        </div>
      }
    >
      <PersonalLiveRoomDashboardView />
    </Suspense>
  );
}
