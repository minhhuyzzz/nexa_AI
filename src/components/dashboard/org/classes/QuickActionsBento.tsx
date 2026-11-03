'use client';

import React from 'react';
import { Plus, UserPlus, FileSpreadsheet, Download, Zap } from 'lucide-react';

interface QuickActionsBentoProps {
  onOpenCreateClass: () => void;
  onOpenAddMembers: () => void;
  onOpenAssignAssessment: () => void;
  onExportList: () => void;
}

export function QuickActionsBento({
  onOpenCreateClass,
  onOpenAddMembers,
  onOpenAssignAssessment,
  onExportList,
}: QuickActionsBentoProps) {
  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Truy cập nhanh
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Các thao tác thường dùng khi vận hành lớp và nhóm.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={onOpenCreateClass}
          className="flex flex-col items-center justify-center p-3.5 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition group text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-105 transition-transform shadow-xs">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Tạo lớp
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenAddMembers}
          className="flex flex-col items-center justify-center p-3.5 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition group text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-105 transition-transform shadow-xs">
            <UserPlus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Thêm thành viên
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenAssignAssessment}
          className="flex flex-col items-center justify-center p-3.5 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition group text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-105 transition-transform shadow-xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Giao đề đánh giá
          </span>
        </button>

        <button
          type="button"
          onClick={onExportList}
          className="flex flex-col items-center justify-center p-3.5 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition group text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-105 transition-transform shadow-xs">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Xuất danh sách
          </span>
        </button>
      </div>
    </div>
  );
}
