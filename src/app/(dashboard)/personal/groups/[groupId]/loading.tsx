import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

export default function PersonalGroupDetailLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <span className="text-slate-300 dark:text-zinc-700">/</span>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* 2. Group Banner Header */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 3. 5-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-zinc-900 rounded-xl max-w-fit">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      {/* 4. Stream & Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <SkeletonTable rows={4} columns={4} />
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-2xs">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2.5 pt-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
