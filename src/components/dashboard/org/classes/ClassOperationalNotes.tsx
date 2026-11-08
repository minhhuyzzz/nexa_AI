'use client';

import React from 'react';
import { AlertTriangle, Info, BookOpen, StickyNote } from 'lucide-react';

export function ClassOperationalNotes() {
  const notes = [
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'Nhắc nhở: Cập nhật danh sách chính thức',
      desc: 'Vui lòng rà soát và chốt danh sách lớp trước ngày 30/10.',
      border: 'border-amber-200 dark:border-amber-900',
      bg: 'bg-amber-50/50 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      type: 'info',
      icon: Info,
      title: 'Chuẩn bị đề đánh giá giữa kỳ',
      desc: 'Hạn tạo đề: 27/10. Ưu tiên bám theo chuẩn học kỳ Fall 2026.',
      border: 'border-blue-200 dark:border-blue-900',
      bg: 'bg-blue-50/50 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      type: 'purple',
      icon: BookOpen,
      title: 'Đồng bộ tài nguyên học tập',
      desc: 'Cập nhật slide, bài đọc và tài liệu lab trước buổi học 26/10.',
      border: 'border-purple-200 dark:border-purple-900',
      bg: 'bg-purple-50/50 dark:bg-purple-950/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3 pb-2">
        <StickyNote className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
          Ghi chú vận hành
        </h3>
      </div>

      <div className="space-y-2.5">
        {notes.map((n, i) => {
          const Icon = n.icon;
          return (
            <div
              key={i}
              className={`p-2.5 rounded-md border ${n.border} ${n.bg} flex items-start gap-2.5`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${n.iconColor}`} />
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {n.title}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  {n.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
