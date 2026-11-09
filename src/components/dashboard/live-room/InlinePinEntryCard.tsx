'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, ArrowRight } from 'lucide-react';

export interface InlinePinEntryCardProps {
  className?: string;
  compact?: boolean;
  autoFocus?: boolean;
}

export function InlinePinEntryCard({
  className = '',
  compact = false,
  autoFocus = false,
}: InlinePinEntryCardProps) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setError('Mã PIN phòng thi phải gồm đúng 6 chữ số');
      return;
    }
    setError('');
    setIsNavigating(true);
    router.push(`/live/waiting-room?pin=${cleanPin}`);
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs ${
        compact ? 'p-4' : 'p-5 sm:p-6'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Vào phòng thi trực tiếp
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-semibold border border-blue-200/60 dark:border-blue-800/60">
                LIVE PIN
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Nhập mã PIN 6 số do giám thị hoặc tổ chức cung cấp để tham gia phòng chờ ngay lập tức
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:shrink-0">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus={autoFocus}
              value={pin}
              onChange={(e) => {
                const nextVal = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPin(nextVal);
                if (error) setError('');
              }}
              placeholder="Mã PIN 6 số (VD: 849201)"
              className="w-full sm:w-56 px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold tracking-widest text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans focus:outline-hidden focus:border-blue-600 shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={pin.length !== 6 || isNavigating}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <span>{isNavigating ? 'Đang chuyển...' : 'Vào phòng chờ'}</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </form>
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
