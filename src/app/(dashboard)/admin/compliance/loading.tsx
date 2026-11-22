import { Skeleton, SkeletonKpiCard, SkeletonTable } from '@/components/ui/Skeleton';

export default function AdminComplianceLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Header */}
      <div className="space-y-1.5 pb-1">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 2. Top 3 Audit KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>

      {/* 3. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-9 w-80 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4. Compliance Audit Table */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}
