import { Skeleton, SkeletonKpiCard } from '@/components/ui/Skeleton';

export default function OrgPlanLoading() {
  return (
    <div className="space-y-6 max-w-5xl pb-16 animate-fadeIn">
      {/* 1. Header */}
      <div className="space-y-1.5 pb-1">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 2. Hero Plan Banner */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* 3. 3 Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 4. Renewal History Block */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
