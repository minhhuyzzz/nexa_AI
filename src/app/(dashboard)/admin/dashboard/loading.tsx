import {
  Skeleton,
  SkeletonKpiCard,
  SkeletonCard,
} from '@/components/ui/Skeleton';

export default function AdminDashboardLoading() {
  return (
    <main className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Admin Header & Quick Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-8 w-56 sm:w-72" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
      </header>

      {/* 2. Platform 6 KPI Cards (Chuẩn 6 cột xl:grid-cols-6) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Middle Grid: 7 Cols Chart + 5 Cols Quality & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 7 Cols: Biểu đồ khảo thí */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="h-60 flex items-end justify-between gap-3 pt-4 px-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton
                  className="w-full rounded-t-md"
                  style={{ height: `${35 + ((i * 17) % 55)}%` }}
                />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>

        {/* 5 Cols: Chất lượng khảo thí & Tuân thủ */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-xs">
          <Skeleton className="h-5 w-52" />
          <div className="space-y-3 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: 8 Cols Activity + 4 Cols Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 8 Cols: Hoạt động gần đây */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* 4 Cols: Trạng thái hạ tầng & AI */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-3.5 shadow-xs">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-2.5 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
