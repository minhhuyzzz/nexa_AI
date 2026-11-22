import { Skeleton } from '@/components/ui/Skeleton';

export default function OrgSettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl pb-16 animate-fadeIn">
      {/* 1. Header */}
      <div className="space-y-1.5 pb-1">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 2. Block 1: Thông tin tổ chức */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-4 shadow-2xs">
        <div className="space-y-1.5 pb-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <div className="flex justify-end pt-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* 3. Block 2: Cấu hình khảo thí mặc định */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-4 shadow-2xs">
        <div className="space-y-1.5 pb-1">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
