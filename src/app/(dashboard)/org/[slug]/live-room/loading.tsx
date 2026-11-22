import { Skeleton, SkeletonKpiCard, SkeletonCardGrid } from '@/components/ui/Skeleton';

export default function OrgLiveRoomLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* 2. 4 Live KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Fast PIN Entry Banner */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* 4. Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-zinc-900 rounded-xl max-w-fit">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-60 rounded-lg" />
      </div>

      {/* 5. Live Room Card Grid (3 Cột Chuẩn Hóa Theo Mẫu) */}
      <SkeletonCardGrid count={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
