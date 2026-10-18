import { Sparkles, Compass, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function AiWorkflowSection() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
          Đồng hành thông minh
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Phát triển Kỹ năng cùng Trợ lý AI
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Trí tuệ nhân tạo tại NEXA được thiết kế như một người cố vấn học tập: phân tích khách quan năng lực, đồng hành gợi ý kiến thức và tôn trọng tối đa quyền riêng tư của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Chẩn đoán năng lực đa chiều
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              AI phân tích chi tiết từng tiêu chí trong bài làm, trích dẫn chính xác những điểm bạn làm tốt và chỉ ra những phần cần bồi dưỡng thêm qua sơ đồ mạng nhện trực quan.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Phản hồi chi tiết, minh bạch</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Compass className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Gợi ý học tập đúng trọng tâm
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Thay vì học dàn trải, hệ thống sắp xếp các bài học ngắn (5–15 phút) tập trung chính xác vào kỹ năng bạn còn thiếu để bạn nhanh chóng nâng cao mức độ thành thạo.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tiết kiệm thời gian, hiệu quả cao</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Bảo mật quyền riêng tư 100%
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Mọi dữ liệu văn bản trước khi xử lý đều được tự động loại bỏ thông tin định danh như họ tên, email hay số điện thoại. Bài làm của bạn luôn được bảo vệ an toàn.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tự động khử thông tin định danh</span>
          </div>
        </div>
      </div>
    </section>
  );
}
