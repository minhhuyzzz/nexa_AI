import Link from 'next/link';
import { ArrowRight, User, Award, Shield, CheckCircle2, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 border-b border-slate-200/80 bg-linear-to-b from-white via-slate-50/50 to-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Subtle pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-medium text-slate-700 mb-8 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          <span>Nền tảng đánh giá và phát triển năng lực số thế hệ mới</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
          Đo lường & Phát triển <br className="hidden sm:inline" />
          <span className="text-sky-600">Năng lực Số Toàn diện</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Đánh giá năng lực thực tế qua tình huống thực tiễn, nhận diện chính xác điểm mạnh - điểm yếu và học tập theo lộ trình cá nhân hóa được hỗ trợ bởi trí tuệ nhân tạo.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors shadow-xs text-sm"
          >
            <span>Bắt đầu bài đánh giá</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
          <Link
            href="/framework"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs text-sm"
          >
            <span>Khám phá khung năng lực</span>
          </Link>
        </div>



        {/* 3 Core Highlights */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Khảo thí thực tế & toàn diện</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kết hợp trắc nghiệm tư duy, xử lý tình huống thực tế và bài tập thao tác trên công cụ số.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Lộ trình học tập cá nhân hóa</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI phân tích điểm còn thiếu và gợi ý các chặng bồi dưỡng cô đọng, phù hợp với năng lực của bạn.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Award className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">Chứng chỉ xác thực tức thì</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mỗi chứng nhận cấp ra đều đi kèm mã QR xác thực độc lập, dễ dàng chia sẻ lên hồ sơ cá nhân.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
