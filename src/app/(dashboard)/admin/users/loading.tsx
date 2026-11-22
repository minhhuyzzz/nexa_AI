import { Skeleton, SkeletonKpiCard, SkeletonTable } from '@/components/ui/Skeleton';

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Header */}
      <div className="space-y-1.5 pb-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 2. Top 3 KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Toolbar Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-9 w-80 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4. Users Table */}
      <SkeletonTable rows={7} columns={6} />
    </div>
  );
}
