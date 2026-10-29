import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroRadarInteractive } from './HeroRadarInteractive';

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center border-b border-slate-200 bg-white overflow-hidden py-12 lg:py-0">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full relative z-10">
        {/* 2-Column Hero: Text on Left, Interactive Draggable Radar on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
          {/* Left Column: Heading, Subtitle & CTAs */}
          <div className="lg:col-span-6 text-left">
            {/* Subtle pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 mb-6 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              <span>Nền tảng đánh giá và phát triển năng lực số thế hệ mới</span>
            </div>

            {/* Main Title - Proportioned cleanly across 2 lines */}
            <h1 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[46px] xl:text-[50px] font-bold tracking-tight text-slate-900 leading-[1.16]">
              <span className="block">Đo lường & Phát triển</span>
              <span className="text-sky-600 block mt-1">Năng lực Số Toàn diện</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Đánh giá năng lực thực tế qua tình huống thực tiễn, nhận diện chính xác điểm mạnh và điểm yếu và học tập theo lộ trình cá nhân hóa được hỗ trợ bởi trí tuệ nhân tạo.
            </p>

            {/* Primary CTAs with Rounded-Full & Shining Border Beam */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Primary Action with Animated Border Beam Light & Gradient Fill */}
              <Link
                href="/register"
                className="relative inline-flex items-center justify-center p-[2px] rounded-full overflow-hidden group shadow-md shadow-sky-500/20 transition-transform active:scale-[0.98]"
              >
                {/* Rotating Light Beam around Border */}
                <span className="absolute inset-[-200%] animate-border-beam bg-[conic-gradient(from_0deg,transparent_0_300deg,#38bdf8_340deg,#ffffff_360deg)] pointer-events-none" />

                {/* Button Face with Smooth Gradient */}
                <span className="relative z-10 inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-sky-400 via-sky-600 to-blue-700 text-white font-medium hover:brightness-110 transition-all text-sm w-full h-full">
                  <span>Bắt đầu</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                </span>
              </Link>

              {/* Secondary Action: Đánh giá miễn phí */}
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs text-sm"
              >
                <span>Đánh giá miễn phí</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive 5-Domain Radar + Draggable Sliders */}
          <div className="lg:col-span-6 w-full flex items-center justify-center lg:justify-end">
            <HeroRadarInteractive />
          </div>
        </div>
      </div>
    </section>
  );
}
