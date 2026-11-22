import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function PersonalLearningPathLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* 1. Header & Learning Goal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-72 sm:w-96" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* 2. 2-Column Grid: 4 Cols Trụ Miền (Trái) + 8 Cols Cây Lộ Trình (Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4 Cols): 5 Trụ Miền Năng Lực Số */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs overflow-hidden">
            {/* Banner Header Cột Miền */}
            <div className="p-5 bg-blue-600 space-y-2">
              <Skeleton className="h-5 w-48 bg-blue-400/50" />
              <Skeleton className="h-3.5 w-60 bg-blue-400/40" />
            </div>

            {/* 5 Trụ Miền Năng Lực */}
            <div className="p-4 space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8 Cols): Trạm Học Tập & Chuyên Đề Bồi Dưỡng */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Domain Header */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-3.5 w-96 max-w-full" />
              </div>
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>

            {/* Level Tabs (Cơ bản, Trung cấp, Nâng cao, Chuyên sâu) */}
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>

          {/* Curriculum Stations List */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <SkeletonCard lines={2} hasHeader={false} />
                  <SkeletonCard lines={2} hasHeader={false} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
