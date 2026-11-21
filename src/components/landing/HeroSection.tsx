import Link from 'next/link';
import { ArrowRight, BarChart3, Layers, Target } from 'lucide-react';
import { HeroDashboardGraphic } from './HeroDashboardGraphic';

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 min-h-[calc(100vh-4rem)] lg:min-h-screen flex items-center transition-colors"
    >
      {/* Main Hero Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pt-24 pb-16 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Left Column: Heading, Subtitle, Actions, Features */}
          <div className="lg:col-span-6 xl:col-span-6 text-left">
            {/* Title: Clean hierarchy, neutral 900 with Cobalt accent */}
            <h1 className="text-[28px] xs:text-3xl sm:text-4xl md:text-[44px] lg:text-[48px] xl:text-[52px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-[1.18] sm:leading-[1.15] text-balance">
              <span className="block">Đo lường và phát triển</span>
              <span className="text-blue-600 dark:text-blue-500 block mt-1">
                Năng lực số toàn diện
              </span>
            </h1>

            {/* Description: Natural, concise, accurate */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed max-w-xl font-normal">
              Khảo thí đầu vào, theo dõi các miền năng lực số và học tập theo lộ trình cá nhân hóa được hỗ trợ bởi trí tuệ nhân tạo.
            </p>

            {/* Actions: High-End CTA with Rotating Light Beam Effect */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto relative inline-flex items-center justify-center p-[2px] rounded-full overflow-hidden bg-blue-600/20 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 group"
              >
                {/* Rotating Conic Light Beam Border */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 w-[300%] aspect-square animate-border-beam border-beam-light"
                />

                {/* Button Face with Satin Cobalt Radiant Gradient */}
                <span className="w-full sm:w-auto relative z-10 inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 group-hover:from-blue-600 group-hover:via-blue-500 group-hover:to-blue-400 text-white font-semibold text-sm sm:text-base shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-300">
                  <span>Bắt đầu miễn phí</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.2} />
                </span>
              </Link>

              <Link
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 sm:bg-slate-50 sm:dark:bg-zinc-900 sm:hover:bg-slate-100 sm:dark:hover:bg-zinc-800 font-semibold text-xs sm:text-base ring-0 sm:ring-1 ring-slate-200/80 dark:ring-zinc-800 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-none sm:shadow-2xs"
              >
                Khám phá
              </Link>
            </div>

            {/* 3 Core Highlights (Ground in real Dashboard capabilities, seamless with background) */}
            <div
              className="mt-8 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-xl text-center sm:text-left"
              aria-label="Giá trị cốt lõi"
            >
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 ring-1 ring-blue-100 dark:ring-blue-900/40">
                  <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.8} />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
                  Khảo thí chuẩn hóa
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 ring-1 ring-blue-100 dark:ring-blue-900/40">
                  <Layers className="w-3.5 h-3.5" strokeWidth={1.8} />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
                  Lộ trình bồi dưỡng
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 ring-1 ring-blue-100 dark:ring-blue-900/40">
                  <Target className="w-3.5 h-3.5" strokeWidth={1.8} />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
                  Đánh giá thực chất
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 100% Native SVG/React 3D Dashboard Mockup (Zero AI Artifacts, Razor-Sharp Vector) */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center lg:justify-end">
            <HeroDashboardGraphic />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
