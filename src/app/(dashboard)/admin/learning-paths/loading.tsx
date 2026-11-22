import { Skeleton, SkeletonCardGrid } from '@/components/ui/Skeleton';

export default function AdminLearningPathsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* 2. 5 Domain Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-zinc-900 rounded-xl max-w-fit overflow-x-auto">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* 3. 4 Level Tabs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* 4. Curriculum Modules Card Grid */}
      <SkeletonCardGrid count={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
