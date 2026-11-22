import {
  Skeleton,
  SkeletonKpiCard,
  SkeletonCard,
  SkeletonTable,
} from '@/components/ui/Skeleton';

export default function OrgAnalyticsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Analytics Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* 2. 5 Analytics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Phân Tích 5 Miền (7 cols) + Trợ Lý Nhận Định NEXA AI (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* 7 Cols: Kết quả 5 miền năng lực số */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="space-y-4 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* 5 Cols: Nhận định & Đề xuất hành động */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 space-y-2.5 my-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
          <div className="pt-3">
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* 4. Khối Tiến Bộ Theo Thời Gian (Full 12 cols) */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton
                className="w-full rounded-t-md"
                style={{ height: `${30 + ((i * 19) % 60)}%` }}
              />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bảng So Sánh Lớp/Đơn Vị Dạng Heatmap D1..D5 */}
      <SkeletonTable rows={5} columns={7} />
    </div>
  );
}
