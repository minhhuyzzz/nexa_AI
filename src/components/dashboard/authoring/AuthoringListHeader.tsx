'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function AuthoringListHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            KHẢO THÍ CHUYÊN GIA
          </span>
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Quản lý Đề khảo thí
        </h1>

        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
          Tạo, cấu hình và phát hành các đề khảo thí chuyên nghiệp phục vụ đánh giá năng lực số.
        </p>
      </div>

      <div className="shrink-0">
        <Link
          href="/personal/authoring/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Soạn đề mới</span>
        </Link>
      </div>
    </div>
  );
}
