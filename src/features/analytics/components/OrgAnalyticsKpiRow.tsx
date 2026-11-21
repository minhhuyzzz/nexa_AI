'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Layers,
  BarChart2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { OrgAnalyticsSummary } from '../types/org-analytics.types';

interface OrgAnalyticsKpiRowProps {
  summary: OrgAnalyticsSummary;
  orgSlug: string;
}

export function OrgAnalyticsKpiRow({ summary, orgSlug }: OrgAnalyticsKpiRowProps) {
  const numberFormat = new Intl.NumberFormat('vi-VN');

  const hasEvaluated = summary.evaluatedSubmissions > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
      {/* KPI 1: Người có bằng chứng đánh giá */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide truncate">
            Có bằng chứng
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="mt-2 sm:mt-2.5">
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight tabular-nums">
            {hasEvaluated ? numberFormat.format(summary.uniqueUsersWithEvidence) : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mt-0.5 sm:mt-1 truncate">
            {summary.uniqueUsersChange !== null ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                +{summary.uniqueUsersChange}%
              </span>
            ) : (
              'Có kết quả hợp lệ'
            )}
          </div>
        </div>
      </div>

      {/* KPI 2: Độ phủ 5 miền */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide truncate">
            Độ phủ 5 miền
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="mt-2 sm:mt-2.5">
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight tabular-nums">
            {summary.fiveDomainCoverageRate !== null
              ? `${summary.fiveDomainCoverageRate}%`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mt-0.5 sm:mt-1 truncate">
            {hasEvaluated
              ? `${numberFormat.format(summary.fiveDomainEligibleCount)} / ${numberFormat.format(
                  summary.totalScopeUsers
                )}`
              : 'Đủ 5 miền'}
          </div>
        </div>
      </div>

      {/* KPI 3: Điểm năng lực trung bình */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide truncate">
            Điểm NL TB
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="mt-2 sm:mt-2.5">
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight tabular-nums">
            {summary.overallAverageScore !== null ? (
              <>
                {summary.overallAverageScore}
                <span className="text-xs sm:text-sm font-normal text-slate-400 dark:text-neutral-500">/100</span>
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mt-0.5 sm:mt-1 truncate">
            {summary.averageScoreChange !== null ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                +{summary.averageScoreChange}đ
              </span>
            ) : (
              'Thang điểm 100'
            )}
          </div>
        </div>
      </div>

      {/* KPI 4: Tỷ lệ đạt chuẩn */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide truncate">
            Đạt chuẩn
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="mt-2 sm:mt-2.5">
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight tabular-nums">
            {hasEvaluated ? `${summary.overallPassRate}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mt-0.5 sm:mt-1 truncate">
            {summary.passRateChange !== null ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                +{summary.passRateChange}%
              </span>
            ) : (
              'Chuẩn ≥ 70%'
            )}
          </div>
        </div>
      </div>

      {/* KPI 5: Bài chờ chấm / công bố (full width row on mobile) */}
      <Link
        href={`/org/${orgSlug}/campaigns`}
        className="col-span-2 lg:col-span-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-colors group cursor-pointer min-w-0"
        title="Nhấp để xem hoạt động khảo thí & xử lý bài thi"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            Bài chờ xử lý
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="mt-2 sm:mt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight tabular-nums">
              {numberFormat.format(summary.pendingTotalCount)}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mt-0.5 sm:mt-1 truncate">
            {summary.pendingGradingCount} chờ chấm &bull; {summary.pendingPublishCount} chờ công bố
          </div>
        </div>
      </Link>
    </div>
  );
}
