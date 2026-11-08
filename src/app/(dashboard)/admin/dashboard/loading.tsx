import {
  Skeleton,
  SkeletonKpiCard,
  SkeletonCard,
  SkeletonTable,
} from '@/components/ui/Skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-56 sm:w-72" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* 2. Platform 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Action Queues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard hasHeader={true} lines={2} />
        <SkeletonCard hasHeader={true} lines={2} />
        <SkeletonCard hasHeader={true} lines={2} />
      </div>

      {/* 4. Submissions Table */}
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}
