import React from 'react';

interface SubmissionsHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function SubmissionsHeader({
  eyebrow = 'LỚP & NHÓM / NHIỆM VỤ',
  title = 'Bài được giao',
  subtitle = 'Các bài và nhiệm vụ do lớp hoặc nhóm của bạn giao. Theo dõi hạn nộp, hoàn thành và xem phản hồi tại đây.',
}: SubmissionsHeaderProps) {
  return (
    <div className="pb-4 border-b border-slate-100 dark:border-zinc-850">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
        <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
          {eyebrow}
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
