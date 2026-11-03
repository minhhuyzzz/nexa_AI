'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface OrgFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  totalCount?: number;
  countLabel?: string;
  children?: React.ReactNode;
}

export function OrgFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel,
  totalCount,
  countLabel = 'kết quả',
  children,
}: OrgFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
      <div className="flex flex-1 items-center gap-2.5 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-8 pl-8.5 pr-7 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-neutral-400 p-0.5 rounded"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Filter Select */}
        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-1.5">
            {filterLabel && (
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                {filterLabel}:
              </span>
            )}
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="h-8 px-2.5 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {children}
      </div>

      {/* Result Count */}
      {typeof totalCount === 'number' && (
        <div className="shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 tabular-nums">
            {totalCount} {countLabel}
          </span>
        </div>
      )}
    </div>
  );
}
