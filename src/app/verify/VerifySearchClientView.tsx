'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Award,
  CheckCircle2,
  Lock,
  QrCode,
  ArrowLeft,
} from 'lucide-react';
import { NexaLogo } from '@/components/brand/NexaLogo';

export function VerifySearchClientView() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError('Vui lòng nhập mã chứng chỉ hoặc mã băm xác thực.');
      return;
    }
    setError(null);
    router.push(`/verify/${encodeURIComponent(cleanCode)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Bar */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between pb-6">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
          <NexaLogo size={28} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Về trang chủ</span>
        </Link>
      </div>

      {/* Main Search Card */}
      <div className="max-w-xl w-full mx-auto space-y-6">
        <div className="bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Tra cứu chứng nhận số
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
              Cổng đối soát tính toàn vẹn và tình trạng hiệu lực của chứng chỉ năng lực số do NEXA AI cấp phát.
            </p>
          </div>

          {/* Form Tra Cứu */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nhập mã chứng chỉ (ví dụ: CERT-2026-XXXX hoặc UUID)..."
                className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-400 font-mono transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Kiểm tra và xác thực</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </form>

          {/* Core Trust Badges */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-1">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto" strokeWidth={1.75} />
              <strong className="block text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
                Chữ ký SHA-256
              </strong>
              <span className="block text-[10px] text-slate-400 dark:text-neutral-500">
                Mã băm kép bất biến
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-1">
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" strokeWidth={1.75} />
              <strong className="block text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
                Quét mã QR tức thì
              </strong>
              <span className="block text-[10px] text-slate-400 dark:text-neutral-500">
                Tra cứu công khai 24/7
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto" strokeWidth={1.75} />
              <strong className="block text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
                Chống giả mạo
              </strong>
              <span className="block text-[10px] text-slate-400 dark:text-neutral-500">
                Cơ sở dữ liệu khảo thí thật
              </span>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <p className="text-center text-[11px] text-slate-400 dark:text-neutral-500">
          Dành cho nhà tuyển dụng, trường học và doanh nghiệp kiểm định năng lực số của ứng viên.
        </p>
      </div>

      {/* Empty bottom balancer */}
      <div />
    </div>
  );
}
