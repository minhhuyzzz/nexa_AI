'use client';

import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Target,
  LayoutDashboard,
  FileCheck2,
  BookOpen,
  BarChart2,
  ArrowUpRight,
  User,
} from 'lucide-react';

export function HeroDashboardGraphic() {
  return (
    <div className="relative w-full max-w-[560px] lg:max-w-[620px] xl:max-w-[660px] select-none py-4 sm:py-8 px-1 sm:px-4">
      {/* 3D Perspective Canvas Container (Flat on mobile to prevent overflow, rich 3D on tablet & desktop) */}
      <div
        className="relative transition-all duration-700 ease-out hover:rotate-0 hover:scale-[1.015] group sm:[transform:perspective(1200px)_rotateY(-8deg)_rotateX(5deg)_rotateZ(-1deg)] sm:[transform-style:preserve-3d]"
      >
        {/* Soft Ambient Depth Glow behind the 3D card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-4 sm:-inset-6 bg-gradient-to-tr from-blue-500/12 via-sky-400/8 to-transparent blur-3xl rounded-[36px] -z-10"
        />

        {/* Floating Badge 1 (Top-Right): "Chuẩn hóa & tin cậy" */}
        <div
          className="absolute -top-3.5 right-2 sm:-top-5 sm:-right-4 z-30 flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md ring-1 ring-slate-200/90 dark:ring-zinc-800 shadow-[0_12px_28px_rgba(37,99,235,0.12),0_4px_10px_rgba(0,0,0,0.04)] transition-transform duration-500 group-hover:-translate-y-1 sm:[transform:translateZ(35px)]"
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Chuẩn hóa & tin cậy
          </span>
        </div>

        {/* Main 3D Hardware/Glassmorphism Board */}
        <div
          className="relative rounded-3xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-3.5 sm:p-6 ring-1 ring-slate-200/90 dark:ring-zinc-800/90 shadow-[0_30px_70px_-15px_rgba(37,99,235,0.14),0_16px_36px_-10px_rgba(0,0,0,0.08)] sm:[transform:translateZ(10px)]"
        >
          <div className="grid grid-cols-12 gap-3.5 sm:gap-5">
            {/* Left Micro Sidebar (Hidden on mobile to eliminate crushed truncated text, visible on sm:+) */}
            <div className="hidden sm:flex sm:col-span-3 flex-col justify-between py-1">
              <div className="space-y-1.5">
                {/* Active Pill: Tổng quan */}
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs ring-1 ring-blue-100 dark:ring-blue-900/40">
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                  <span className="truncate">Tổng quan</span>
                </div>

                {/* Inactive Pill: Khảo thí */}
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-slate-500 dark:text-neutral-400 font-medium text-xs hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
                  <FileCheck2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">Đánh giá</span>
                </div>

                {/* Inactive Pill: Học tập */}
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-slate-500 dark:text-neutral-400 font-medium text-xs hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">Học tập</span>
                </div>

                {/* Inactive Pill: Báo cáo */}
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-slate-500 dark:text-neutral-400 font-medium text-xs hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
                  <BarChart2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">Báo cáo</span>
                </div>
              </div>

              {/* Bottom Mini Status */}
              <div className="px-2 pt-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950 animate-pulse" />
              </div>
            </div>

            {/* Right Main Dashboard Panel (Full 12 cols on mobile, 9 cols on desktop) */}
            <div className="col-span-12 sm:col-span-9 space-y-3 sm:space-y-4">
              {/* Header Title + Avatar */}
              <div className="flex items-center justify-between">
                <div className="pr-20 sm:pr-0">
                  <h3 className="text-xs sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
                    Tổng quan năng lực số
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 font-normal">
                    Hồ sơ năng lực cập nhật theo thời gian thực
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center ring-1 ring-slate-200 dark:ring-zinc-700 shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.8} />
                </div>
              </div>

              {/* Top 2 Cards: Score Wave + Radar Chart (2 cols on mobile and desktop) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                {/* Metric Card 1: Score & Trend */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/80 ring-1 ring-slate-200/70 dark:ring-zinc-800/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                        Điểm năng lực số
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md ring-1 ring-emerald-200/60 dark:ring-emerald-900/40">
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        +12
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums tracking-tight">
                        76
                      </span>
                      <span className="text-xs text-slate-400 font-medium font-mono">/100</span>
                    </div>
                  </div>

                  {/* Pure SVG Wave Chart */}
                  <div className="mt-2.5 w-full h-12 relative overflow-hidden">
                    <svg viewBox="0 0 160 55" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="scoreWaveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area Fill */}
                      <path
                        d="M0,46 C32,44 55,48 85,34 C112,22 135,18 160,8 L160,55 L0,55 Z"
                        fill="url(#scoreWaveGrad)"
                      />
                      {/* Curve Line */}
                      <path
                        d="M0,46 C32,44 55,48 85,34 C112,22 135,18 160,8"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Terminal Glowing Dot */}
                      <circle cx="160" cy="8" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                {/* Metric Card 2: Pure SVG 5-Axis Competency Radar Chart */}
                <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/80 ring-1 ring-slate-200/70 dark:ring-zinc-800/70 flex items-center justify-center relative">
                  <div className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] relative">
                    <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
                      <defs>
                        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.18" />
                        </radialGradient>
                      </defs>

                      {/* Concentric Pentagonal Grid Rings (No borders, pure geometric vectors) */}
                      <polygon
                        points="60.0,44.0 75.2,55.1 69.4,72.9 50.6,72.9 44.8,55.1"
                        fill="none"
                        stroke="currentColor"
                        className="text-slate-200 dark:text-zinc-800"
                        strokeWidth="1"
                      />
                      <polygon
                        points="60.0,28.0 90.4,50.1 78.8,85.9 41.2,85.9 29.6,50.1"
                        fill="none"
                        stroke="currentColor"
                        className="text-slate-200 dark:text-zinc-800"
                        strokeWidth="1"
                      />
                      <polygon
                        points="60.0,12.0 105.7,45.2 88.2,98.8 31.8,98.8 14.3,45.2"
                        fill="none"
                        stroke="currentColor"
                        className="text-slate-300 dark:text-zinc-700"
                        strokeWidth="1.2"
                      />

                      {/* Radial Axis Spokes */}
                      <line x1="60" y1="60" x2="60.0" y2="12.0" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="60" y1="60" x2="105.7" y2="45.2" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="60" y1="60" x2="88.2" y2="98.8" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="60" y1="60" x2="31.8" y2="98.8" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="60" y1="60" x2="14.3" y2="45.2" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" strokeDasharray="2 2" />

                      {/* Active Competency Polygon Data */}
                      <polygon
                        points="60.0,20.6 100.2,46.9 79.2,86.4 38.6,89.5 21.2,47.4"
                        fill="url(#radarFill)"
                        stroke="#2563EB"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />

                      {/* 5 Domain Vertex Nodes */}
                      <circle cx="60.0" cy="20.6" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="100.2" cy="46.9" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="79.2" cy="86.4" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="38.6" cy="89.5" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="21.2" cy="47.4" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom Card: Lộ trình phát triển */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/80 ring-1 ring-slate-200/70 dark:ring-zinc-800/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Lộ trình phát triển
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                    60%
                  </span>
                </div>

                {/* Double Progress Track */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 w-[60%]" />
                  </div>
                  <div className="w-3/4 h-1.5 rounded-full bg-slate-200/50 dark:bg-zinc-800/60 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400/80 dark:bg-blue-500/60 w-[45%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Badge 2 (Bottom-Right): "Tiến bộ +12 điểm" with 100% PURE VECTOR SVG BARS (Khử sạch hoàn toàn vết tích nơ/sao của AI) */}
        <div
          className="absolute -bottom-4 right-1 sm:-bottom-6 sm:-right-4 z-30 flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md ring-1 ring-slate-200/90 dark:ring-zinc-800 shadow-[0_16px_36px_rgba(37,99,235,0.14),0_6px_14px_rgba(0,0,0,0.06)] transition-transform duration-500 group-hover:translate-y-1 sm:[transform:translateZ(45px)]"
        >
          {/* Trend Icon & Text */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center ring-1 ring-blue-100 dark:ring-blue-900/40 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.2} />
            </div>
            <div>
              <span className="block text-[9px] sm:text-[11px] font-medium text-slate-500 dark:text-neutral-400 leading-none">
                Tiến bộ
              </span>
              <span className="block text-[11px] sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums mt-0.5">
                +12 điểm
              </span>
            </div>
          </div>

          {/* 100% PURE VECTOR SVG COLUMN BARS (Hoàn toàn không có vết sọc, không có cánh nơ/sao AI bị lỗi) */}
          <div className="flex items-end gap-1 sm:gap-1.5 h-8 sm:h-10 px-0.5 sm:px-1">
            {/* Bar 1 */}
            <div className="w-2 sm:w-2.5 h-3 sm:h-4 rounded-full bg-gradient-to-t from-blue-400 to-sky-300 opacity-70" />
            {/* Bar 2 */}
            <div className="w-2 sm:w-2.5 h-4.5 sm:h-6 rounded-full bg-gradient-to-t from-blue-500 to-sky-400 opacity-85" />
            {/* Bar 3 */}
            <div className="w-2 sm:w-2.5 h-6 sm:h-8 rounded-full bg-gradient-to-t from-blue-600 to-blue-400" />
            {/* Bar 4 */}
            <div className="w-2 sm:w-2.5 h-8 sm:h-10 rounded-full bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroDashboardGraphic;