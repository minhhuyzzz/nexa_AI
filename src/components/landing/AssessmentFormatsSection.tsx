'use client';

import React, { useState } from 'react';
import { CheckSquare, MessageSquare, Laptop, FileText, CheckCircle2 } from 'lucide-react';

interface FormatItem {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  desc: string;
  tag: string;
  feature: string;
}

const FORMATS: FormatItem[] = [
  {
    icon: CheckSquare,
    title: 'Trắc nghiệm tư duy',
    subtitle: 'Phản xạ kiến thức nền tảng',
    desc: 'Hệ thống câu hỏi chọn lọc bao quát kiến thức cốt lõi. Nhận ngay kết quả và lời giải thích chi tiết sau khi nộp bài.',
    tag: 'Tự động & Khách quan',
    feature: 'Chấm điểm tức thì',
  },
  {
    icon: MessageSquare,
    title: 'Tình huống thực tế',
    subtitle: 'Bối cảnh công việc thực tế',
    desc: 'Giải quyết các tình huống như ứng phó sự cố an toàn thông tin, bảo hộ bản quyền hoặc lựa chọn công cụ số phù hợp.',
    tag: 'Phản biện & Ứng biến',
    feature: 'Đánh giá qua Rubric',
  },
  {
    icon: Laptop,
    title: 'Thao tác phần mềm',
    subtitle: 'Thực hiện trực tiếp trên ứng dụng',
    desc: 'Thực hành các kỹ năng thực tế: xử lý bảng tính số, cấu hình bảo mật tài khoản hoặc sử dụng công cụ hỗ trợ công việc.',
    tag: 'Kỹ năng thực hành',
    feature: 'Thực chiến trên máy tính',
  },
  {
    icon: FileText,
    title: 'Sản phẩm & giải trình',
    subtitle: 'Thẩm định chất lượng sản phẩm số',
    desc: 'Nộp tệp sản phẩm số hoàn chỉnh kèm nội dung giải trình phương án để Khảo thí viên đánh giá theo tiêu chí rubric.',
    tag: 'Chuyên sâu & Toàn diện',
    feature: 'Khảo thí viên thẩm định',
  },
];

export function AssessmentFormatsSection() {
  const [activeFormatIdx, setActiveFormatIdx] = useState(0);

  const handleFormatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.children.length) return;
    const firstChild = el.children[0] as HTMLElement;
    const cardWidth = firstChild.offsetWidth + 14;
    const newIndex = Math.round(el.scrollLeft / cardWidth);
    if (newIndex >= 0 && newIndex < FORMATS.length && newIndex !== activeFormatIdx) {
      setActiveFormatIdx(newIndex);
    }
  };

  return (
    <section className="py-12 sm:py-24 bg-white dark:bg-black transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3 ring-1 ring-blue-200/60 dark:ring-blue-800/40">
            <span>Hình Thức Đánh Giá</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            4 Hình Thức Khảo Thí Thực Tế
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
            Đo lường năng lực thực chất qua các hình thức đa dạng, phản ánh đúng kỹ năng số trong học tập và công việc.
          </p>
        </div>

        {/* 4 Cards: Mobile Horizontal Snap Carousel, Desktop Grid */}
        <div
          onScroll={handleFormatScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 no-scrollbar"
        >
          {FORMATS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl bg-slate-50/70 dark:bg-zinc-900/50 p-5 sm:p-6 ring-1 ring-slate-200/70 dark:ring-zinc-800/80 transition-all hover:ring-blue-300 dark:hover:ring-blue-900 flex flex-col justify-between group overflow-hidden w-[80vw] max-w-[300px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none"
              >
                {/* Architectural Crosshair Accent */}
                <div className="absolute top-4 right-4 text-slate-300 dark:text-zinc-700 font-mono text-xs select-none">
                  + +
                </div>

                <div>
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs ring-1 ring-slate-200/60 dark:ring-zinc-700/60 mb-5">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>

                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                    {item.tag}
                  </span>

                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  <div className="text-xs font-medium text-slate-500 dark:text-neutral-400 mt-1 mb-3">
                    {item.subtitle}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium text-[11px]">{item.feature}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Pagination Dots */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 mt-2 select-none" aria-hidden="true">
          {FORMATS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeFormatIdx === i ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
