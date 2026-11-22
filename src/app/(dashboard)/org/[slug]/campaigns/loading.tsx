import { Skeleton, SkeletonCardGrid } from '@/components/ui/Skeleton';

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

      {/* 2. Filter Bar: Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-zinc-900 rounded-xl max-w-fit">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-60 rounded-lg" />
      </div>

      {/* 3. 3-Column Card Grid (khớp chuẩn hình mẫu thiết kế của nền tảng) */}
      <SkeletonCardGrid count={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
