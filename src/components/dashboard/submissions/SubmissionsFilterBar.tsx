import React from 'react';
import { Search, Users, ChevronDown, Calendar } from 'lucide-react';

interface SubmissionsFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedClass: string;
  onClassChange: (val: string) => void;
  classList: { id: string; name: string; code: string }[];
  selectedTimeFilter?: string;
  onTimeFilterChange?: (val: string) => void;
}

export function SubmissionsFilterBar({
  searchQuery,
  onSearchChange,
  selectedClass,
  onClassChange,
  classList,
  selectedTimeFilter = 'all',
  onTimeFilterChange,
}: SubmissionsFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên bài hoặc lớp/nhóm..."
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
      </div>

      {/* Class Filter Dropdown */}
      <div className="relative min-w-[200px]">
        <Users
          className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          strokeWidth={1.75}
        />
        <select
          value={selectedClass}
          onChange={(e) => onClassChange(e.target.value)}
          aria-label="Lọc theo lớp hoặc nhóm"
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-neutral-800 dark:text-zinc-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="all">Tất cả lớp / nhóm</option>
          {classList.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} {cls.code ? `(${cls.code})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown
          className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          strokeWidth={1.75}
        />
      </div>

      {/* Time / Sort Filter Dropdown */}
      {onTimeFilterChange && (
        <div className="relative min-w-[160px]">
          <Calendar
            className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.75}
          />
          <select
            value={selectedTimeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value)}
            aria-label="Lọc theo thời gian"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-neutral-800 dark:text-zinc-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="this_week">Hạn trong tuần này</option>
            <option value="this_month">Hạn trong tháng này</option>
          </select>
          <ChevronDown
            className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.75}
          />
        </div>
      )}
    </div>
  );
}
