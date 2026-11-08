'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Info } from 'lucide-react';

export function DataSourceRulesBox() {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Summary Title */}
        <div className="flex items-start gap-3 max-w-sm shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
              Quy tắc nguồn dữ liệu trong báo cáo
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              Chỉ những bài đánh giá đủ tiêu chuẩn đo năng lực mới được tính vào báo cáo 5 miền.
            </p>
          </div>
        </div>

        {/* Center: Inclusions and Exclusions Tags */}
        <div className="flex flex-wrap items-center gap-4 text-xs flex-1">
          {/* Group 1: Được tính */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Được tính:
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 font-medium text-[11px]">
              Baseline chuẩn
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 font-medium text-[11px]">
              Đợt đánh giá chuẩn
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 font-medium text-[11px]">
              Bài giao đã chấm hoàn tất
            </span>
          </div>

          {/* Divider */}
          <div className="hidden xl:block h-6 w-px bg-slate-200" />

          {/* Group 2: Báo cáo riêng */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              Báo cáo riêng:
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-zinc-800 text-[11px]">
              Phiên Live thông thường
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-zinc-800 text-[11px]">
              Bài luyện tập tự do
            </span>
          </div>
        </div>
      </div>

      {/* Right Note */}
      <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400">
        <Info className="w-3 h-3 text-slate-400 shrink-0" />
        <span>
          Lưu ý: Phiên Live thông thường có báo cáo phiên riêng trong Hoạt động khảo thí. Chỉ được đưa vào báo cáo năng lực số toàn tổ chức nếu là đề thi chuẩn và đã duyệt kết quả.
        </span>
      </div>
    </div>
  );
}
