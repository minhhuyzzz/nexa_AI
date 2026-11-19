'use client';

import React, { useState } from 'react';
import { Activity } from 'lucide-react';

export interface ActivityTrendPoint {
  date: string;
  submissions: number;
  users: number;
}

function getCubicBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function calculateYScale(maxVal: number) {
  const safeMax = Math.max(maxVal, 4);
  let step = 1;
  if (safeMax <= 4) step = 1;
  else if (safeMax <= 8) step = 2;
  else if (safeMax <= 16) step = 4;
  else if (safeMax <= 25) step = 5;
  else if (safeMax <= 50) step = 10;
  else step = Math.ceil(safeMax / 4 / 5) * 5;

  const yMax = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += step) {
    ticks.push(v);
  }
  return { yMax, ticks };
}

export function AdminActivityTrendChart({
  data,
  totalSubmissions,
  totalUsers,
}: {
  data: ActivityTrendPoint[];
  totalSubmissions: number;
  totalUsers: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => Math.max(d.submissions, d.users)), 1);
  const { yMax, ticks } = calculateYScale(maxVal);

  const SVG_W = 560;
  const SVG_H = 170;
  const X_PAD_LEFT = 36;
  const X_PAD_RIGHT = 18;
  const Y_PAD_TOP = 18;
  const Y_BOTTOM = 138;
  const CHART_W = SVG_W - X_PAD_LEFT - X_PAD_RIGHT;
  const CHART_H = Y_BOTTOM - Y_PAD_TOP;

  const n = data.length;
  const subPoints = data.map((d, i) => {
    const x = n > 1 ? X_PAD_LEFT + (i / (n - 1)) * CHART_W : X_PAD_LEFT + CHART_W / 2;
    const y = Y_BOTTOM - (d.submissions / yMax) * CHART_H;
    return { x, y };
  });

  const userPoints = data.map((d, i) => {
    const x = n > 1 ? X_PAD_LEFT + (i / (n - 1)) * CHART_W : X_PAD_LEFT + CHART_W / 2;
    const y = Y_BOTTOM - (d.users / yMax) * CHART_H;
    return { x, y };
  });

  const subLinePath = getCubicBezierPath(subPoints);
  const userLinePath = getCubicBezierPath(userPoints);

  const subAreaPath =
    subPoints.length > 0
      ? `${subLinePath} L ${subPoints[subPoints.length - 1].x.toFixed(1)} ${Y_BOTTOM} L ${subPoints[0].x.toFixed(1)} ${Y_BOTTOM} Z`
      : '';

  const userAreaPath =
    userPoints.length > 0
      ? `${userLinePath} L ${userPoints[userPoints.length - 1].x.toFixed(1)} ${Y_BOTTOM} L ${userPoints[0].x.toFixed(1)} ${Y_BOTTOM} Z`
      : '';

  const hoveredItem = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;
  const hoveredSubPoint = hoverIndex !== null && subPoints[hoverIndex] ? subPoints[hoverIndex] : null;

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Xu hướng hoạt động nền tảng
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600 dark:text-neutral-300 font-medium text-[11px]">Lượt nộp bài</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
              <span className="text-slate-600 dark:text-neutral-300 font-medium text-[11px]">Tài khoản mới</span>
            </div>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-neutral-400">
            Chưa có đủ dữ liệu hoạt động trong kỳ để hiển thị xu hướng.
          </div>
        ) : (
          <div
            className="relative pt-2 pb-1"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* SVG Chart */}
            <div className="relative w-full">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-auto overflow-visible select-none"
                role="img"
                aria-label="Biểu đồ xu hướng lượt nộp bài và tài khoản mới qua các mốc gần nhất"
              >
                <defs>
                  <linearGradient id="nexaSubmissionsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                    <stop offset="85%" stopColor="#2563EB" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="nexaUsersAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.14" />
                    <stop offset="85%" stopColor="#94A3B8" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Ticks & Gridlines */}
                {ticks.map((tickVal) => {
                  const y = Y_BOTTOM - (tickVal / yMax) * CHART_H;
                  const isBaseline = tickVal === 0;

                  return (
                    <g key={tickVal}>
                      <line
                        x1={X_PAD_LEFT}
                        y1={y}
                        x2={SVG_W - X_PAD_RIGHT}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray={isBaseline ? undefined : '3 3'}
                        strokeWidth="1"
                        className={
                          isBaseline
                            ? 'text-slate-200 dark:text-zinc-800'
                            : 'text-slate-100 dark:text-zinc-800/80'
                        }
                      />
                      <text
                        x={X_PAD_LEFT - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[10px] font-mono tabular-nums fill-slate-400 dark:fill-zinc-500 select-none"
                      >
                        {tickVal}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Dates */}
                {data.map((item, idx) => {
                  const x = n > 1 ? X_PAD_LEFT + (idx / (n - 1)) * CHART_W : X_PAD_LEFT + CHART_W / 2;
                  const isHovered = hoverIndex === idx;

                  return (
                    <text
                      key={idx}
                      x={x}
                      y={Y_BOTTOM + 18}
                      textAnchor="middle"
                      className={`text-[10px] font-mono select-none transition-colors ${
                        isHovered
                          ? 'fill-blue-600 dark:fill-blue-400 font-bold'
                          : 'fill-slate-500 dark:fill-neutral-400'
                      }`}
                    >
                      {item.date}
                    </text>
                  );
                })}

                {/* Area Fills */}
                {userAreaPath && <path d={userAreaPath} fill="url(#nexaUsersAreaGrad)" />}
                {subAreaPath && <path d={subAreaPath} fill="url(#nexaSubmissionsAreaGrad)" />}

                {/* Lines */}
                {userLinePath && (
                  <path
                    d={userLinePath}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="dark:stroke-zinc-500"
                  />
                )}
                {subLinePath && (
                  <path
                    d={subLinePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Permanent Data Point Dots */}
                {userPoints.map((p, idx) => (
                  <circle
                    key={`user-dot-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoverIndex === idx ? 4.5 : 2}
                    fill="#94A3B8"
                    stroke={hoverIndex === idx ? '#FFFFFF' : 'none'}
                    strokeWidth={hoverIndex === idx ? 2 : 0}
                    className="dark:fill-zinc-400 dark:stroke-[#111114] transition-all"
                  />
                ))}
                {subPoints.map((p, idx) => (
                  <circle
                    key={`sub-dot-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoverIndex === idx ? 5 : 2.5}
                    fill="#2563EB"
                    stroke={hoverIndex === idx ? '#FFFFFF' : 'none'}
                    strokeWidth={hoverIndex === idx ? 2 : 0}
                    className="dark:stroke-[#111114] transition-all"
                  />
                ))}

                {/* Vertical Crosshair Line when Hovered */}
                {hoveredSubPoint && (
                  <line
                    x1={hoveredSubPoint.x}
                    y1={Y_PAD_TOP}
                    x2={hoveredSubPoint.x}
                    y2={Y_BOTTOM}
                    stroke="#2563EB"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    strokeOpacity="0.4"
                  />
                )}

                {/* Invisible Hover Hit Targets for Each Day */}
                {data.map((_, idx) => {
                  const bandWidth = n > 1 ? CHART_W / (n - 1) : CHART_W;
                  const x = n > 1 ? X_PAD_LEFT + (idx / (n - 1)) * CHART_W : X_PAD_LEFT + CHART_W / 2;

                  return (
                    <rect
                      key={`hit-${idx}`}
                      x={x - bandWidth / 2}
                      y={Y_PAD_TOP}
                      width={bandWidth}
                      height={CHART_H + 24}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverIndex(idx)}
                      onTouchStart={() => setHoverIndex(idx)}
                    />
                  );
                })}
              </svg>

              {/* Floating Tooltip Card */}
              {hoveredItem && hoverIndex !== null && (
                <div
                  className="absolute pointer-events-none z-10 p-2.5 rounded-lg shadow-md bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xs border border-slate-200 dark:border-zinc-700 text-xs transition-all duration-150"
                  style={{
                    left: `${((X_PAD_LEFT + (hoverIndex / (n - 1)) * CHART_W) / SVG_W) * 100}%`,
                    top: '8px',
                    transform: hoverIndex >= n / 2 ? 'translateX(-105%)' : 'translateX(8%)',
                  }}
                >
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 font-mono text-[11px]">
                    Ngày {hoveredItem.date}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        <span>Lượt nộp:</span>
                      </div>
                      <span className="font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                        {hoveredItem.submissions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500 shrink-0" />
                        <span>Tài khoản mới:</span>
                      </div>
                      <span className="font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                        {hoveredItem.users}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom 3 Summary Metric Boxes */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50/70 dark:bg-zinc-900/50 text-center mt-3">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">Tổng bài nộp</span>
                <span className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {totalSubmissions}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">Tổng tài khoản</span>
                <span className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {totalUsers}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">Tần suất làm bài</span>
                <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                  {totalUsers > 0 ? (totalSubmissions / totalUsers).toFixed(1) : 0} lượt/user
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
