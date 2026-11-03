'use client';

import React from 'react';
import { TimeSeriesTrendPoint } from '../types/org-analytics.types';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface Props {
  trend: TimeSeriesTrendPoint[];
}

export function TrendAnalysisView({ trend }: Props) {
  if (trend.length === 0) {
    return (
      <div className="p-8 text-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
        <BarChart2 className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.75} />
        <h3 className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
          Chưa đủ dữ liệu để xây dựng xu hướng
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5 max-w-md mx-auto">
          Biểu đồ và bảng tiến trình xu hướng sẽ tự động hình thành khi có ít nhất một đợt khảo thí được phê duyệt kết quả chính thức.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Biến Thiên Năng Lực Qua Các Kỳ Khảo Thí
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Theo dõi sự cải thiện điểm số 5 miền cốt lõi theo dòng thời gian các đợt đánh giá đã hoàn thành.
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
            Dữ liệu <span className="font-semibold text-slate-800 dark:text-neutral-200">{trend.length}</span> mốc khảo thí
          </div>
        </div>

        {/* Minimalist SVG Trend Chart */}
        <div className="p-4 rounded-md bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800">
          <div className="text-[11px] font-medium text-slate-600 dark:text-neutral-300 mb-3 flex items-center justify-between">
            <span>Điểm trung bình toàn đơn vị (%)</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full inline-block" />
                Điểm TB
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-0.5 bg-slate-300 dark:bg-zinc-600 rounded-full inline-block" />
                Chuẩn đạt (70đ)
              </span>
            </div>
          </div>

          {/* Simple Clean Responsive SVG Chart */}
          <div className="h-44 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${Math.max(400, trend.length * 120)} 150`} preserveAspectRatio="none">
              {/* Benchmark Line at 70% (Y: 150 - (70/100)*120 = 66) */}
              <line
                x1="0"
                y1="66"
                x2="100%"
                y2="66"
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-slate-300 dark:text-zinc-700"
                strokeWidth="1"
              />

              {/* Data points and line */}
              {trend.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={trend
                    .map((pt, i) => {
                      const totalWidth = Math.max(400, trend.length * 120);
                      const x = (i / (trend.length - 1)) * (totalWidth - 60) + 30;
                      const score = pt.averageScore ?? 0;
                      const y = 140 - (score / 100) * 120;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Point circles */}
              {trend.map((pt, i) => {
                const totalWidth = Math.max(400, trend.length * 120);
                const x = trend.length === 1 ? totalWidth / 2 : (i / (trend.length - 1)) * (totalWidth - 60) + 30;
                const score = pt.averageScore ?? 0;
                const y = 140 - (score / 100) * 120;

                return (
                  <g key={pt.key}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-black stroke-2"
                    />
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-[11px] font-mono font-bold fill-slate-900 dark:fill-neutral-100"
                    >
                      {score}đ
                    </text>
                    <text
                      x={x}
                      y={148}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-500 dark:fill-neutral-400 font-sans"
                    >
                      {pt.periodLabel.length > 15 ? `${pt.periodLabel.substring(0, 15)}...` : pt.periodLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
            Bảng Số Liệu Chi Tiết 5 Miền Theo Kỳ
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-300 font-semibold">
                <th className="py-2.5 px-4">Kỳ khảo thí</th>
                <th className="py-2.5 px-4 text-right">Bài thi đã duyệt</th>
                <th className="py-2.5 px-4 text-right">Điểm TB toàn kỳ</th>
                <th className="py-2.5 px-4 text-center">D1</th>
                <th className="py-2.5 px-4 text-center">D2</th>
                <th className="py-2.5 px-4 text-center">D3</th>
                <th className="py-2.5 px-4 text-center">D4</th>
                <th className="py-2.5 px-4 text-center">D5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {trend.map((pt) => (
                <tr key={pt.key} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-neutral-100">
                    {pt.periodLabel}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                    {pt.evaluatedCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                    {pt.averageScore}đ
                  </td>
                  {['D1', 'D2', 'D3', 'D4', 'D5'].map((code) => {
                    const score = pt.domainScores[code];
                    return (
                      <td key={code} className="py-3 px-4 text-center font-mono tabular-nums">
                        {score !== null ? (
                          <span
                            className={
                              score >= 70
                                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                : score < 60
                                ? 'text-amber-700 dark:text-amber-400 font-semibold'
                                : 'text-slate-700 dark:text-zinc-300'
                            }
                          >
                            {score}đ
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-neutral-500">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
