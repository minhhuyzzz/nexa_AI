import { Suspense } from 'react';
import { CreateLiveRoomWizardView } from '@/components/dashboard/live-room/CreateLiveRoomWizardView';

export const dynamic = 'force-dynamic';

export default function PersonalNewLiveRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Đang nạp trình tạo phòng thi...
        </div>
      }
    >
      <CreateLiveRoomWizardView workspace="PERSONAL" />
    </Suspense>
  );
}
