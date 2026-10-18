import { CheckSquare, MessageSquare, Laptop, FileText } from 'lucide-react';

const formats = [
  {
    icon: CheckSquare,
    title: 'Trắc nghiệm tư duy',
    subtitle: 'Kiểm tra phản xạ & kiến thức nền tảng',
    desc: 'Hệ thống câu hỏi chọn lọc bao quát các kiến thức cốt lõi. Sau khi nộp bài, bạn nhận được ngay lời giải thích cặn kẽ cho từng đáp án.',
    tag: 'Nhanh chóng & Khách quan',
  },
  {
    icon: MessageSquare,
    title: 'Tình huống ra quyết định',
    subtitle: 'Mô phỏng bối cảnh công việc thực tế',
    desc: 'Đặt bạn vào các kịch bản thực tiễn như ứng phó sự cố an ninh mạng, bản quyền số hoặc lựa chọn công cụ phù hợp để đo lường khả năng tư duy.',
    tag: 'Phản biện & Ứng biến',
  },
  {
    icon: Laptop,
    title: 'Nhiệm vụ thao tác thực hành',
    subtitle: 'Thực hiện trực tiếp trên phần mềm',
    desc: 'Yêu cầu thực hành các kỹ năng thực tế: xử lý và trực quan hóa bảng tính, cấu hình xác thực 2 bước hoặc xây dựng câu lệnh prompt tối ưu.',
    tag: 'Kỹ năng thực chiến',
  },
  {
    icon: FileText,
    title: 'Sản phẩm & Giải trình',
    subtitle: 'Thẩm định chất lượng sản phẩm số',
    desc: 'Nộp tệp sản phẩm số hoàn thiện (báo cáo, thiết kế, tài liệu) kèm phần giải trình phương án thực hiện để chuyên gia và AI đánh giá toàn diện.',
    tag: 'Sáng tạo & Chuyên sâu',
  },
];

export function AssessmentFormatsSection() {
  return (
    <section className="py-20 border-t border-slate-200/80 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
            Phương pháp khảo thí đa dạng
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            4 Hình thức Đánh giá Thực tiễn
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            NEXA tập trung đo lường năng lực ứng dụng thực tế thông qua các thử thách phong phú, giúp phản ánh trung thực kỹ năng số của người học.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {formats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>

                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium mb-2.5">
                    {item.tag}
                  </span>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
                  <div className="text-xs font-medium text-sky-600 mb-2.5">{item.subtitle}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
