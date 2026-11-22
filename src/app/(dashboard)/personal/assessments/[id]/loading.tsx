import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export default function AssessmentBriefingLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* 1. Back button */}
      <Skeleton className="h-4 w-28" />

      {/* 2. Main Briefing Card */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 sm:p-8 space-y-6 shadow-2xs">
        {/* Title & Badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-8 w-4/5" />
          <SkeletonText lines={2} />
        </div>

        {/* 4 Key Assessment Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 space-y-1.5"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>

        {/* Domain Coverage Breakdown */}
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-44" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-3.5 w-48" />
                </div>
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
