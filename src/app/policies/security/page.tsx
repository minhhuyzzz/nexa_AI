import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export const metadata = {
  title: 'Tiêu Chuẩn Bảo Mật Dữ Liệu & Trí Tuệ Nhân Tạo',
  description:
    'Kiến trúc bảo mật dữ liệu khảo thí đa tầng, nguyên tắc vận hành trí tuệ nhân tạo theo yêu cầu, băm kép SHA-256 chứng chỉ số và cách ly dữ liệu độc lập trên Nền tảng NEXA.',
  alternates: {
    canonical: '/policies/security',
  },
  openGraph: {
    title: 'Tiêu Chuẩn Bảo Mật Dữ Liệu & Trí Tuệ Nhân Tạo | NEXA',
    description:
      'Kiến trúc bảo mật khảo thí, băm kép SHA-256 chứng chỉ và nguyên tắc con người làm chủ quyết định thẩm định của NEXA.',
    url: 'https://nexa.edu.vn/policies/security',
  },
};

export default function SecurityPolicyPage() {
  const sections = [
    { id: 'security-architecture', title: '1. Kiến trúc Bảo mật Đa tầng' },
    { id: 'responsible-ai', title: '2. Nguyên tắc Trí tuệ Nhân tạo Có Trách nhiệm' },
    { id: 'on-demand-ai', title: '3. Cơ chế Khởi tạo Trí tuệ Nhân tạo Theo Yêu Cầu' },
    { id: 'confidence-flags', title: '4. Hệ thống Cờ Độ Tin Cậy Trí Tuệ Nhân Tạo' },
    { id: 'dual-hash', title: '5. Ký băm kép & Cổng tra cứu xác thực độc bản' },
    { id: 'tenant-isolation', title: '6. Cách ly Dữ liệu Độc lập giữa các Tổ chức' },
    { id: 'audit-logging', title: '7. Giám sát truy vết & Kiểm toán An toàn' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/policies"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Quay lại Trung tâm Chính sách
        </Link>
      </div>

      {/* Header Block */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-xs font-bold ring-1 ring-emerald-200/60 dark:ring-emerald-800/40 mb-3">
          <Lock className="w-4 h-4" />
          <span>Tiêu chuẩn an toàn cao cấp</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          An Toàn Dữ Liệu & Trí Tuệ Nhân Tạo
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
          NEXA được xây dựng dựa trên nguyên lý an toàn theo thiết kế, bảo vệ tuyệt đối tính trung thực của bằng chứng học thuật và tính riêng tư của người dùng.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-neutral-400">
          <span>Tiêu chuẩn: Ký băm kép SHA-256</span>
          <span>•</span>
          <span>Mã hóa: AES-256 & TLS 1.3</span>
          <span>•</span>
          <span>Nguyên lý: Con người kiểm soát sau cùng & Trí tuệ nhân tạo theo yêu cầu</span>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-4 sticky top-24 hidden lg:block">
          <div className="rounded-2xl bg-slate-50 dark:bg-zinc-900/60 p-5 ring-1 ring-slate-200/70 dark:ring-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3">
              Mục lục an toàn
            </h3>
            <nav className="space-y-1.5" aria-label="Mục lục an toàn">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  {sec.title}
                </a>
              ))}
            </nav>

            <div className="mt-6 pt-4 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Hệ thống áp dụng công nghệ phân quyền cấp dòng dữ liệu và cơ chế xác thực phiên kép cho toàn bộ các luồng giao dịch khảo thí.
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12 text-sm sm:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed">
          {/* Section 1 */}
          <section id="security-architecture" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              1. Kiến trúc Bảo mật Đa tầng
            </h2>
            <p>
              Nền tảng NEXA triển khai mô hình bảo vệ nhiều lớp từ biên mạng truyền dẫn đến tầng lưu trữ dữ liệu cốt lõi:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">Tầng Truyền dẫn</div>
                Mã hóa toàn bộ lưu lượng qua giao thức TLS 1.3 với chứng chỉ mã hóa nghiêm ngặt, ngăn ngừa nguy cơ nghe lén trên đường truyền.
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">Tầng Ứng dụng</div>
                Xác thực danh tính bảo mật qua chuỗi mã phiên có kiểm soát thời gian nghiêm ngặt, kèm lớp lọc giới hạn tần suất truy vấn để chống xâm nhập trái phép.
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">Tầng Dữ liệu</div>
                Cơ chế phân quyền ở cấp độ từng dòng dữ liệu, bảo đảm tính cách ly tuyệt đối và ngăn ngừa rò rỉ dữ liệu chéo giữa các đơn vị đào tạo.
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="responsible-ai" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              2. Nguyên tắc Trí tuệ Nhân tạo Có Trách nhiệm
            </h2>
            <p>
              Tại NEXA, Trí tuệ nhân tạo được định vị là <strong>công cụ hỗ trợ sư phạm chuyên nghiệp</strong>, tuyệt đối không thay thế con người đưa ra quyết định khảo thí sau cùng:
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-slate-700 dark:text-neutral-300">
              <li><strong>Khảo thí viên nắm toàn quyền thẩm định sau cùng:</strong> Điểm số và nhận xét do trí tuệ nhân tạo đề xuất chỉ là bản nháp nội bộ. Điểm chính thức chỉ được công bố sau khi Khảo thí viên kiểm tra và bấm phê duyệt.</li>
              <li><strong>Giải trình minh bạch căn cứ chấm điểm:</strong> Trí tuệ nhân tạo phải chỉ ra chính xác câu văn, luận điểm trong bài làm tương ứng với tiêu chí nào của bảng tiêu chí chấm để đưa ra đề xuất điểm, loại bỏ hoàn toàn mô hình chấm điểm thiếu căn cứ.</li>
            </ul>
          </section>

          {/* Section 3: On-Demand AI */}
          <section id="on-demand-ai" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              3. Cơ chế Khởi tạo Trí tuệ Nhân tạo Theo Yêu Cầu
            </h2>
            <p>
              Đây là <strong>quy tắc kiến trúc cốt lõi</strong> của NEXA. Hệ thống tuyệt đối không tự động kích hoạt tiến trình gọi trí tuệ nhân tạo khi thí sinh nhấn nộp bài.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/70 dark:ring-zinc-800 text-xs sm:text-sm space-y-2">
              <p>
                <strong>Hiệu quả vận hành vượt trội:</strong>
              </p>
              <div>• Loại bỏ hoàn toàn tình trạng nghẽn mạng khi hàng ngàn thí sinh nộp bài cùng một thời điểm trong kỳ thi.</div>
              <div>• Chấm trắc nghiệm tức thì bằng thuật toán thuần backend, không gây lãng phí tài nguyên tính toán.</div>
              <div>• Giúp Khảo thí viên chủ động lựa chọn những bài làm cần trợ giúp hoặc tự tay chấm bài theo nhận định chuyên môn.</div>
            </div>
          </section>

          {/* Section 4: Confidence Flags */}
          <section id="confidence-flags" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              4. Hệ thống Cờ Độ Tin Cậy Trí Tuệ Nhân Tạo
            </h2>
            <p>
              Mỗi khi trí tuệ nhân tạo tham gia đối chiếu bài làm tự luận theo bảng tiêu chí chấm, hệ thống sẽ tính toán chỉ số tự tin học thuật và gắn cờ trực quan cho Khảo thí viên:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-200 dark:ring-emerald-800/40 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div><strong>Cờ Xanh (Độ tin cậy từ 85% trở lên):</strong> Bài làm có lập luận rõ ràng, khớp chặt chẽ với tiêu chí chuẩn hóa.</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-200 dark:ring-amber-800/40 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <div><strong>Cờ Cam (Độ tin cậy từ 60% đến 84%):</strong> Đạt yêu cầu cơ bản nhưng câu trả lời mang tính định tính, Khảo thí viên nên rà soát kỹ lưỡng.</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-200 dark:ring-rose-800/40 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div><strong>Cờ Đỏ (Độ tin cậy dưới 60%):</strong> Cảnh báo rủi ro cao, hệ thống yêu cầu Khảo thí viên phải kiểm tra và chấm lại hoàn toàn thủ công.</div>
              </div>
            </div>
          </section>

          {/* Section 5: Dual Hash */}
          <section id="dual-hash" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              5. Ký băm kép & Cổng tra cứu xác thực độc bản
            </h2>
            <p>
              Toàn bộ chứng chỉ số cấp phát cho học viên được bảo vệ bằng công nghệ ký băm kép điện tử:
            </p>
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-blue-200/60 dark:ring-blue-800/40 space-y-2 text-xs sm:text-sm">
              <div className="font-bold text-blue-900 dark:text-blue-200">
                Quy trình xác thực hai lớp độc lập:
              </div>
              <div>1. Khi khởi tạo chứng chỉ, hệ thống băm toàn bộ dữ liệu định danh và kết quả các miền năng lực số thành mã băm dữ liệu học thuật.</div>
              <div>2. Sau khi kết xuất tệp tài liệu số, hệ thống băm lần hai trực tiếp trên luồng dữ liệu byte nhị phân của tệp.</div>
              <div>3. Khi nhà tuyển dụng hoặc nhà trường quét mã phản hồi nhanh, cổng kiểm định độc lập đối chiếu cả hai mã băm. Nếu tệp tài liệu bị chỉnh sửa dù chỉ một dấu chấm, hệ thống lập tức phát cảnh báo không hợp lệ.</div>
            </div>
          </section>

          {/* Section 6: Tenant Isolation */}
          <section id="tenant-isolation" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              6. Cách ly Dữ liệu Độc lập giữa các Tổ chức
            </h2>
            <p>
              Dữ liệu giữa các đơn vị đào tạo được phân tách triệt để ở tầng cơ sở dữ liệu. Ngay cả khi người dùng là thành viên của nhiều tổ chức khác nhau, mỗi phiên làm việc đều gắn chặt với mã định danh tổ chức cụ thể:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-slate-700 dark:text-neutral-300">
              <li>Khảo thí viên của đơn vị này tuyệt đối không thể xem danh sách thí sinh, đề thi hay bài nộp của đơn vị khác.</li>
              <li>Mọi yêu cầu truy vấn đều được kiểm tra điều kiện quyền hạn thực tế trước khi hệ thống trả dữ liệu.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="audit-logging" className="scroll-mt-28 space-y-3 p-6 rounded-2xl bg-slate-100/70 dark:bg-zinc-900 ring-1 ring-slate-200 dark:ring-zinc-800">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
              7. Giám sát truy vết & Kiểm toán An toàn định kỳ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
              Mọi hành động nhạy cảm như thay đổi điểm số, ban hành đề thi, phê duyệt thành viên hoặc thu hồi chứng chỉ đều được ghi nhận vào nhật ký kiểm toán bất biến kèm dấu thời gian thực và địa chỉ mạng. NEXA định kỳ phối hợp cùng các đơn vị chuyên môn để kiểm thử thâm nhập độc lập nhằm bảo đảm hệ thống luôn vững vàng trước mọi nguy cơ an ninh mạng.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
