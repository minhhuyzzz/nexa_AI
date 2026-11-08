import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function PersonalLearningPathLoading() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Learning Goal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 sm:w-96" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* 2. 5 Domain Track Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-2.5 w-12" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Detailed Curriculum Path Card */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>

        {/* 4 Skill milestones */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
