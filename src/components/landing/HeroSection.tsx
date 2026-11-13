import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, Layers, Users } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative isolation-isolate overflow-hidden min-h-screen flex items-center"
      style={{
        background: `
          radial-gradient(ellipse 55% 75% at 90% 31%, rgba(134,181,253,.35), transparent 76%),
          radial-gradient(ellipse 58% 64% at 44% 1%, rgba(196,218,253,.4), transparent 85%),
          linear-gradient(116deg, #f0f5fe 0%, #f8fbff 37%, #d7e6fc 100%)
        `,
      }}
    >
      {/* Top ambient curves */}
      <svg
        className="pointer-events-none absolute top-4 left-[40%] w-[65%] h-[280px] z-0 opacity-50 hidden md:block"
        viewBox="0 0 1020 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-110 298C180 279 207 163 481 100S802 -23 1080 -94"
          stroke="white"
          strokeWidth="2"
          fill="none"
          opacity=".88"
        />
        <path
          d="M-80 300C210 250 251 181 501 102S857 -47 1120 -109"
          stroke="#bdd4fe"
          strokeWidth="1.2"
          fill="none"
          opacity=".4"
        />
      </svg>

      {/* Main Hero Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-24 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Heading, Subtitle, Actions, Features */}
          <div className="lg:col-span-6 xl:col-span-6 text-left">
            {/* Title: 2 lines, clean proportion */}
            <h1 className="text-3xl sm:text-4xl md:text-[44px] lg:text-[48px] xl:text-[52px] font-bold tracking-tight text-[#07143a] leading-[1.16]">
              <span className="block">Đo lường và phát triển</span>
              <span className="text-[#2369ef] block mt-1">Năng lực số toàn diện</span>
            </h1>

            {/* Description */}
            <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
              Đánh giá chuẩn xác 5 miền năng lực số, phát hiện khoảng trống kỹ năng và mở khóa lộ trình bồi dưỡng cá nhân hóa bằng AI.
            </p>

            {/* Actions */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5 sm:gap-4">
              <Link
                href="/register"
                className="relative inline-flex items-center justify-center p-[2px] rounded-full overflow-hidden bg-blue-600/20 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 group"
              >
                {/* Rotating Light Beam around Border */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 w-[300%] aspect-square animate-border-beam border-beam-light"
                />

                {/* Button Face with Rich Radiant Gradient */}
                <span className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 group-hover:from-blue-600 group-hover:via-blue-500 group-hover:to-sky-400 text-white font-medium text-sm sm:text-base shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] transition-all duration-300">
                  <span>Bắt đầu miễn phí</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
                </span>
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/80 hover:bg-white text-slate-800 font-medium text-sm sm:text-base border border-slate-200 shadow-2xs transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Xem giải pháp</span>
              </Link>
            </div>

            {/* 3 Highlight Features Row (Không viền ngang) */}
            <div
              className="mt-8 sm:mt-10 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 max-w-xl pt-2"
              aria-label="Giá trị nổi bật"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" strokeWidth={2} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-900 leading-snug">
                  Đánh giá<br />chuẩn hóa
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" strokeWidth={2} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-900 leading-snug">
                  Lộ trình<br />cá nhân hóa
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" strokeWidth={2} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-900 leading-snug">
                  Phát triển<br />bền vững
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Layered Dashboard Mockup Artwork */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center lg:justify-end mt-6 lg:mt-0">
            <div className="relative w-full max-w-[500px] lg:max-w-[580px] xl:max-w-[640px]">
              <Image
                src="/images/hero-mockup.png"
                alt="Tổng quan giao diện đánh giá năng lực số, radar 5 miền và lộ trình bồi dưỡng NEXA"
                width={941}
                height={667}
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 500px, (max-width: 1280px) 580px, 640px"
                className="w-full h-auto drop-shadow-[0_20px_35px_rgba(84,120,201,0.12)] transition-transform duration-300 hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave swooshes connecting seamlessly into next section */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full h-[80px] sm:h-[110px] lg:h-[140px] z-10"
        viewBox="0 0 1672 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 80 C263 15 342 50 588 110 c221 55 357-20 570-35 c202-14 347 22 514 26 v59 H0 Z"
          fill="rgba(143,181,251,0.22)"
        />
        <path
          d="M0 115 C173 50 316 65 517 105 c262 45 363-5 558-35 c213-32 391 55 597 35 v45 H0 Z"
          fill="rgba(209,226,255,0.48)"
        />
        <path
          d="M0 138 C240 95 410 115 650 145 c220 30 420-15 700-28 c180-10 230 10 322 16 v27 H0 Z"
          fill="#ffffff"
        />
      </svg>
    </section>
  );
}

export default HeroSection;