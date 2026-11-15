'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Radio, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

function LivePinRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPin = searchParams.get('pin');

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (queryPin) {
      const clean = queryPin.trim().replace(/\D/g, '');
      if (clean.length === 6) {
        router.replace(`/live/waiting-room?pin=${clean}`);
      } else {
        setPin(clean);
      }
    }
  }, [queryPin, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setError('Mã PIN phòng thi gồm đúng 6 chữ số');
      return;
    }
    setError('');
    setSubmitting(true);
    router.push(`/live/waiting-room?pin=${cleanPin}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col justify-between p-6 sm:p-10 select-none">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
            N
          </div>
          <span className="font-black text-lg tracking-tight">NEXA</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Khảo thí trực tiếp</span>
        </div>
      </header>

      <main className="my-auto max-w-md w-full mx-auto space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
            Tham Gia Phòng Khảo Thí
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Nhập mã PIN 6 chữ số hiển thị trên máy chiếu hoặc do người tổ chức cung cấp.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPin(val);
                if (error) setError('');
              }}
              placeholder="Nhập 6 số PIN"
              className="w-full text-center tracking-[0.35em] font-mono text-3xl font-black py-4 px-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-neutral-900 dark:text-neutral-100 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-slate-400"
              autoFocus
            />
            {error && (
              <p className="text-xs text-rose-500 font-medium mt-1.5">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || pin.length !== 6}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <span>{submitting ? 'Đang kết nối...' : 'Vào phòng chờ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-neutral-500 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Hệ thống mã hóa bảo mật thời gian thực</span>
        </div>
      </main>

      <footer className="text-center text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
        Hệ thống Khảo thí Thời gian thực NEXA • Khảo thí chuẩn hóa 5 miền năng lực số
      </footer>
    </div>
  );
}

export default function LivePinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Đang khởi tạo...</div>}>
      <LivePinRedirectContent />
    </Suspense>
  );
}
