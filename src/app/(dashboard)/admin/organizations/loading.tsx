import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';

export default function AdminOrganizationsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>

      {/* 2. 3 Main Tabs: Yêu cầu B2B, Danh sách tổ chức, Gia hạn */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-zinc-900 rounded-xl max-w-fit">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* 3. Sub-Filter Pills + Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-xl" />
          <Skeleton className="h-7 w-28 rounded-xl" />
          <Skeleton className="h-7 w-28 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4. Organizations Table (Đáp ứng động 7 cột) */}
      <SkeletonTable rows={7} columns={7} />
    </div>
  );
}
