'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  SlidersHorizontal,
  ArrowUpRight,
  Route,
  QrCode,
  CheckCircle2,
} from 'lucide-react';

export function CoreHighlightsSection() {
  return (
    <section id="features" className="py-8 sm:py-12 bg-white dark:bg-black transition-colors scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact 4-Card Bento Grid - Perfectly fitted in a single screen */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {/* Card 1 (Left): Hero Roadmap Card (Spans 2 cols on desktop) */}
          <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-[#071224] via-[#0b172d] to-[#02050e] text-white p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden ring-1 ring-blue-950/60 shadow-lg min-h-0 sm:min-h-[420px]">
            {/* Topographic Wave Graphic Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
              <svg
                className="w-full h-full object-cover"
                viewBox="0 0 800 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M-50 450 C 150 350, 250 520, 450 400 C 650 280, 750 480, 900 350"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="4 8"
                />
                <path
                  d="M-50 380 C 180 260, 280 440, 480 320 C 680 200, 780 400, 900 280"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                />
                <path
                  d="M-50 310 C 200 180, 300 360, 500 240 C 700 120, 800 320, 900 210"
                  stroke="#2563eb"
                  strokeWidth="3"
                />
              </svg>
            </div>

            {/* Subtle Light Glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Lộ trình thích ứng
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug mt-1.5 max-w-xl">
                Bồi dưỡng đúng khoảng trống qua kết quả khảo thí
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl font-normal">
                Hệ thống tự động phân tích bài làm đầu vào, chỉ ra năng lực còn yếu và kích hoạt đúng chuyên đề luyện tập tương ứng để củng cố năng lực.
              </p>
            </div>

            {/* 3 Milestones: Mobile Horizontal Swipe, Desktop 3-Column */}
            <div className="relative z-10 mt-5 pt-1">
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-3 no-scrollbar">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 w-[74vw] max-w-[240px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Giai đoạn 1</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white">Khảo thí đầu vào</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Xác định điểm cơ sở và lập bản đồ năng lực cá nhân
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-600/30 backdrop-blur-md ring-1 ring-blue-400/50 w-[74vw] max-w-[240px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 mb-1.5">
                    <Route className="w-3.5 h-3.5 shrink-0" />
                    <span>Giai đoạn 2</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white">Luyện tập trọng tâm</div>
                  <div className="text-[11px] text-blue-200 mt-1 leading-snug">
                    Bồi dưỡng theo chuyên đề ngắn đúng điểm còn thiếu
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 w-[74vw] max-w-[240px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Giai đoạn 3</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white">Khảo thí định kỳ</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Đánh giá lại để ghi nhận sự tiến bộ thực chất
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Sleek Compact Cards stacked vertically */}
          <div className="lg:col-span-1 flex flex-col gap-3 sm:gap-3.5 justify-between">
            {/* Card 2: Solid Cobalt Blue Stat Card */}
            <div className="rounded-3xl bg-blue-600 text-white p-5 sm:p-5.5 flex flex-col justify-between shadow-md relative overflow-hidden flex-1">
              <div className="flex items-center justify-between">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                  100%
                </span>
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white ring-1 ring-white/20">
                  <ShieldCheck className="w-4.5 h-4.5" strokeWidth={2} />
                </div>
              </div>
              <div className="mt-2.5">
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                  Khảo thí viên toàn quyền duyệt
                </h4>
                <p className="mt-1 text-[11px] sm:text-xs text-blue-100/90 leading-relaxed">
                  Minh bạch tiêu chí. AI chỉ hỗ trợ đề xuất nhận xét — khảo thí viên toàn quyền kiểm tra, điều chỉnh và công bố.
                </p>
              </div>
            </div>

            {/* Card 3: Clean Rubric Feature Card */}
            <div className="rounded-3xl bg-white dark:bg-zinc-900 ring-1 ring-slate-200/90 dark:ring-zinc-800 p-5 sm:p-5.5 flex flex-col justify-between shadow-xs flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                  Bàn chấm Rubric đa tiêu chí
                </h4>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center ring-1 ring-blue-100 dark:ring-blue-900/50">
                  <SlidersHorizontal className="w-4.5 h-4.5" strokeWidth={2} />
                </div>
              </div>
              <p className="mt-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Khung đánh giá chuẩn hóa từng mức độ từ nhận biết, thông hiểu đến vận dụng thực tiễn, bảo đảm tính nhất quán và công bằng.
              </p>
            </div>

            {/* Card 4: Dark QR Credential Card */}
            <div className="rounded-3xl bg-neutral-900 dark:bg-zinc-900 text-white p-5 sm:p-5.5 flex flex-col justify-between ring-1 ring-neutral-800 dark:ring-zinc-800 shadow-sm flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Chứng nhận số xác thực
                </h4>
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <QrCode className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
                  Mỗi chứng chỉ tích hợp mã QR tra cứu công khai và bảo lưu vĩnh viễn trên Hồ sơ.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors shrink-0 py-1.5 px-2.5 -mr-1 rounded-lg hover:bg-white/5 active:bg-white/10"
                >
                  <span>Khám phá</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CoreHighlightsSection;
