'use client';

import React from 'react';
import { TimeSeriesTrendPoint } from '../types/org-analytics.types';
import { TrendingUp, Info, Calendar } from 'lucide-react';

interface PeriodTrendSectionProps {
  trend: TimeSeriesTrendPoint[];
  hasEnoughTrendData: boolean;
}

export function PeriodTrendSection({ trend, hasEnoughTrendData }: PeriodTrendSectionProps) {
  // SVG Line/Area Chart coordinates (Độ phân giải rộng 760x170 tạo không gian thoáng đãng)
  const svgWidth = 760;
  const svgHeight = 170;
  const paddingX = 60;
  const paddingTop = 25;
  const paddingBottom = 35;

  const validPoints = trend.filter((p) => p.averageScore !== null);
  const minScore = 50;
  const maxScore = 100;

  const getCoordinates = (index: number, score: number) => {
    const total = validPoints.length;
    const x =
      total === 1
        ? svgWidth / 2
        : paddingX + (index * (svgWidth - 2 * paddingX)) / (total - 1);
    const y =
      svgHeight -
      paddingBottom -
      ((score - minScore) / (maxScore - minScore)) *
        (svgHeight - paddingTop - paddingBottom);
    return { x, y };
  };

  const pointsCoords = validPoints.map((p, idx) => {
    const coords = getCoordinates(idx, p.averageScore!);
    return { ...p, ...coords };
  });

  const polylinePoints = pointsCoords.map((c) => `${c.x},${c.y}`).join(' ');

  // Tọa độ đường chuẩn 70 điểm
  const y70 =
    svgHeight -
    paddingBottom -
    ((70 - minScore) / (maxScore - minScore)) *
      (svgHeight - paddingTop - paddingBottom);

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <span>Tiến bộ năng lực số theo thời gian</span>
            <span
              title="Đo lường sự biến đổi điểm năng lực trung bình qua các mốc thời gian hoặc kỳ khảo thí tương thích."
              className="text-slate-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-help"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
            Đường xu hướng điểm số trung bình toàn tổ chức qua các mốc đánh giá định kỳ.
          </p>
        </div>

        {hasEnoughTrendData && validPoints.length >= 2 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-neutral-400">
              <span className="w-2.5 h-0.5 bg-blue-600 rounded-full" />
              <span>Điểm trung bình</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-neutral-500">
              <svg className="w-3 h-1" viewBox="0 0 12 2"><line x1="0" y1="1" x2="12" y2="1" stroke="currentColor" strokeDasharray="2,2" strokeWidth="1.5" className="text-slate-400" /></svg>
              <span>Chuẩn đạt (70đ)</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Chart Area */}
      <div className="mt-4 flex-1 flex items-center justify-center min-h-[170px]">
        {hasEnoughTrendData && validPoints.length >= 2 ? (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full min-w-[500px] h-44 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Subtle Horizontal Gridlines (60, 75, 90) */}
              {[60, 75, 90].map((score) => {
                const y =
                  svgHeight -
                  paddingBottom -
                  ((score - minScore) / (maxScore - minScore)) *
                    (svgHeight - paddingTop - paddingBottom);
                return (
                  <g key={score}>
                    <line
                      x1={paddingX - 15}
                      y1={y}
                      x2={svgWidth - paddingX + 15}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      className="text-slate-200 dark:text-zinc-800"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 22}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="currentColor"
                      className="text-slate-400 dark:text-neutral-500 font-mono"
                    >
                      {score}
                    </text>
                  </g>
                );
              })}

              {/* Đường chuẩn 70 điểm */}
              <line
                x1={paddingX - 15}
                y1={y70}
                x2={svgWidth - paddingX + 15}
                y2={y70}
                stroke="#2563EB"
                strokeDasharray="4 4"
                strokeOpacity="0.35"
                strokeWidth="1.2"
              />

              {/* Area gradient under line */}
              {polylinePoints && (
                <polygon
                  fill="url(#trendAreaGradient)"
                  points={`${pointsCoords[0].x},${svgHeight - paddingBottom} ${polylinePoints} ${pointsCoords[pointsCoords.length - 1].x},${svgHeight - paddingBottom}`}
                />
              )}

              {/* Connecting Line */}
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
                className="dark:stroke-blue-400"
              />

              {/* Data Points with tooltips & values */}
              {pointsCoords.map((pt) => (
                <g key={pt.key} className="group cursor-pointer">
                  {/* Point Circle */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    className="dark:stroke-zinc-900 dark:fill-blue-400 transition-transform group-hover:scale-125"
                  />

                  {/* Score Label above point */}
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="currentColor"
                    className="text-neutral-900 dark:text-neutral-100 font-mono tabular-nums"
                  >
                    {pt.averageScore}
                  </text>

                  {/* Period Label on X Axis */}
                  <text
                    x={pt.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="currentColor"
                    className="text-slate-600 dark:text-neutral-300"
                  >
                    {pt.periodLabel}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          /* Empty State: Chưa đủ 2 mốc thời gian */
          <div className="py-8 px-4 text-center max-w-md mx-auto space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto ring-4 ring-blue-50/50 dark:ring-blue-950/30">
              <TrendingUp className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
              Chưa đủ dữ liệu phân tích xu hướng
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
              Cần có kết quả từ ít nhất hai mốc thời gian hoặc đợt khảo thí để hệ thống tự động vẽ đường xu hướng tiến bộ năng lực số của tổ chức.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
