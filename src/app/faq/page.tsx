import Link from 'next/link';
import { HelpCircle, ChevronDown, ShieldCheck, Zap, Bot, Award, Users, BookOpen } from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export const metadata = {
  title: 'Trung Tâm Hướng Dẫn & Giải Đáp (FAQ) | NEXA',
  description: 'Giải đáp chi tiết về quy trình khảo thí, cơ chế chấm AI On-Demand, bảo mật dữ liệu và xác thực chứng chỉ.',
};

export default function FaqPage() {
  const faqCategories = [
    {
      category: 'Khảo Thí & Chấm Điểm Tức Thì',
      icon: Zap,
      questions: [
        {
          q: 'Tại sao hệ thống có thể chấm bài trắc nghiệm ngay trong 0.01 giây?',
          a: 'NEXA tách biệt hoàn toàn giữa việc chấm khách quan và thẩm định tự luận. Với bài trắc nghiệm (MCQ) và nhánh lựa chọn tình huống, hệ thống chạy thuật toán đối soát trực tiếp trên backend với độ trễ cực thấp (< 0.01s) và tiêu tốn 0 token AI, giúp thí sinh nhận phản hồi giải thích ngay lập tức.',
        },
        {
          q: 'Điểm tích lũy (point) hoạt động như thế nào?',
          a: 'Hệ thống áp dụng chuẩn Gamification học thuật: Thí sinh nhận +50 điểm khi hoàn thành bài thi trắc nghiệm, và nhận thêm +30 điểm khi hoàn thành một bài học trong Lộ trình bồi dưỡng. Điểm số được lưu trữ và đệm qua Upstash Redis để xếp hạng trực tiếp trên Bảng xếp hạng Top 100+ học viên.',
        },
      ],
    },
    {
      category: 'Cơ Chế Trí Tuệ Nhân Tạo & Cờ Tin Cậy',
      icon: Bot,
      questions: [
        {
          q: 'Tại sao hệ thống TUYỆT ĐỐI KHÔNG tự động gọi AI khi nộp bài?',
          a: 'Đây là Luật kiến trúc bất biến số 6 của NEXA (On-Demand AI Trigger). Việc không tự động gọi AI khi nộp bài giúp loại bỏ tình trạng nghẽn mạng, tránh lãng phí chi phí token không cần thiết, và trao toàn quyền chủ động cho Thí sinh hoặc Chuyên gia khảo thí quyết định khi nào cần AI tham gia chấm bài hoặc phân tích sâu.',
        },
        {
          q: 'Ý nghĩa của 3 cờ độ tin cậy AI (Xanh, Cam, Đỏ)?',
          a: 'Mỗi lần AI chấm điểm theo Rubric, hệ thống sẽ tính toán chỉ số tin cậy (confidenceScore từ 0-100):\n• Cờ Xanh (≥ 85%): Độ tin cậy cao, bài làm có luận điểm rõ ràng, khớp chặt chẽ với tiêu chí Rubric.\n• Cờ Cam (60% - 84%): Đạt yêu cầu nhưng câu trả lời còn mang tính định tính.\n• Cờ Đỏ (< 60%): Cảnh báo rủi ro cao, hệ thống yêu cầu Chuyên gia Khảo thí (Evaluator) phải kiểm tra và chấm lại thủ công.',
        },
        {
          q: 'Dữ liệu cá nhân có bị gửi sang nhà cung cấp AI bên thứ ba không?',
          a: 'Không. Tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP, dịch vụ PIIScrubberService của NEXA tự động nhận diện và bóc tách 100% thông tin định danh (Họ tên, SĐT, Email, CCCD, Tài khoản ngân hàng) trước khi bất kỳ đoạn văn bản nào được chuyển qua cổng AI Gateway.',
        },
      ],
    },
    {
      category: 'Lộ Trình Phát Triển 4 Bước',
      icon: BookOpen,
      questions: [
        {
          q: 'Khi nào một kỹ năng bị xác định là "Khoảng trống năng lực"?',
          a: 'Khi kết quả kiểm tra của thí sinh ở một kỹ năng thành phần đạt dưới 60% (Skill Gap < 60%). Hệ thống sẽ đánh dấu màu cảnh báo và tự động giải thích nguyên nhân cùng rủi ro thực tế mà thí sinh có thể gặp phải trong môi trường làm việc số.',
        },
        {
          q: 'Lộ trình 4 bước giúp người học cải thiện như thế nào?',
          a: 'Quy trình khép kín gồm:\n1. Phát hiện kỹ năng yếu (< 60%).\n2. AI sắp xếp học liệu chuẩn thành 3 chặng ưu tiên.\n3. Thí sinh hoàn thành bài học (+30 điểm).\n4. Mở khóa nút "Đánh giá lại kỹ năng" (Re-take) để kiểm tra sự tiến bộ.',
        },
      ],
    },
    {
      category: 'Chứng Chỉ Số & Kiosk Xác Thực QR',
      icon: Award,
      questions: [
        {
          q: 'Cơ chế Băm kép SHA-256 trên Chứng chỉ PDF hoạt động ra sao?',
          a: 'Mỗi chứng chỉ được ký điện tử kép:\n1. Mã băm nội dung (Content Metadata Hash): Mã hóa họ tên, mã chứng chỉ, điểm số 5 Miền.\n2. Mã băm tệp nhị phân (Binary Stream Integrity Hash): Băm toàn bộ luồng byte của file PDF Vector sau khi tạo. Bất kỳ ai can thiệp chỉnh sửa file dù 1 ký tự cũng sẽ khiến mã băm không khớp.',
        },
        {
          q: 'Tại sao không có ô tìm kiếm chứng chỉ trên Trang chủ?',
          a: 'Theo Luật kiến trúc số 3, để ngăn chặn việc quét tự động và thu thập thông tin người dùng trái phép, trang /verify/[credentialId] là một Kiosk độc lập. Người dùng chỉ có thể mở trang xác thực bằng cách quét trực tiếp mã QR in trên chứng chỉ PDF.',
        },
      ],
    },
    {
      category: 'Phòng Thi Trực Tiếp Cho Giảng Viên',
      icon: Users,
      questions: [
        {
          q: 'Giảng viên tổ chức thi cho lớp học như thế nào?',
          a: 'Giảng viên đăng ký tài khoản EVALUATOR, vào mục "Phòng thi trực tiếp", chọn đề thi và nhấn mở phòng. Hệ thống sẽ sinh Mã PIN 6 số ngẫu nhiên. Sinh viên chỉ cần truy cập /learner/live-pin và nhập đúng mã PIN để vào thẳng phòng thi Zen Mode.',
        },
        {
          q: 'Cách xuất dữ liệu phục vụ nghiên cứu khoa học (SPSS, R, Python)?',
          a: 'Tại trang Phân tích của Chuyên gia (/evaluator/analytics), giảng viên nhấn nút "Xuất dữ liệu nghiên cứu". Hệ thống xuất file CSV định dạng UTF-8 BOM bao gồm 26 biến số học thuật chuẩn hóa, hoàn toàn ẩn danh thông tin cá nhân theo đúng chuẩn quốc tế.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <PublicHeader activePath="/faq" />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-16 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Tài liệu hướng dẫn & Cơ sở khoa học chuẩn hóa
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Trung Tâm Hướng Dẫn & Giải Đáp
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Tìm hiểu nguyên lý vận hành, cơ chế bảo vệ quyền riêng tư, cách tính điểm và các quy chuẩn học thuật của Nền tảng NEXA.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {faqCategories.map((cat, catIdx) => {
            const Icon = cat.icon;
            return (
              <section key={catIdx} className="bg-white rounded-md border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{cat.category}</h2>
                </div>

                <div className="space-y-6">
                  {cat.questions.map((item, qIdx) => (
                    <div key={qIdx} className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-start gap-2">
                        <span className="text-sky-600 text-xs mt-0.5">Q.</span>
                        <span>{item.q}</span>
                      </h3>
                      <p className="text-xs text-slate-600 pl-5 leading-relaxed whitespace-pre-line">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Contact Support */}
        <div className="mt-16 p-8 rounded-md bg-white border border-slate-200 text-center shadow-xs">
          <h3 className="text-base font-bold text-slate-900">Vẫn còn thắc mắc cần hỗ trợ kỹ thuật?</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            Đội ngũ chuyên gia khảo thí và kỹ thuật viên luôn sẵn sàng đồng hành cùng bạn và cơ sở đào tạo.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="mailto:support@nexa.edu.vn"
              className="text-xs font-medium px-4 py-2 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors border border-slate-200"
            >
              Gửi email hỗ trợ: support@nexa.edu.vn
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
