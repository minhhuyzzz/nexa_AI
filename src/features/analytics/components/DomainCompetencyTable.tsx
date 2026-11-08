'use client';

import React from 'react';
import { DomainMetric } from '../types/org-analytics.types';
import { ChevronRight, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  domains: DomainMetric[];
  onSelectDomain: (domain: DomainMetric) => void;
}

export function DomainCompetencyTable({ domains, onSelectDomain }: Props) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            Phân Tích Chi Tiết 5 Miền Năng Lực Số
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Dữ liệu tổng hợp có đối chiếu từ các bài thi đã được phê duyệt điểm chính thức.
          </p>
        </div>
        <div className="text-[11px] text-slate-400 dark:text-neutral-500 flex items-center gap-1.5 self-start sm:self-auto">
          <span>Chọn một hàng để xem chi tiết miền</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-neutral-300 font-semibold">
              <th className="py-3 px-4 w-16">Mã</th>
              <th className="py-3 px-4">Miền năng lực</th>
              <th className="py-3 px-4 text-right">Điểm trung bình</th>
              <th className="py-3 px-4 text-right">Bài thi hợp lệ</th>
              <th className="py-3 px-4 text-center">Đánh giá trình độ</th>
              <th className="py-3 px-4 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="">
            {domains.map((domain) => {
              const score = domain.score;
              const isEvaluated = score !== null;
              const isProficient = isEvaluated && score >= 75;
              const isBasic = isEvaluated && score >= 60 && score < 75;
              const isGap = isEvaluated && score < 60;

              return (
                <tr
                  key={domain.domainCode}
                  onClick={() => onSelectDomain(domain)}
                  className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                      {domain.domainCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-neutral-100">
                      {domain.name}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500 line-clamp-1 mt-0.5 max-w-md">
                      {domain.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-neutral-100">
                    {isEvaluated ? `${score}đ` : (
                      <span className="text-slate-400 dark:text-neutral-500 font-normal italic">
                        Chưa có dữ liệu
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                    {domain.testedCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {!isEvaluated ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                        <HelpCircle className="w-3 h-3" />
                        Chưa khảo thí
                      </span>
                    ) : isProficient ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" />
                        Thành thạo (&ge; 75đ)
                      </span>
                    ) : isGap ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                        <AlertCircle className="w-3 h-3" />
                        Cần bồi dưỡng (&lt; 60đ)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        Mức cơ bản (60 - 74đ)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
