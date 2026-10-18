'use client';

import { EvaluatorAvatarMenu } from './EvaluatorAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { ShieldCheck, BookOpen } from 'lucide-react';

export function EvaluatorTopbar() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-800">Cổng Khảo Thí &amp; Đánh Giá NEXA</h1>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        <span className="hidden md:inline-block text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          CHUYÊN GIA ĐÁNH GIÁ
        </span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <EvaluatorAvatarMenu />
      </div>
    </header>
  );
}
