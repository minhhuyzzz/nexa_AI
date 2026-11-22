import { Skeleton, SkeletonKpiCard } from '@/components/ui/Skeleton';

export default function OrgLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-52 sm:w-72" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* 2. 4 Executive KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Main Operational Grid: 8 Cols Left + 4 Cols Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (8 Cols): Campaigns & Classes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Module 1: Đợt Khảo Thí Gần Đây */}
          <div className="rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-3 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between"
                >
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Module 2: Lớp học và Không gian đào tạo */}
          <div className="rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-60" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-slate-100 dark:border-zinc-800/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (4 Cols): Năng Lực Số 5 Miền & Lối Tắt */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: 5 Miền Năng Lực Số */}
          <div className="rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Lối tắt & Thông tin vận hành */}
          <div className="rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-3 shadow-xs">
            <Skeleton className="h-4 w-36 mb-2" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
