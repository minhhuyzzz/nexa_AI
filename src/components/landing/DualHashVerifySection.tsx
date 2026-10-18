import { Award, QrCode, CheckCircle2, ShieldCheck, Download, Share2 } from 'lucide-react';
import Link from 'next/link';

export function DualHashVerifySection() {
  return (
    <section className="py-20 border-t border-slate-200/80 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Human Value Description */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
              Chứng nhận uy tín
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              Chứng chỉ Số Minh bạch, Xác thực Tức thì
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Mỗi chứng chỉ hoàn thành tại NEXA đều được cấp mã định danh độc lập kèm mã QR xác thực. Nhà tuyển dụng hoặc trường học có thể kiểm tra tính chính xác của chứng chỉ trong vài giây.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Xác thực bằng mã QR độc lập</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Chỉ cần quét mã QR bằng camera điện thoại để mở trang xác thực chứng chỉ chính thức, loại bỏ hoàn toàn nguy cơ làm giả văn bằng.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Bảo chứng toàn vẹn dữ liệu</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Mọi điểm số thành phần và ngày cấp đều được lưu trữ bảo mật, bảo đảm không thể can thiệp hay chỉnh sửa sau khi cấp.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Đính kèm hồ sơ & CV dễ dàng</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Tải xuống bản PDF vector sắc nét hoặc thêm liên kết chứng chỉ vào CV, LinkedIn để khẳng định năng lực số thực tế.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic High-End Certificate Card Preview */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md relative overflow-hidden">
            {/* Subtle top decoration bar */}
            <div className="h-1.5 w-full bg-linear-to-r from-sky-500 via-sky-600 to-slate-900 absolute top-0 left-0" />

            {/* Certificate Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  N
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">NEXA PLATFORM</div>
                  <div className="text-[10px] text-slate-400">CHỨNG CHỈ NĂNG LỰC SỐ</div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                ĐÃ XÁC THỰC
              </span>
            </div>

            {/* Recipient Details */}
            <div className="text-center py-4 space-y-1">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Chứng nhận cấp cho</div>
              <div className="text-xl font-bold text-slate-900">Trần Minh Huy</div>
              <div className="text-xs text-slate-600">Đã hoàn thành xuất sắc kỳ đánh giá năng lực số toàn diện</div>
            </div>

            {/* 5 Domains Mini Progress */}
            <div className="my-5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 mb-2">Kết quả 5 Miền năng lực cốt lõi:</div>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">D1: Dữ liệu</div>
                  <div className="font-bold text-slate-900">85%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">D2: Hợp tác</div>
                  <div className="font-bold text-slate-900">78%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">D3: Nội dung</div>
                  <div className="font-bold text-slate-900">62%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">D4: Bảo mật</div>
                  <div className="font-bold text-slate-900">90%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">D5: Vấn đề</div>
                  <div className="font-bold text-slate-900">70%</div>
                </div>
              </div>
            </div>

            {/* Footer with QR Code & Metadata */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-left text-xs">
                <div className="text-[10px] text-slate-400">Số hiệu chứng chỉ</div>
                <div className="font-bold text-slate-800">NEXA-2026-8842</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ngày cấp: 15/10/2026</div>
              </div>

              {/* QR Code Graphic Mockup */}
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 bg-white p-1 rounded-lg border border-slate-200 shadow-xs flex items-center justify-center text-slate-800">
                  <QrCode className="w-10 h-10 text-slate-800" strokeWidth={1.5} />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[11px] font-semibold text-slate-700">Quét mã QR</div>
                  <div className="text-[10px] text-slate-400">để xác thực tức thì</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
