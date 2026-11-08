import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

export default function OrgGradingLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 2. Submissions Queue Table */}
      <SkeletonTable rows={6} columns={6} />
    </div>
  );
}
