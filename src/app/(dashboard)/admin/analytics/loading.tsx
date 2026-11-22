import { Skeleton, SkeletonKpiCard, SkeletonTable } from '@/components/ui/Skeleton';

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 2. 4 Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. 5 Domains Chart (7 cols) + Quality Insights (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-2xs">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-3 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Assessment Quality Table */}
      <SkeletonTable rows={6} columns={6} />
    </div>
  );
}
