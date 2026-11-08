import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

export default function AdminOrganizationsLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* 2. Tabs Row (Yêu cầu B2B, Danh sách tổ chức, Gia hạn) */}
      <div className="flex items-center gap-2 pb-3">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* 3. Organizations Table */}
      <SkeletonTable rows={7} columns={7} />
    </div>
  );
}
