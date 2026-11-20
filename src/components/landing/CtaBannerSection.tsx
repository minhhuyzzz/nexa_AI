import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export function CtaBannerSection() {
  return (
    <section className="py-12 sm:py-24 bg-white dark:bg-black transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl p-6 sm:p-14 lg:p-20 text-center overflow-hidden ring-1 ring-blue-500/30 shadow-2xl transition-all"
          style={{
            background: `
              radial-gradient(ellipse 70% 60% at 80% 20%, rgba(37, 99, 235, 0.45), transparent 70%),
              radial-gradient(ellipse 60% 50% at 20% 85%, rgba(29, 78, 216, 0.35), transparent 70%),
              linear-gradient(145deg, #0b1a3d 0%, #071228 50%, #040915 100%)
            `,
          }}
        >
          {/* Foreground Content */}
          <div className="relative z-10 max-w-3xl mx-auto space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-blue-900/60 text-blue-200 text-xs font-semibold ring-1 ring-blue-400/30 backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Khởi tạo tài khoản miễn phí</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight text-balance">
              Sẵn Sàng Đánh Giá Năng Lực Số?
            </h2>

            <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-normal max-w-xl mx-auto">
              Tham gia bài khảo thí đầu vào, theo dõi các miền năng lực số và bắt đầu lộ trình bồi dưỡng kỹ năng cá nhân hóa ngay hôm nay.
            </p>

            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 text-sm transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Bắt đầu khảo thí</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/framework"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white/10 text-white font-semibold ring-1 ring-white/20 hover:bg-white/15 transition-all text-sm backdrop-blur-md transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Xem Khung năng lực</span>
              </Link>
            </div>

            <div className="pt-2 sm:pt-3 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-300 font-medium text-center text-balance">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span>Bảo mật dữ liệu cá nhân & Tôn trọng quyền riêng tư người học</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaBannerSection;
