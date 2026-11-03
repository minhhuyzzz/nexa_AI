'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import type { ClassScheduleItem } from './types';

interface UpcomingScheduleCardProps {
  scheduleItems?: ClassScheduleItem[];
}

const DEFAULT_SCHEDULE_ITEMS: ClassScheduleItem[] = [
  {
    id: '1',
    day: '26',
    month: 'Th10',
    title: 'Khai giảng lớp K65 - Khoa CNTT',
    subtitle: 'Chủ nhật, 09:00 – 10:30',
    timeRange: 'Sắp diễn ra',
    statusColor: 'blue',
  },
  {
    id: '2',
    day: '28',
    month: 'Th10',
    title: 'Hạn nộp bài: Đề kiểm tra giữa kỳ',
    subtitle: 'Thứ Ba, 23:59 • 3 lớp áp dụng',
    timeRange: 'Quan trọng',
    statusColor: 'amber',
  },
  {
    id: '3',
    day: '01',
    month: 'Th11',
    title: 'Bắt đầu đợt đánh giá Học kỳ Fall 2026',
    subtitle: 'Thứ Bảy, 00:00 • Toàn bộ khóa K65',
    timeRange: 'Đợt mới',
    statusColor: 'purple',
  },
];

export function UpcomingScheduleCard({
  scheduleItems = DEFAULT_SCHEDULE_ITEMS,
}: UpcomingScheduleCardProps) {
  const getDotClass = (color: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-500';
      case 'purple':
        return 'bg-purple-600';
      case 'emerald':
        return 'bg-emerald-500';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Lịch gần nhất
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Các mốc quan trọng sắp diễn ra trong lớp & nhóm.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {scheduleItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 leading-none">
                  {item.day}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium leading-none mt-0.5">
                  {item.month}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                  {item.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`w-2 h-2 rounded-full ${getDotClass(item.statusColor)}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
