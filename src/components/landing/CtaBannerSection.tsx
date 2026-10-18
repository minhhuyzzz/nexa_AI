import Link from 'next/link';
import { ArrowRight, UserCheck } from 'lucide-react';

export function CtaBannerSection() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-14 shadow-xs text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <span className="inline-block px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            Khởi tạo tài khoản hoàn toàn miễn phí
          </span>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Sẵn Sàng Nâng Tầm Năng Lực Số Của Bạn?
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            Khám phá mức độ thành thạo các kỹ năng số thực tế, nhận lộ trình bồi dưỡng cá nhân hóa và chứng nhận số uy tín ngay hôm nay.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register?role=LEARNER"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors shadow-xs text-sm"
            >
              <span>Đăng ký Người học</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
            <Link
              href="/register?role=EVALUATOR"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs text-sm"
            >
              <span>Đăng ký Giảng viên / Chuyên gia</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
