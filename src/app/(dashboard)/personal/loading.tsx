import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function PersonalDefaultLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Generic Personal Page Header */}
      <div className="space-y-2 pb-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Content Area */}
      <div className="space-y-6 pt-2">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}
