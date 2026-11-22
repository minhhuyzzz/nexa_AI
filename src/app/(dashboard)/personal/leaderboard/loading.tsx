import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

export default function PersonalLeaderboardLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Hero Luxury Banner */}
      <div className="rounded-3xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 sm:p-8 shadow-2xs space-y-3">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 2. 4 Period Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-zinc-900 rounded-xl max-w-fit mx-auto">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* 3. Top 3 Podium (Hạng 2, Hạng 1, Hạng 3) */}
      <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto pt-4">
        {/* Rank 2 */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3.5 w-14" />
          <div className="w-full h-24 rounded-t-2xl bg-slate-100 dark:bg-zinc-800/80" />
        </div>
        {/* Rank 1 */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-4.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
          <div className="w-full h-32 rounded-t-2xl bg-blue-100 dark:bg-blue-950/60" />
        </div>
        {/* Rank 3 */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3.5 w-14" />
          <div className="w-full h-20 rounded-t-2xl bg-slate-100 dark:bg-zinc-800/80" />
        </div>
      </div>

      {/* 4. Leaderboard Ranking Table */}
      <SkeletonTable rows={6} columns={4} />
    </div>
  );
}
