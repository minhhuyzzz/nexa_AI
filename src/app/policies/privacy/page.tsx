import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock } from 'lucide-react';

export const metadata = {
  title: 'Chính Sách Bảo Vệ Dữ Liệu Cá Nhân',
  description:
    'Chính sách bảo vệ dữ liệu cá nhân của NEXA theo Nghị định số 13/2023/NĐ-CP, cơ chế bóc tách định danh tự động và quyền của chủ thể dữ liệu.',
  alternates: {
    canonical: '/policies/privacy',
  },
  openGraph: {
    title: 'Chính Sách Bảo Vệ Dữ Liệu Cá Nhân | NEXA',
    description:
      'Quy định thu thập, bảo vệ và xử lý thông tin người học và cơ sở giáo dục theo Nghị định số 13/2023/NĐ-CP.',
    url: 'https://nexa.edu.vn/policies/privacy',
  },
};

export default function PrivacyPolicyPage() {
  const sections = [
    { id: 'scope', title: '1. Phạm vi áp dụng & Cơ sở pháp lý' },
    { id: 'data-collected', title: '2. Dữ liệu cá nhân được thu thập' },
    { id: 'pii-scrubber', title: '3. Cơ chế khử định danh tự động' },
    { id: 'purpose', title: '4. Mục đích xử lý dữ liệu khảo thí' },
    { id: 'retention-integrity', title: '5. Lưu trữ & Tính toàn vẹn chứng chỉ' },
    { id: 'user-rights', title: '6. Quyền của chủ thể dữ liệu' },
    { id: 'third-parties', title: '7. Cam kết bảo mật & Bên thứ ba' },
    { id: 'contact', title: '8. Kênh liên hệ Ban Bảo vệ Dữ liệu' },
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 text-xs font-bold ring-1 ring-blue-200/60 dark:ring-blue-800/40 mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>Tuân thủ Nghị định số 13/2023/NĐ-CP</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          Chính Sách Bảo Vệ Dữ Liệu Cá Nhân
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
          Quy định rõ ràng về cách Nền tảng NEXA thu thập, bảo vệ và xử lý thông tin người học, giảng viên và các cơ sở giáo dục theo quy chuẩn pháp luật Việt Nam.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-neutral-400">
          <span>Phiên bản: 2.4</span>
          <span>•</span>
          <span>Hiệu lực từ: 01/01/2026</span>
          <span>•</span>
          <span>Phạm vi áp dụng: Toàn quốc</span>
        </div>
      </div>

      {/* 2-Column Content Layout (Sidebar + Document Body) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sticky Sidebar Table of Contents */}
        <aside className="lg:col-span-4 sticky top-24 hidden lg:block">
          <div className="rounded-2xl bg-slate-50 dark:bg-zinc-900/60 p-5 ring-1 ring-slate-200/70 dark:ring-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3">
              Mục lục tài liệu
            </h3>
            <nav className="space-y-1.5" aria-label="Mục lục chính sách">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  {sec.title}
                </a>
              ))}
            </nav>

            <div className="mt-6 pt-4 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Văn bản được phê duyệt bởi Ban Pháp chế & An toàn Thông tin của NEXA và rà soát định kỳ theo hướng dẫn của cơ quan quản lý nhà nước.
            </div>
          </div>
        </aside>

        {/* Document Content Body */}
        <div className="lg:col-span-8 space-y-12 text-sm sm:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed">
          {/* Section 1 */}
          <section id="scope" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              1. Phạm vi áp dụng & Cơ sở pháp lý
            </h2>
            <p>
              Chính sách bảo mật này áp dụng cho toàn bộ người dùng tương tác với Nền tảng NEXA, bao gồm: Học viên cá nhân, Khảo thí viên, Cán bộ quản lý cơ sở giáo dục hoặc doanh nghiệp, và Khách vãng lai thực hiện đối soát chứng nhận trên cổng kiểm định.
            </p>
            <p>
              NEXA cam kết tuân thủ đầy đủ và vô điều kiện <strong>Nghị định số 13/2023/NĐ-CP</strong> của Chính phủ về Bảo vệ dữ liệu cá nhân, Luật An toàn thông tin mạng và các quy định học thuật liên quan của Bộ Giáo dục & Đào tạo và Bộ Thông tin & Truyền thông.
            </p>
          </section>

          {/* Section 2 */}
          <section id="data-collected" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              2. Dữ liệu cá nhân được thu thập
            </h2>
            <p>Chúng tôi chỉ thu thập các trường thông tin tối thiểu cần thiết để phục vụ công tác khảo thí và ghi nhận năng lực số:</p>
            <ul className="space-y-2 pl-4 list-disc marker:text-blue-600 text-xs sm:text-sm text-slate-700 dark:text-neutral-300">
              <li><strong>Thông tin tài khoản:</strong> Địa chỉ thư điện tử, Họ và tên đầy đủ phục vụ việc in trên Chứng nhận số, Ảnh đại diện do người dùng chủ động tải lên.</li>
              <li><strong>Dữ liệu bài khảo thí:</strong> Lịch sử lựa chọn đáp án trắc nghiệm, bài nộp tự luận, sản phẩm thực hành số, thời gian bắt đầu và hoàn tất làm bài.</li>
              <li><strong>Kết quả đánh giá:</strong> Điểm số theo các miền năng lực số, điểm tích lũy học tập và chuỗi mã xác thực chứng chỉ.</li>
              <li><strong>Dữ liệu kỹ thuật phục vụ an toàn:</strong> Địa chỉ mạng tạm thời và thông số trình duyệt nhằm mục đích bảo vệ phiên làm bài và phòng ngừa gian lận trong thời gian thực.</li>
            </ul>
          </section>

          {/* Section 3: PII Scrubber */}
          <section id="pii-scrubber" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              3. Cơ chế khử định danh tự động bảo đảm quyền riêng tư
            </h2>
            <p>
              Điểm khác biệt cốt lõi của NEXA là tính năng <strong>bộ lọc khử định danh độc quyền</strong>. Trước khi bất kỳ nội dung bài làm tự luận hoặc giải trình nào được chuyển qua cổng kết nối trí tuệ nhân tạo để gợi ý điểm số, hệ thống sẽ tự động quét và loại bỏ toàn bộ dữ liệu định danh:
            </p>

            <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-200/60 dark:ring-blue-800/40 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Danh mục thông tin được khử trước khi trí tuệ nhân tạo xử lý:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-300">
                <div>• Họ và tên thí sinh</div>
                <div>• Số điện thoại và thư điện tử cá nhân</div>
                <div>• Số căn cước công dân hoặc hộ chiếu</div>
                <div>• Tên lớp học, Trường học và Đơn vị trực thuộc</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              Nhờ cơ chế này, mô hình trí tuệ nhân tạo hoàn toàn không có khả năng nhận biết thí sinh là ai, loại bỏ triệt để rủi ro thiên vị học thuật và ngăn ngừa việc rò rỉ dữ liệu cá nhân ra môi trường bên ngoài.
            </p>
          </section>

          {/* Section 4 */}
          <section id="purpose" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              4. Mục đích xử lý dữ liệu khảo thí
            </h2>
            <p>Dữ liệu được thu thập chỉ phục vụ các mục đích chính đáng sau:</p>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <strong>Khảo sát và bồi dưỡng:</strong> Đo lường năng lực số đa chiều, phát hiện khoảng trống kỹ năng thực tế và gợi ý chuyên đề học tập thích ứng.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <strong>Quản lý lớp học và báo cáo tổ chức:</strong> Cung cấp báo cáo phân tích cho Giảng viên và Nhà trường để theo dõi sự tiến bộ của tập thể.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <strong>Cấp chứng nhận số:</strong> Tạo lập chứng chỉ chuẩn nét cao và lưu trữ chuỗi mã tra cứu xác thực trên hệ thống cổng kiểm định công khai.
              </div>
            </div>
          </section>

          {/* Section 5: Retention & Integrity */}
          <section id="retention-integrity" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              5. Lưu trữ, tính toàn vẹn và ký số chứng nhận
            </h2>
            <p>
              Mọi chứng chỉ số do NEXA cấp phát đều được áp dụng cơ chế <strong>ký băm kép điện tử</strong> bằng thuật toán mã hóa SHA-256 tiêu chuẩn quốc tế:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-slate-700 dark:text-neutral-300">
              <li><strong>Mã băm dữ liệu học thuật:</strong> Khóa cứng họ tên, ngày sinh, kết quả các miền năng lực số và mã định danh chứng chỉ.</li>
              <li><strong>Mã băm luồng dữ liệu tệp chứng chỉ:</strong> Khóa cứng cấu trúc tệp tài liệu số. Mọi hành vi can thiệp chỉnh sửa đồ họa hay chữ số đều khiến mã băm sai lệch và bị cổng xác thực từ chối lập tức.</li>
            </ul>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              Dữ liệu bài thi được lưu trữ an toàn trên cơ sở dữ liệu phân tán có mã hóa cấp ổ đĩa AES-256 và sao lưu định kỳ.
            </p>
          </section>

          {/* Section 6: User Rights */}
          <section id="user-rights" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              6. Quyền của chủ thể dữ liệu
            </h2>
            <p>
              Theo quy định của Nghị định số 13/2023/NĐ-CP, bạn có toàn quyền đối với dữ liệu cá nhân của mình trên NEXA:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Quyền được biết và truy cập:</span> Xem toàn bộ lịch sử làm bài, điểm số và bài nộp bất cứ lúc nào trong bảng điều khiển cá nhân.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Quyền đính chính thông tin:</span> Yêu cầu điều chỉnh thông tin cá nhân sai sót trước khi chứng chỉ chính thức được ký số ban hành.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Quyền trích xuất dữ liệu:</span> Tải về toàn bộ bảng điểm và lịch sử học tập cá nhân dưới định dạng tệp chuẩn mở.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Quyền yêu cầu xóa bỏ:</span> Yêu cầu hủy bỏ tài khoản và ẩn danh vĩnh viễn các dữ liệu liên quan khi hoàn thành quá trình đào tạo.
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="third-parties" className="scroll-mt-28 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              7. Cam kết bảo mật & Bên thứ ba
            </h2>
            <p>
              NEXA khẳng định cam kết đạo đức nghề nghiệp: <strong>Không bán, không cho thuê và không chia sẻ dữ liệu người dùng cho bất kỳ bên thứ ba vì mục đích thương mại hoặc quảng cáo</strong>.
            </p>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              Việc chia sẻ kết quả học tập chỉ diễn ra trong phạm vi tổ chức giáo dục mà bạn chủ động tham gia thông qua mã tham gia lớp học hoặc lời mời chính thức của nhà trường.
            </p>
          </section>

          {/* Section 8 */}
          <section id="contact" className="scroll-mt-28 space-y-3 p-6 rounded-2xl bg-slate-100/70 dark:bg-zinc-900 ring-1 ring-slate-200 dark:ring-zinc-800">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
              8. Kênh liên hệ Ban Bảo vệ Dữ liệu
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
              Mọi thắc mắc hoặc yêu cầu thực thi quyền chủ thể dữ liệu theo Nghị định số 13/2023/NĐ-CP, xin vui lòng gửi văn bản hoặc thư điện tử chính thức tới:
            </p>
            <div className="text-xs space-y-1 text-neutral-800 dark:text-neutral-200">
              <div>• Đơn vị tiếp nhận: Ban Pháp chế & Bảo vệ Dữ liệu — Nền tảng NEXA</div>
              <div>• Hòm thư điện tử chuyên trách: dpo@nexa.edu.vn hoặc privacy@nexa.edu.vn</div>
              <div>• Thời gian phản hồi cam kết: Tối đa 72 giờ làm việc kể từ thời điểm tiếp nhận</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
