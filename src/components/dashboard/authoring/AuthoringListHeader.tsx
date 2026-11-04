'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function AuthoringListHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Đề đánh giá của tôi
        </h1>
      </div>

      <div className="shrink-0">
        <Link
          href="/personal/authoring/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Soạn đề mới</span>
        </Link>
      </div>
    </div>
  );
}
