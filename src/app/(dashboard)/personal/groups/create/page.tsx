'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CreatePersonalGroupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/personal/groups?create=true');
  }, [router]);

  return (
    <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-2 text-xs font-sans">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
      <span>Đang chuyển đến không gian Lớp &amp; Nhóm...</span>
    </div>
  );
}
