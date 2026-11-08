import {
  Skeleton,
  SkeletonKpiCard,
  SkeletonCard,
  SkeletonTable,
} from '@/components/ui/Skeleton';

export default function OrgLoading() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Quick Actions Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-48 sm:w-64" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* 2. 4 KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Operational Step Progress Bar / Quick Wizard */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="w-5 h-5 rounded-full" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Directory & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <SkeletonTable rows={4} columns={4} />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <SkeletonCard hasHeader={true} lines={4} />
        </div>
      </div>
    </div>
  );
}
