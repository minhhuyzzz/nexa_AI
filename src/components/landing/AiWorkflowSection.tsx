'use client';

import React, { useState } from 'react';
import { Layers, Sparkles, CheckCircle2, ShieldCheck, Cpu, UserCheck } from 'lucide-react';

interface StepItem {
  step: string;
  title: string;
  desc: string;
  highlight: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepItem[] = [
  {
    step: '01',
    title: 'Tạo đợt khảo thí',
    desc: 'Giảng viên hoặc tổ chức thiết lập bài thi, phân công Khảo thí viên và lựa chọn các miền năng lực mục tiêu.',
    highlight: 'Linh hoạt cấu hình đề',
    icon: Layers,
  },
  {
    step: '02',
    title: 'Làm bài thi',
    desc: 'Học viên làm bài khảo thí đầu vào hoặc tham gia phòng thi trực tiếp, ghi nhận minh bạch kết quả từng câu trả lời.',
    highlight: 'Đánh giá khách quan',
    icon: Cpu,
  },
  {
    step: '03',
    title: 'Chấm bài theo Rubric',
    desc: 'Hệ thống gợi ý điểm nháp theo tiêu chí cho bài tự luận; Khảo thí viên kiểm tra, điều chỉnh và duyệt điểm chính thức.',
    highlight: 'Khảo thí viên quyết định',
    icon: UserCheck,
  },
  {
    step: '04',
    title: 'Cấp chứng nhận số',
    desc: 'Kết quả được cập nhật vào Hồ sơ năng lực, cấp chứng nhận có mã xác thực và gợi ý lộ trình bồi dưỡng kỹ năng còn thiếu.',
    highlight: 'Ghi nhận năng lực',
    icon: ShieldCheck,
  },
];

export function AiWorkflowSection() {
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const handleStepScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.children.length) return;
    const firstChild = el.children[0] as HTMLElement;
    const cardWidth = firstChild.offsetWidth + 14;
    const newIndex = Math.round(el.scrollLeft / cardWidth);
    if (newIndex >= 0 && newIndex < STEPS.length && newIndex !== activeStepIdx) {
      setActiveStepIdx(newIndex);
    }
  };

  return (
    <section className="py-12 sm:py-24 bg-white dark:bg-black transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3 ring-1 ring-blue-200/60 dark:ring-blue-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quy Trình Khảo Thí</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quy Trình Khảo Thí & Bồi Dưỡng
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
            4 Bước khép kín từ khảo thí, chấm bài rubric minh bạch đến cấp chứng nhận và bồi dưỡng kỹ năng.
          </p>
        </div>

        {/* 4 Steps: Mobile Horizontal Snap Carousel, Desktop Grid */}
        <div
          onScroll={handleStepScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 no-scrollbar"
        >
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative rounded-3xl bg-slate-50/70 dark:bg-zinc-900/50 p-5 sm:p-7 ring-1 ring-slate-200/70 dark:ring-zinc-800/80 transition-all hover:ring-blue-300 dark:hover:ring-blue-900 flex flex-col justify-between group overflow-hidden w-[80vw] max-w-[300px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none"
              >
                {/* Architectural Crosshair Accent */}
                <div className="absolute top-4 right-4 text-slate-300 dark:text-zinc-700 font-mono text-xs select-none">
                  + +
                </div>

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-blue-600/30 dark:text-blue-400/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {step.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs ring-1 ring-slate-200/50 dark:ring-zinc-700/50">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-[11px]">{step.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Pagination Dots */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 mt-2 select-none" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeStepIdx === i ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
