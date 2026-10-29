'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const pin = searchParams.get('pin') || '';
    const roomId = searchParams.get('roomId') || '';
    const assessmentId = searchParams.get('assessmentId') || '';
    router.replace(
      `/live/waiting-room?pin=${encodeURIComponent(pin)}&roomId=${encodeURIComponent(
        roomId
      )}&assessmentId=${encodeURIComponent(assessmentId)}`
    );
  }, [router, searchParams]);

  return (
    <div className="p-12 text-center space-y-3">
      <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" strokeWidth={1.75} />
      <div className="text-sm font-semibold text-slate-800">
        Đang chuyển tiếp sang phòng chờ toàn màn hình...
      </div>
    </div>
  );
}

export default function WaitingRoomRedirectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang chuyển hướng...</div>}>
      <RedirectContent />
    </Suspense>
  );
}
