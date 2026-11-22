import {
  Skeleton,
  SkeletonText,
  SkeletonKpiCard,
  SkeletonRadarChart,
  SkeletonCard,
} from '@/components/ui/Skeleton';

export default function PersonalDashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Header & Quick Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 sm:w-72" />
          <Skeleton className="h-4 w-40 sm:w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* 2. Hero Assessment Banner (Dark Luxury) */}
      <div className="rounded-3xl border border-slate-800/80 bg-[#0B1224] dark:bg-black p-6 sm:p-8 sm:py-10 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          <div className="md:col-span-7 lg:col-span-8 space-y-3.5">
            <Skeleton className="h-6 w-36 rounded-full bg-slate-700/60" />
            <Skeleton className="h-8 w-3/4 bg-slate-700/70" />
            <div className="space-y-2 max-w-xl pt-1">
              <Skeleton className="h-4 w-full bg-slate-800/80" />
              <Skeleton className="h-4 w-4/5 bg-slate-800/80" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-10 w-44 rounded-xl bg-blue-600/60" />
              <Skeleton className="h-4 w-32 bg-slate-700/50" />
            </div>
          </div>
          <div className="hidden md:flex md:col-span-5 lg:col-span-4 justify-center items-center">
            <Skeleton className="w-48 h-48 rounded-full bg-slate-800/50" />
          </div>
        </div>
      </div>

      {/* 3. 4 Key Metric Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 4. Hồ Sơ Năng Lực Số (Radar 6 Cols + 5 Miền 6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái (6 Cols): Radar Chart */}
        <div className="lg:col-span-6 space-y-4">
          <SkeletonRadarChart className="min-h-[380px]" />
        </div>

        {/* Cột phải (6 Cols): Chi tiết 5 Miền năng lực số */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-2xs space-y-4 min-h-[380px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-4 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 5. Khảo Thí Thịnh Hành (8 Cols) & Cột Mốc Phát Triển (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 8 Cols: Khảo Thí Thịnh Hành */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
        </div>

        {/* 4 Cols: Cột mốc hoàn thiện */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 shadow-2xs space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                <Skeleton className="w-7 h-7 rounded-lg shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
