'use client';

import { usePathname } from 'next/navigation';
import { User, Award, Shield, X } from 'lucide-react';
import { useState } from 'react';

export function DemoRoleSwitcher() {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(false);

  const isLearner = pathname.startsWith('/learner');
  const isEvaluator = pathname.startsWith('/evaluator');
  const isAdmin = pathname.startsWith('/admin');

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-md border border-slate-700 shadow-md flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer"
        title="Mở bảng chuyển đổi vai trò Demo"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>TEST MODE</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-slate-300 rounded-md shadow-md p-2.5 max-w-sm text-xs font-sans">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 font-mono">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span>CHUYỂN NHANH VAI TRÒ (DEV TEST)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <span className="text-[10px]">—</span>
          </button>
          <a
            href="/api/auth/demo?action=clear"
            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
            title="Đăng xuất về Trang chủ"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {/* Learner Switch */}
        <a
          href="/api/auth/demo?role=LEARNER"
          title="learner@nexa.edu.vn (Nexa@2026)"
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors border ${
            isLearner
              ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <User className="w-3 h-3" strokeWidth={1.75} />
          <span>Học viên</span>
        </a>

        {/* Evaluator Switch */}
        <a
          href="/api/auth/demo?role=EVALUATOR"
          title="evaluator@nexa.edu.vn (Nexa@2026)"
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors border ${
            isEvaluator
              ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3 h-3" strokeWidth={1.75} />
          <span>Chuyên gia</span>
        </a>

        {/* Admin Switch */}
        <a
          href="/api/auth/demo?role=ADMIN"
          title="admin.nexa@gmail.com (Nexa@2026)"
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors border ${
            isAdmin
              ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3 h-3" strokeWidth={1.75} />
          <span>Admin</span>
        </a>
      </div>
    </div>
  );
}
