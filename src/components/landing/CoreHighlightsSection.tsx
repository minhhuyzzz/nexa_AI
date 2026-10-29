import { CheckCircle2, Sparkles, Award } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: CheckCircle2,
    title: 'Khảo thí thực tế & toàn diện',
    desc: 'Kết hợp trắc nghiệm tư duy, xử lý tình huống thực tế và bài tập thao tác trên công cụ số.',
  },
  {
    icon: Sparkles,
    title: 'Lộ trình học tập cá nhân hóa',
    desc: 'AI phân tích điểm còn thiếu và gợi ý các chặng bồi dưỡng cô đọng, phù hợp với năng lực của bạn.',
  },
  {
    icon: Award,
    title: 'Chứng chỉ xác thực tức thì',
    desc: 'Mỗi chứng nhận cấp ra đều đi kèm mã QR xác thực độc lập, dễ dàng chia sẻ lên hồ sơ cá nhân.',
  },
];

export function CoreHighlightsSection() {
  return (
    <section className="py-12 md:py-14 border-b border-slate-200 bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {HIGHLIGHTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-md bg-white border border-slate-200 shadow-xs transition-colors hover:border-slate-300"
              >
                <div className="w-9 h-9 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
