import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

export default function OrgCampaignsLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* 2. Filter Bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* 3. Campaigns Table */}
      <SkeletonTable rows={6} columns={6} />
    </div>
  );
}
