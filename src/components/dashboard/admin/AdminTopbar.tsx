'use client';

import { AdminAvatarMenu } from './AdminAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { ShieldAlert, Server } from 'lucide-react';

export function AdminTopbar() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-800">Cổng Quản Trị Hệ Thống NEXA</h1>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        <span className="hidden md:inline-block text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          QUẢN TRỊ VIÊN
        </span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <AdminAvatarMenu />
      </div>
    </header>
  );
}
