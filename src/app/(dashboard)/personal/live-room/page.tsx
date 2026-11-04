import { Suspense } from 'react';
import { LiveRoomDashboardView } from '@/components/dashboard/live-room/LiveRoomDashboardView';

export const dynamic = 'force-dynamic';

export default function EvaluatorLiveRoomPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải phòng thi...</div>}>
      <LiveRoomDashboardView />
    </Suspense>
  );
}
