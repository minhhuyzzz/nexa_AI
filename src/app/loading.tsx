import { Skeleton } from '@/components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-3 w-3/4 mx-auto" />
        <Skeleton className="h-1.5 w-1/2 mx-auto rounded-full" />
      </div>
    </div>
  );
}
