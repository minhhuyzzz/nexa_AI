import { NexaLogo } from '@/components/brand/NexaLogo';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6 select-none">
      <div role="status" aria-label="Đang tải" className="relative flex items-center justify-center">
        {/* Spinning track ring */}
        <div className="w-16 h-16 rounded-full border-2 border-slate-200/70 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-400 animate-spin" />

        {/* Centered NEXA Emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <NexaLogo variant="dark" size={32} showText={false} />
        </div>
      </div>
    </div>
  );
}
