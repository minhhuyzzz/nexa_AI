import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* 2. Search & Filter */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* 3. Users Table */}
      <SkeletonTable rows={7} columns={6} />
    </div>
  );
}
