import { Skeleton, SkeletonCardGrid } from '@/components/ui/Skeleton';

export default function PersonalSubmissionsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Header */}
      <div className="space-y-1.5 pb-1">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* 2. 4 Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-zinc-900 rounded-xl max-w-fit">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>

      {/* 3. Filter Bar: Search + Class select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-9 w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* 4. Submissions Card Grid */}
      <SkeletonCardGrid count={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
