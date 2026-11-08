import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function PersonalAssessmentsLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="space-y-2 pb-2">
        <Skeleton className="h-8 w-64 sm:w-80" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 2. Toolbar: Search Bar + Domain Filter Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="h-4 w-28 shrink-0" />
      </div>

      {/* 3. Grid of Assessment Cards (3 columns x 2 rows) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    </div>
  );
}
