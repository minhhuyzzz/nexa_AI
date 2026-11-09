import {
  Skeleton,
  SkeletonKpiCard,
  SkeletonCard,
  SkeletonTable,
} from '@/components/ui/Skeleton';

export default function OrgClassAnalyticsLoading() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-16" />
        <span className="text-slate-300 dark:text-zinc-700">/</span>
        <Skeleton className="h-3.5 w-20" />
        <span className="text-slate-300 dark:text-zinc-700">/</span>
        <Skeleton className="h-3.5 w-24" />
        <span className="text-slate-300 dark:text-zinc-700">/</span>
        <Skeleton className="h-3.5 w-20" />
      </div>

      {/* 2. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-44 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>

      {/* 3. Row 1: KPI strip & Fast Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-4">
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-4/6" />
          </div>
        </div>
      </div>

      {/* 4. Row 2: Completion Progress Card */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-3">
        <Skeleton className="h-4 w-64" />
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="w-28 h-28 rounded-full shrink-0" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 5. Row 3: 5 Domains Competency Section */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-80 max-w-full" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-3"
            >
              <div className="flex justify-between">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-4 w-28" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Row 4: At Risk Members & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3">
          <Skeleton className="h-4 w-48" />
          <SkeletonTable rows={4} columns={4} />
        </div>
        <div className="lg:col-span-5 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3">
          <Skeleton className="h-4 w-48" />
          <div className="space-y-2.5">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
