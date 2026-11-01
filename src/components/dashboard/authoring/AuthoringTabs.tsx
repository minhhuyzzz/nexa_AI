'use client';

import React from 'react';
import { LayoutGrid, Edit3, Send, Calendar, Archive } from 'lucide-react';

export type AuthoringTabKey = 'all' | 'draft' | 'ready' | 'in_progress' | 'archived';

interface AuthoringTabsProps {
  activeTab: AuthoringTabKey;
  onTabChange: (tab: AuthoringTabKey) => void;
  counts: {
    all: number;
    draft: number;
    ready: number;
    in_progress: number;
    archived: number;
  };
}

export function AuthoringTabs({ activeTab, onTabChange, counts }: AuthoringTabsProps) {
  const tabs: {
    key: AuthoringTabKey;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'all',
      label: 'Tất cả',
      count: counts.all,
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
    },
    {
      key: 'draft',
      label: 'Bản nháp',
      count: counts.draft,
      icon: <Edit3 className="w-3.5 h-3.5" />,
    },
    {
      key: 'ready',
      label: 'Đã phát hành',
      count: counts.ready,
      icon: <Send className="w-3.5 h-3.5" />,
    },
    {
      key: 'in_progress',
      label: 'Đang diễn ra',
      count: counts.in_progress,
      icon: <Calendar className="w-3.5 h-3.5" />,
    },
    {
      key: 'archived',
      label: 'Lưu trữ',
      count: counts.archived,
      icon: <Archive className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
      {tabs.map((t) => {
        const isActive = activeTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs font-bold'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-neutral-900 dark:hover:text-zinc-200'
            }`}
          >
            <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
              {t.icon}
            </span>
            <span>{t.label}</span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                isActive
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400'
              }`}
            >
              ({t.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
