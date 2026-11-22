import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export default function OrgGradingLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="space-y-1.5 pb-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 2. Master-Detail Workbench (30% Cột hàng đợi / 70% Bàn chấm) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 border border-slate-200/70 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#111114] min-h-[700px] shadow-2xs">
        {/* CỘT TRÁI (30%): Hàng đợi nộp bài */}
        <div className="lg:col-span-3 border-r border-slate-200/60 dark:border-zinc-800 p-4 space-y-3 bg-slate-50/50 dark:bg-[#0d0d10]">
          <div className="flex items-center justify-between pb-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-12" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
          {/* Danh sách bài nộp chờ chấm */}
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI (70%): Bàn chấm & Đề xuất AI */}
        <div className="lg:col-span-7 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header thí sinh */}
            <div className="flex items-start justify-between gap-4 pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3.5 w-56" />
                </div>
              </div>
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>

            {/* AI Assistant Banner / Helper Box */}
            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>

            {/* Khung câu hỏi và bài làm mở */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <SkeletonText lines={3} />
                <div className="pt-2">
                  <Skeleton className="h-9 w-32 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
