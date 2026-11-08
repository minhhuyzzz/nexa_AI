import Link from 'next/link';
import { CheckCircle2, ArrowRight, Route, Sparkles, Award } from 'lucide-react';

export function CoreHighlightsSection() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-black transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Tinh gọn, ít chữ, đúng trọng tâm */}
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-4">
              <Route className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Lộ trình cá nhân hóa</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug">
              Bồi dưỡng đúng khoảng trống kỹ năng
            </h2>

            <p className="mt-3.5 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
              Đo lường chính xác điểm yếu qua khảo thí thực tế để mở khóa lộ trình học tập mục tiêu.
            </p>

            {/* 3 Điểm nhấn tinh giản, không viền hộp */}
            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Khảo thí chẩn đoán
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Đo lường năng lực qua 5 miền và chỉ rõ kỹ năng còn thiếu.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Bồi dưỡng mục tiêu
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Học đúng nội dung cần bổ sung, thực hành trực tiếp.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Đánh giá & Chứng nhận
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Kiểm chứng độ tăng trưởng năng lực và cấp chứng nhận số xác thực.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/framework"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
              >
                <span>Khám phá 5 miền năng lực số</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Column: Dashboard Lộ trình Siêu Tinh Giản — Không viền ngang */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-slate-50/80 dark:bg-zinc-900/50 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-200/60 dark:ring-zinc-800">
              {/* Header của Dashboard (Không border-b) */}
              <div className="flex items-center justify-between pb-3 gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5">
                    Lộ trình bồi dưỡng
                  </div>
                  <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Sáng tạo Nội dung số & Quản lý Dữ liệu
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    Đã hoàn thành 60%
                  </span>
                </div>
              </div>

              {/* Danh sách 4 chặng tiến trình thanh thoát, không lồng card */}
              <div className="py-6 space-y-5">
                {/* Chặng 1 - Đã xong */}
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        Chặng 01: Khai thác & Đánh giá Dữ liệu Số
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        88/100 • Đạt
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Đã kiểm chứng: Tìm kiếm và lưu trữ dữ liệu an toàn.
                    </div>
                  </div>
                </div>

                {/* Chặng 2 - Đang thực hiện */}
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 shadow-sm">
                    02
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate">
                        Chặng 02: Bản quyền & Sáng tạo Số
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-bold shrink-0">
                        Đang học 65%
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                      Trọng tâm: Luật bản quyền số và ứng dụng công cụ biên tập số.
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 mt-2.5 overflow-hidden">
                      <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>

                {/* Chặng 3 - Tiếp theo */}
                <div className="flex items-start gap-3.5 opacity-75">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    03
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        Chặng 03: An toàn Thông tin & Phòng ngừa Rủi ro
                      </div>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
                        Kế tiếp
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Bảo vệ thiết bị số và phòng tránh rủi ro lừa đảo trực tuyến.
                    </div>
                  </div>
                </div>

                {/* Chặng 4 - Đánh giá lại */}
                <div className="flex items-start gap-3.5 opacity-75">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    04
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        Chặng 04: Đánh giá lại & Cấp Chứng nhận Số
                      </div>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
                        Mục tiêu
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Đo lường sự tăng trưởng năng lực và nhận chứng chỉ số minh bạch.
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer tóm tắt của Dashboard */}
              <div className="pt-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Mục tiêu lộ trình: Đạt 75 điểm toàn diện</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Tiến bộ ghi nhận: +14 điểm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CoreHighlightsSection;
