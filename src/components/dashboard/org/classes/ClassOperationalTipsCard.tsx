'use client';

import React from 'react';
import { Lightbulb, UserCheck, FileText, Download } from 'lucide-react';

export function ClassOperationalTipsCard() {
  const tips = [
    {
      icon: UserCheck,
      title: 'Bổ sung người phụ trách',
      desc: 'Đảm bảo mỗi đơn vị hoặc nhóm có người phụ trách để quản lý và giải đáp hiệu quả.',
    },
    {
      icon: FileText,
      title: 'Giao đề đánh giá đúng lộ trình',
      desc: 'Thiết lập đề và hạn nộp theo kế hoạch học kỳ để học viên chủ động chuẩn bị.',
    },
    {
      icon: Download,
      title: 'Xuất danh sách khi cần báo cáo',
      desc: 'Dễ dàng trích xuất danh sách lớp và thành viên để tổng hợp vào hệ thống đào tạo.',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3 pb-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
          Mẹo vận hành lớp
        </h3>
      </div>

      <div className="space-y-3">
        {tips.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {t.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  {t.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
