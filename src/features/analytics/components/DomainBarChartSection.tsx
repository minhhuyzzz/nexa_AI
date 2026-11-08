'use client';

import React from 'react';
import { DomainMetric } from '../types/org-analytics.types';
import { Info, ChevronRight } from 'lucide-react';

interface DomainBarChartSectionProps {
  domains: DomainMetric[];
  onDomainClick: (domain: DomainMetric) => void;
}

const DOMAIN_BADGE_COLORS: Record<string, string> = {
  D1: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  D2: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  D3: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  D4: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  D5: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800',
};

export function DomainBarChartSection({ domains, onDomainClick }: DomainBarChartSectionProps) {
  const numberFormat = new Intl.NumberFormat('vi-VN');

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <span>Kết quả theo 5 miền năng lực số</span>
            <span
              title="Điểm số trung bình và độ phủ dữ liệu được tổng hợp từ các bài đánh giá hợp lệ."
              className="text-slate-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-help"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </h2>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
          Điểm trung bình và độ phủ dữ liệu theo từng miền (nhấp vào một miền để xem chi tiết).
        </p>
      </div>

      {/* 5 Horizontal Bars List */}
      <div className="mt-5 space-y-4">
        {domains.map((d) => {
          const badgeClass =
            DOMAIN_BADGE_COLORS[d.domainCode] ||
            'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700';

          const hasData = d.score !== null;
          const scoreWidth = hasData ? Math.min(Math.max(d.score!, 0), 100) : 0;

          return (
            <div
              key={d.domainCode}
              onClick={() => onDomainClick(d)}
              className="group p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200/80 dark:hover:border-zinc-800"
              title={`Nhấp để xem phân tích chi tiết miền ${d.domainCode}`}
            >
              {/* Row 1: Badge, Name, Score, and Coverage info */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border shrink-0 ${badgeClass}`}
                  >
                    {d.domainCode}
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {d.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  {hasData ? (
                    <>
                      <span className="font-mono font-extrabold text-neutral-900 dark:text-neutral-100 text-sm tabular-nums">
                        {d.score}
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono w-24 text-right tabular-nums">
                        <div className="font-semibold text-neutral-800 dark:text-zinc-200">
                          {d.coverageRate !== null ? `${d.coverageRate}%` : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-normal">
                          {numberFormat.format(d.testedCount)} người
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium italic">
                      Chưa đủ dữ liệu
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-neutral-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Row 2: Horizontal Bar Track */}
              <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800/80 overflow-hidden relative">
                {hasData && (
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${scoreWidth}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
