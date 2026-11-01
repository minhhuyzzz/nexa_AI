import React from 'react';
import { SubmissionTabKey } from '@/features/classes/types/personal-submissions.types';

interface SubmissionsTabsProps {
  activeTab: SubmissionTabKey;
  onTabChange: (tab: SubmissionTabKey) => void;
  counts: {
    all: number;
    todo: number;
    wait: number;
    done: number;
  };
}

export function SubmissionsTabs({ activeTab, onTabChange, counts }: SubmissionsTabsProps) {
  const tabs: { key: SubmissionTabKey; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'todo', label: 'Cần làm', count: counts.todo },
    { key: 'wait', label: 'Đã nộp', count: counts.wait },
    { key: 'done', label: 'Đã chấm', count: counts.done },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-4 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
      {tabs.map((t) => {
        const isActive = activeTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400'
              }`}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
