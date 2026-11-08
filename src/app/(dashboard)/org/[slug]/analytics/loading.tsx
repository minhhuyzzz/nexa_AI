import {
  Skeleton,
  SkeletonKpiCard,
  SkeletonCard,
  SkeletonTable,
} from '@/components/ui/Skeleton';

export default function OrgAnalyticsLoading() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Analytics Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
      </div>

      {/* 2. 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Domain Bar Chart & Breakdown Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="h-64 flex items-end justify-between gap-4 pt-6 px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton
                  className="w-full rounded-t-lg"
                  style={{ height: `${40 + ((i * 17) % 55)}%` }}
                />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={2} />
        </div>
      </div>

      {/* 4. Unit Heatmap Table */}
      <SkeletonTable rows={5} columns={6} />
    </div>
  );
}
