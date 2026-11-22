import { Skeleton, SkeletonCardGrid } from '@/components/ui/Skeleton';

export default function AdminPlansLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* 2. Plan Tier Cards Grid (3 Cột Chuẩn Hóa Theo Mẫu) */}
      <SkeletonCardGrid count={3} columns="grid-cols-1 md:grid-cols-3" />

      {/* 3. Entitlement Policy Settings */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-4 shadow-2xs">
        <Skeleton className="h-5 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
