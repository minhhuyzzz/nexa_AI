import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export default function PersonalProfileLoading() {
  return (
    <div className="max-w-6xl space-y-6 pb-16 animate-fadeIn">
      {/* 1. Profile Hero Card Skeleton */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-36" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-2 w-48 rounded-full" />
          </div>
        </div>
      </div>

      {/* 2. Navigation Pill Tabs */}
      <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-zinc-900 rounded-xl max-w-fit">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* 3. Profile Details Grid / Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-5 shadow-2xs">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-4 shadow-2xs">
          <Skeleton className="h-5 w-28" />
          <SkeletonText lines={3} />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
