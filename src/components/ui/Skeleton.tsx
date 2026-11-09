import * as React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Khối Skeleton nguyên tử cơ bản với hiệu ứng nhịp thở (animate-pulse).
 * Hỗ trợ tự động Light Mode (slate-200/80) và Dark Mode (zinc-800/80) chuẩn NEXA.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-slate-200/80 dark:bg-zinc-800/80 pointer-events-none select-none',
        className
      )}
      {...props}
    />
  );
}

/**
 * Khung Skeleton giả lập các dòng văn bản với độ rộng tự nhiên.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2.5', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => {
        // Dòng cuối cùng ngắn hơn để tạo cảm giác đoạn văn tự nhiên
        const widthClass =
          index === lines - 1 && lines > 1
            ? 'w-3/5'
            : index % 2 === 1
            ? 'w-4/5'
            : 'w-full';
        return <Skeleton key={index} className={cn('h-4', widthClass)} />;
      })}
    </div>
  );
}

/**
 * Khung Skeleton giả lập thẻ chỉ số (KPI / Metric Card).
 */
export function SkeletonKpiCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-2xs space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-20" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

/**
 * Khung Skeleton giả lập Thẻ nội dung (Card chung).
 */
export function SkeletonCard({
  className,
  hasHeader = true,
  lines = 3,
}: {
  className?: string;
  hasHeader?: boolean;
  lines?: number;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 shadow-2xs space-y-4',
        className
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between pb-3">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  );
}

/**
 * Khung Skeleton giả lập Bảng dữ liệu (Table Skeleton).
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-2xs',
        className
      )}
    >
      {/* Table Toolbar */}
      <div className="p-4 flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/60 dark:bg-zinc-900/60">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="col-span-3">
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>

      {/* Table Rows */}
      <div className="">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div key={cIdx} className="col-span-3 flex items-center gap-3">
                {cIdx === 0 && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
                <Skeleton
                  className={cn(
                    'h-4',
                    cIdx === 0 ? 'w-36' : cIdx === 1 ? 'w-24' : cIdx === 2 ? 'w-20' : 'w-16'
                  )}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Khung Skeleton giả lập Vùng Radar Chart 5 Miền năng lực số.
 */
export function SkeletonRadarChart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 flex flex-col items-center justify-center space-y-4 shadow-2xs min-h-[320px]',
        className
      )}
    >
      <div className="w-full flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-dashed border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-center animate-pulse">
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-200/40 dark:border-zinc-800/50 flex items-center justify-center">
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </div>
      <div className="w-full flex justify-around pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
