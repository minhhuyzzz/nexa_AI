import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

export default function OrgMembersLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* 2. Role Filter Tabs */}
      <div className="flex items-center gap-2 pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      {/* 3. Member Directory Table */}
      <SkeletonTable rows={7} columns={5} />
    </div>
  );
}
