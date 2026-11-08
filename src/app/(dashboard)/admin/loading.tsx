import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function AdminDefaultLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Generic Admin Header */}
      <div className="space-y-2 pb-2">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* 2. Generic Content Area */}
      <div className="space-y-6 pt-2">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}
