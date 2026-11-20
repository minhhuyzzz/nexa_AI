import React from 'react';
import Link from 'next/link';
import { Scale } from 'lucide-react';

export const metadata = {
  title: 'Điều Khoản Dịch Vụ Khảo Thí & Đào Tạo Số',
  description:
    'Quy chế khảo thí, chuẩn mực trung thực học thuật, quyền sở hữu trí tuệ và cam kết chất lượng dịch vụ của Nền tảng NEXA.',
  alternates: {
    canonical: '/policies/terms',
  },
  openGraph: {
    title: 'Điều Khoản Dịch Vụ Khảo Thí & Đào Tạo Số | NEXA',
    description:
      'Quy chế khảo thí, quyền sở hữu bài làm và cam kết dịch vụ dành cho cá nhân, giảng viên và tổ chức đào tạo trên NEXA.',
    url: 'https://nexa.edu.vn/policies/terms',
  },
};

export default function TermsOfServicePage() {
  const sections = [
    { id: 'acceptance', title: '1. Chấp thuận điều khoản' },
    { id: 'accounts-spaces', title: '2. Cấu trúc tài khoản & Không gian làm việc' },
    { id: 'academic-integrity', title: '3. Quy chế khảo thí & Trung thực học thuật' },
    { id: 'ip-rights', title: '4. Sở hữu trí tuệ & Bản quyền đề thi' },
    { id: 'billing-terms', title: '5. Gói dịch vụ & Quy định thanh toán' },
    { id: 'sla-enterprise', title: '6. Cam kết chất lượng dịch vụ cho Tổ chức' },
    { id: 'dispute-resolution', title: '7. Giới hạn trách nhiệm & Luật áp dụng' },
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold ring-1 ring-indigo-200/60 dark:ring-indigo-800/40 mb-3">
          <Scale className="w-4 h-4" />
          <span>Thỏa thuận pháp lý chính thức</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          Điều Khoản Dịch Vụ Khảo Thí Số
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
          Quy định các quyền lợi, nghĩa vụ pháp lý và tiêu chuẩn trung thực học thuật khi tham gia đánh giá năng lực số trên Nền tảng NEXA.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-neutral-400">
          <span>Phiên bản: 3.1</span>
          <span>•</span>
          <span>Hiệu lực từ: 01/01/2026</span>
          <span>•</span>
          <span>Đối tượng áp dụng: Cá nhân, Giảng viên và Đơn vị đào tạo</span>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-4 sticky top-24 hidden lg:block">
          <div className="rounded-2xl bg-slate-50 dark:bg-zinc-900/60 p-5 ring-1 ring-slate-200/70 dark:ring-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3">
              Mục lục điều khoản
            </h3>
            <nav className="space-y-1.5" aria-label="Mục lục điều khoản">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  {sec.title}
                </a>
              ))}
            </nav>

            <div className="mt-6 pt-4 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Khi đăng ký tài khoản hoặc sử dụng mã phòng thi làm bài, người dùng được xác nhận đã đọc, thấu hiểu và đồng thuận trọn vẹn với các điều khoản này.
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12 text-sm sm:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed">
          {/* Section 1 */}
          <section id="acceptance" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              1. Chấp thuận điều khoản
            </h2>
            <p>
              Bằng việc truy cập, khởi tạo tài khoản hoặc tham gia làm bài thi trên nền tảng NEXA, bạn xác nhận đã đủ năng lực hành vi dân sự và đồng ý tuân thủ toàn bộ các điều khoản và quy chế quy định tại văn bản này. Nếu không đồng thuận với bất kỳ điều khoản nào, vui lòng ngưng sử dụng dịch vụ.
            </p>
          </section>

          {/* Section 2 */}
          <section id="accounts-spaces" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              2. Cấu trúc tài khoản người dùng và không gian làm việc
            </h2>
            <p>
              Tài khoản NEXA được phân định rõ ràng giữa hai không gian làm việc độc lập:
            </p>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Không gian Cá nhân:</span> Dành cho cá nhân tự học tập, khảo thí năng lực đầu vào, rèn luyện theo lộ trình bồi dưỡng cá nhân hóa, tổ chức nhóm học tập trong hạn mức và lưu trữ hồ sơ chứng nhận cá nhân.
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Không gian Tổ chức:</span> Dành cho các cơ sở giáo dục, viện nghiên cứu và doanh nghiệp vận hành các chiến dịch khảo thí diện rộng, quản lý danh sách người học, phân công hội đồng chấm thi tập trung và xuất báo cáo độ trưởng thành số cấp đơn vị.
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Việc một cá nhân tham gia vào tổ chức không làm tổ chức đó sở hữu toàn bộ dữ liệu học tập cá nhân của người đó; dữ liệu giữa các tổ chức được cách ly hoàn toàn độc lập.
            </p>
          </section>

          {/* Section 3: Integrity */}
          <section id="academic-integrity" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              3. Quy chế khảo thí & Trung thực học thuật
            </h2>
            <p>
              Để bảo đảm giá trị bằng chứng và độ tin cậy của chứng nhận số NEXA, người tham gia khảo thí phải tuân thủ nghiêm ngặt:
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-slate-700 dark:text-neutral-300">
              <li><strong>Tự lực hoàn thành bài thi:</strong> Bài làm phải do chính chủ tài khoản thực hiện. Nghiêm cấm mọi hành vi thi hộ, can thiệp mã nguồn ứng dụng hoặc làm giả định danh.</li>
              <li><strong>Bảo mật đề thi:</strong> Nghiêm cấm việc sao chép, ghi hình hoặc phát tán trái phép các bộ câu hỏi và tình huống nghiệp vụ ra bên ngoài hệ thống.</li>
              <li><strong>Xử lý vi phạm:</strong> Nếu phát hiện gian lận hoặc hành vi cố tình làm sai lệch kết quả, NEXA và Hội đồng khảo thí có toàn quyền hủy kết quả làm bài và thu hồi vĩnh viễn chứng nhận đã cấp.</li>
            </ul>
          </section>

          {/* Section 4: IP Rights */}
          <section id="ip-rights" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              4. Sở hữu trí tuệ & Bản quyền đề thi
            </h2>
            <p>
              Toàn bộ mã nguồn, thiết kế giao diện, thuật toán chấm điểm và cơ sở dữ liệu câu hỏi khảo thí thuộc quyền sở hữu trí tuệ độc quyền của NEXA.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
              Đối với các bộ đề thi do Giảng viên hoặc Tổ chức tự biên soạn trên nền tảng: Giảng viên và Tổ chức giữ nguyên quyền tác giả nội dung; NEXA được cấp quyền lưu trữ và phân phối phục vụ kỳ thi trong phạm vi lớp học được phân công.
            </p>
          </section>

          {/* Section 5: Billing */}
          <section id="billing-terms" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              5. Gói dịch vụ & Quy định thanh toán
            </h2>
            <p>
              NEXA cung cấp các gói dịch vụ bồi dưỡng cá nhân và quy mô tổ chức minh bạch:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Gói Tiêu Chuẩn & Nâng Cao:</span> Được kích hoạt tức thì sau khi cổng thanh toán trực tuyến hoặc mã chuyển khoản xác nhận thành công.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Chính sách dùng thử & Khiếu nại:</span> Khách hàng được tặng 30 ngày dùng thử theo chương trình khuyến khích chuyển đổi số. Mọi khiếu nại kỹ thuật được thụ lý trong vòng 7 ngày làm việc.
              </div>
            </div>
          </section>

          {/* Section 6: Enterprise SLA */}
          <section id="sla-enterprise" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              6. Cam kết chất lượng dịch vụ cho Tổ chức
            </h2>
            <p>
              Đối với các Trường học và Doanh nghiệp ký kết hợp đồng triển khai giải pháp cấp đơn vị:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-slate-700 dark:text-neutral-300">
              <li><strong>Thời gian vận hành liên tục:</strong> Cam kết tính sẵn sàng của hệ thống đạt tối thiểu <strong>99.9%</strong> trong suốt thời gian diễn ra kỳ thi chính thức.</li>
              <li><strong>Tốc độ xử lý trắc nghiệm:</strong> Thời gian trả kết quả trắc nghiệm và đối chiếu năng lực số tức thì dưới 0.1 giây.</li>
              <li><strong>Hỗ trợ kỹ thuật chuyên trách:</strong> Hỗ trợ trực tuyến 24/7 trong các đợt thi tập trung quy mô lớn của nhà trường.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="dispute-resolution" className="scroll-mt-28 space-y-3 p-6 rounded-2xl bg-slate-100/70 dark:bg-zinc-900 ring-1 ring-slate-200 dark:ring-zinc-800">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
              7. Giới hạn trách nhiệm & Luật áp dụng
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
              Các điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết qua thương lượng hòa giải; trường hợp không đạt thỏa thuận sẽ đưa ra Tòa án có thẩm quyền tại Thành phố Hồ Chí Minh.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
