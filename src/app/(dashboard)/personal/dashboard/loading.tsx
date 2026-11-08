import {
  Skeleton,
  SkeletonText,
  SkeletonKpiCard,
  SkeletonRadarChart,
  SkeletonCard,
} from '@/components/ui/Skeleton';

export default function PersonalDashboardLoading() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Quick Indicators Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 sm:w-72" />
          <Skeleton className="h-4 w-40 sm:w-48" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero Assessment / Progress Banner Skeleton */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 sm:p-8 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-7 w-3/4" />
            <SkeletonText lines={2} className="max-w-xl" />
            <div className="pt-2 flex items-center gap-3">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-4 flex justify-center">
            <Skeleton className="w-36 h-36 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* 3. 2-Column Dashboard Grid: Radar 5 Miền & Danh sách Khảo thí */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Hồ sơ năng lực & Radar Chart */}
        <div className="lg:col-span-7 space-y-6">
          <SkeletonRadarChart />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonKpiCard />
            <SkeletonKpiCard />
          </div>
        </div>

        {/* Right Column: Danh sách bài đánh giá & Tiến trình */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-4/5" />
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            </div>
          </div>

          <SkeletonCard lines={2} />
        </div>
      </div>
    </div>
  );
}
