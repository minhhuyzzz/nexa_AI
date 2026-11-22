import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminRolesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-44 rounded-xl" />
      </div>

      {/* 2. Super Admin Roster Card */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-3 pt-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Platform Admin Roster Card */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-3 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
