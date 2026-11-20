'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  Zap,
  Bot,
  Award,
  Users,
  HelpCircle,
  X,
  MessageCircle,
  FileText,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'assessment' | 'assessor' | 'organization' | 'credential' | 'ai';
  categoryLabel: string;
  question: string;
  answer: string;
  highlights?: string[];
}

const FAQ_DATA: FaqItem[] = [
  // Category: assessment
  {
    id: 'faq-1',
    category: 'assessment',
    categoryLabel: 'Học viên & Khảo thí',
    question: 'Tại sao hệ thống có thể chấm bài trắc nghiệm ngay lập tức?',
    answer:
      'NEXA tách biệt hoàn toàn giữa việc chấm khách quan và thẩm định tự luận. Với bài trắc nghiệm đa lựa chọn và nhánh lựa chọn tình huống, hệ thống chạy thuật toán đối soát trực tiếp trên backend với độ trễ cực thấp và không tiêu tốn tài nguyên trí tuệ nhân tạo. Thí sinh nhận kết quả và đối chiếu năng lực số tức thì ngay khi nộp bài.',
    highlights: ['Chấm thuần backend', 'Phản hồi tức thì', 'Tối ưu tài nguyên'],
  },
  {
    id: 'faq-2',
    category: 'assessment',
    categoryLabel: 'Học viên & Khảo thí',
    question: 'Điểm tích lũy và Bảng xếp hạng học tập hoạt động như thế nào?',
    answer:
      'Hệ thống áp dụng chuẩn ghi nhận năng lực học thuật: Thí sinh nhận điểm tích lũy khi hoàn thành bài thi trắc nghiệm đạt chuẩn, và nhận thêm điểm khi hoàn thành một bài học trong Lộ trình bồi dưỡng. Điểm số được lưu trữ và tổng hợp tự động để xếp hạng trực tiếp trên Bảng vinh danh học viên xuất sắc.',
    highlights: ['Điểm bài thi chuẩn hóa', 'Điểm bài học chuyên đề', 'Bảng vinh danh minh bạch'],
  },
  {
    id: 'faq-3',
    category: 'assessment',
    categoryLabel: 'Học viên & Khảo thí',
    question: 'Làm thế nào để tham gia phòng thi trực tiếp bằng mã phòng thi?',
    answer:
      'Khi Giảng viên hoặc Khảo thí viên mở phòng thi, hệ thống sẽ cung cấp một mã gồm đúng 6 chữ số. Bạn chỉ cần truy cập đường dẫn trực tiếp hoặc quét mã phản hồi nhanh do Giảng viên chia sẻ, nhập mã 6 số và họ tên để bước vào phòng thi trong chế độ tập trung cao độ.',
    highlights: ['Mã định danh 6 số', 'Giao diện tập trung', 'Vào thi nhanh chóng'],
  },
  {
    id: 'faq-4',
    category: 'assessment',
    categoryLabel: 'Học viên & Khảo thí',
    question: 'Nếu gặp sự cố mất kết nối mạng khi đang làm bài thì sao?',
    answer:
      'Hệ thống NEXA lưu trữ trạng thái câu trả lời cục bộ trên trình duyệt theo từng giây. Nếu gặp sự cố mất điện hoặc rớt mạng, bạn chỉ cần mở lại trình duyệt và tải lại trang, hệ thống sẽ khôi phục chính xác các câu trả lời bạn đã chọn kèm thời gian làm bài còn lại.',
    highlights: ['Lưu tự động từng giây', 'Khôi phục phiên làm bài', 'Bảo toàn thời gian thi'],
  },

  // Category: assessor
  {
    id: 'faq-5',
    category: 'assessor',
    categoryLabel: 'Khảo thí viên & Bàn chấm',
    question: 'Khảo thí viên chấm bài theo Bàn chấm Rubric như thế nào?',
    answer:
      'Tại không gian Bàn chấm Rubric, Khảo thí viên quan sát bài làm tự luận của thí sinh song song với barem tiêu chuẩn. Bạn chỉ cần bấm chọn mức độ tương ứng (Khởi đầu, Cơ bản, Thành thạo, Xuất sắc); hệ thống sẽ tự động tổng hợp điểm tiêu chí và cho phép chỉnh sửa nhận xét sư phạm trước khi chính thức phê duyệt ban hành.',
    highlights: ['Barem đa tiêu chí', 'Giao diện chấm song song', 'Toàn quyền chỉnh sửa nhận xét'],
  },
  {
    id: 'faq-6',
    category: 'assessor',
    categoryLabel: 'Khảo thí viên & Bàn chấm',
    question: 'Cơ chế con người làm chủ thẩm định bảo đảm quyền hạn của Khảo thí viên ra sao?',
    answer:
      'Trí tuệ nhân tạo trên NEXA chỉ đóng vai trò trợ lý đề xuất điểm nháp và dự thảo nhận xét sư phạm. Điểm số của thí sinh không bao giờ được tự động công bố nếu chưa có thao tác phê duyệt từ Khảo thí viên. Khảo thí viên có toàn quyền tăng, giảm hoặc ghi đè toàn bộ điểm số đề xuất.',
    highlights: ['Trí tuệ nhân tạo gợi ý nháp', 'Khảo thí viên duyệt điểm cuối cùng', 'Minh bạch sư phạm'],
  },

  // Category: organization
  {
    id: 'faq-7',
    category: 'organization',
    categoryLabel: 'Tổ chức & Giảng viên',
    question: 'Trường học hoặc Doanh nghiệp có thể tạo đợt khảo thí diện rộng ra sao?',
    answer:
      'Trong không gian Tổ chức, Quản trị viên có thể tạo các chiến dịch khảo thí diện rộng theo từng học kỳ hoặc đợt đánh giá chuyên môn. Hệ thống hỗ trợ sinh mã tham gia nhóm lớp, phân công hội đồng chấm thi tập trung, và tự động tổng hợp báo cáo đo lường độ trưởng thành số cấp đơn vị.',
    highlights: ['Khảo thí diện rộng', 'Hội đồng chấm tập trung', 'Báo cáo trưởng thành số'],
  },
  {
    id: 'faq-8',
    category: 'organization',
    categoryLabel: 'Tổ chức & Giảng viên',
    question: 'Cách xuất dữ liệu phục vụ nghiên cứu khoa học chuyên sâu?',
    answer:
      'Tại mục Quản lý lớp học và Phân tích tổ chức, Giảng viên chỉ cần nhấn nút xuất dữ liệu nghiên cứu. Hệ thống xuất ngay tệp dữ liệu chuẩn UTF-8 gồm đầy đủ các biến số học thuật, hoàn toàn khử thông tin định danh cá nhân theo tiêu chuẩn đạo đức nghiên cứu quốc tế.',
    highlights: ['Định dạng tệp chuẩn', 'Đầy đủ biến số học thuật', 'Khử định danh chuẩn nghiên cứu'],
  },

  // Category: credential
  {
    id: 'faq-9',
    category: 'credential',
    categoryLabel: 'Chứng chỉ & Cổng xác thực',
    question: 'Cơ chế ký băm kép trên Chứng chỉ số hoạt động ra sao?',
    answer:
      'Mỗi chứng nhận số cấp ra được bảo vệ bằng hai lớp mã băm điện tử SHA-256: thứ nhất là mã băm nội dung học thuật khóa cứng họ tên, ngày sinh và kết quả các miền năng lực; thứ hai là mã băm luồng dữ liệu nhị phân khóa cứng toàn bộ cấu trúc tệp chứng chỉ. Bất kỳ ai can thiệp chỉnh sửa dù một ký tự trên chứng chỉ cũng khiến mã băm sai lệch và bị cổng kiểm định từ chối.',
    highlights: ['Ký băm kép điện tử', 'Khóa luồng tệp số', 'Chống làm giả tuyệt đối'],
  },
  {
    id: 'faq-10',
    category: 'credential',
    categoryLabel: 'Chứng chỉ & Cổng xác thực',
    question: 'Nhà tuyển dụng xác thực tính hợp lệ của chứng nhận số bằng cách nào?',
    answer:
      'Nhà tuyển dụng hoặc cơ sở đào tạo chỉ cần dùng camera điện thoại quét mã phản hồi nhanh in trên góc chứng chỉ. Đường dẫn sẽ đưa thẳng tới cổng kiểm định độc lập để đối chiếu dữ liệu gốc từ máy chủ NEXA, hoàn toàn không cần đăng nhập hay cài đặt phần mềm phụ trợ.',
    highlights: ['Quét mã kiểm tra trực tiếp', 'Cổng xác thực độc lập', 'Không cần tài khoản'],
  },

  // Category: ai
  {
    id: 'faq-11',
    category: 'ai',
    categoryLabel: 'Trí tuệ nhân tạo',
    question: 'Tại sao hệ thống không tự động kích hoạt trí tuệ nhân tạo khi nộp bài?',
    answer:
      'Đây là nguyên tắc kiến trúc cốt lõi của NEXA nhằm khởi tạo trí tuệ nhân tạo theo yêu cầu thực tế. Việc không tự động gọi trí tuệ nhân tạo khi nộp bài giúp loại bỏ hoàn toàn tình trạng nghẽn mạng khi hàng ngàn thí sinh nộp bài cùng lúc, tránh lãng phí tài nguyên tính toán, và trao quyền chủ động tuyệt đối cho Khảo thí viên quyết định thời điểm cần trợ giúp.',
    highlights: ['Tránh nghẽn mạng cao điểm', 'Tiết kiệm tài nguyên', 'Khảo thí viên chủ động'],
  },
  {
    id: 'faq-12',
    category: 'ai',
    categoryLabel: 'Trí tuệ nhân tạo',
    question: 'Ý nghĩa của hệ thống cờ độ tin cậy trí tuệ nhân tạo (Cờ Xanh, Cờ Cam, Cờ Đỏ)?',
    answer:
      'Mỗi khi trí tuệ nhân tạo tham gia đối chiếu bài làm theo tiêu chí chấm, hệ thống sẽ tính toán chỉ số tự tin học thuật: Cờ Xanh (từ 85% trở lên) thể hiện độ tin cậy cao, bài làm bám sát tiêu chí; Cờ Cam (từ 60% đến 84%) đạt yêu cầu nhưng còn định tính; Cờ Đỏ (dưới 60%) cảnh báo rủi ro cao, hệ thống yêu cầu Khảo thí viên phải kiểm tra và chấm lại hoàn toàn thủ công.',
    highlights: ['Cờ Xanh (từ 85% trở lên)', 'Cờ Cam (từ 60% đến 84%)', 'Cờ Đỏ (Chấm lại thủ công)'],
  },
  {
    id: 'faq-13',
    category: 'ai',
    categoryLabel: 'Trí tuệ nhân tạo',
    question: 'Dữ liệu cá nhân có bị gửi sang nhà cung cấp trí tuệ nhân tạo bên thứ ba không?',
    answer:
      'Tuyệt đối không. Tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP, dịch vụ khử định danh tự động của NEXA sẽ nhận diện và bóc tách toàn bộ thông tin định danh (Họ tên, Số điện thoại, Thư điện tử, Số căn cước, Lớp học) trước khi bất kỳ bài làm nào được chuyển qua cổng phân tích trí tuệ nhân tạo.',
    highlights: ['Tuân thủ Nghị định 13/2023/NĐ-CP', 'Bộ lọc khử định danh tự động', 'Không rò rỉ danh tính'],
  },
];

type CategoryFilter = 'all' | 'assessment' | 'assessor' | 'organization' | 'credential' | 'ai';

const CATEGORIES: { id: CategoryFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'Tất cả câu hỏi', icon: HelpCircle },
  { id: 'assessment', label: 'Học viên & Khảo thí', icon: Zap },
  { id: 'assessor', label: 'Khảo thí viên & Bàn chấm', icon: BookOpen },
  { id: 'organization', label: 'Tổ chức & Giảng viên', icon: Users },
  { id: 'credential', label: 'Chứng chỉ & Xác thực', icon: Award },
  { id: 'ai', label: 'Trí tuệ nhân tạo', icon: Bot },
];

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-1': true,
  });

  const toggleAccordion = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return FAQ_DATA.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        q === '' ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        (item.highlights && item.highlights.some((h) => h.toLowerCase().includes(q)));

      return matchCategory && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Schema.org FAQPage Structured Data for Google Rich Snippets
  const faqSchemaData = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_DATA.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
      />

      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 ring-1 ring-slate-200 dark:ring-zinc-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-4 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span>Trung tâm trợ giúp & Giải đáp học thuật</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          Câu Hỏi Thường Gặp
        </h1>

        {/* Search Bar */}
        <div className="mt-8 relative max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm câu hỏi, từ khóa (ví dụ: chấm điểm, AI, chứng chỉ, phòng thi)..."
              className="w-full pl-12 pr-10 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm sm:text-base ring-1 ring-slate-200 dark:ring-zinc-800 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 outline-none transition-all shadow-xs placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="mt-2 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 pl-2">
              Tìm thấy {filteredFaqs.length} câu hỏi phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar select-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300 ring-1 ring-slate-200/80 dark:ring-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion FAQ Items List */}
      {filteredFaqs.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-slate-50 dark:bg-zinc-900/60 ring-1 ring-slate-200/80 dark:ring-zinc-800">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Không tìm thấy câu hỏi phù hợp
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
            Hãy thử tìm kiếm với từ khóa khác hoặc bấm chọn danh mục khác ở thanh lọc phía trên.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((item) => {
            const isOpen = !!openItems[item.id];

            return (
              <div
                key={item.id}
                className={`rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-slate-50/80 dark:bg-zinc-900/80 ring-2 ring-blue-600/40 dark:ring-blue-500/40 shadow-xs'
                    : 'bg-white dark:bg-zinc-900/40 ring-1 ring-slate-200/80 dark:ring-zinc-800 hover:ring-slate-300 dark:hover:ring-zinc-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex-1 pr-2">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                      {item.categoryLabel}
                    </span>
                    <h3
                      className={`text-base sm:text-lg font-bold transition-colors ${
                        isOpen
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {item.question}
                    </h3>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-180 bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                </button>

                {/* Expandable Content */}
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-slate-700 dark:text-neutral-300 leading-relaxed">
                    <p>{item.answer}</p>

                    {item.highlights && item.highlights.length > 0 && (
                      <div className="mt-4 pt-3 flex flex-wrap gap-2">
                        {item.highlights.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200/50 dark:ring-blue-900/50"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Support CTA Box */}
      <div className="mt-16 sm:mt-20 rounded-3xl bg-slate-50 dark:bg-zinc-900/60 p-8 sm:p-10 ring-1 ring-slate-200/80 dark:ring-zinc-800 text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/25">
            <MessageCircle className="w-6 h-6" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            Bạn vẫn còn câu hỏi khác?
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
            Đội ngũ chuyên môn khảo thí và hỗ trợ kỹ thuật của NEXA sẵn sàng đồng hành cùng bạn để triển khai giải pháp bồi dưỡng số tối ưu.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/policies"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-zinc-800 ring-1 ring-slate-200 dark:ring-zinc-700 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Trung tâm chính sách</span>
            </Link>

            <Link
              href="/pricing#b2b"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors shadow-xs shadow-blue-500/20"
            >
              <span>Liên hệ hỗ trợ B2B</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
