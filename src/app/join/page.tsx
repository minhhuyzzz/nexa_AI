'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  KeyRound,
  ArrowRight,
  Building2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export default function JoinPortalPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Vui lòng nhập mã tham gia hoặc mã tổ chức.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate code exists
      const res = await fetch(`/api/join/org/${cleanCode}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error || 'Mã tham gia không tồn tại trong hệ thống hoặc đã hết hạn.');
        setLoading(false);
        return;
      }

      // Route to the dedicated join submission page
      router.push(`/join/org/${cleanCode}`);
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono">
            NEXA WORKSPACE
          </span>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
          Tham Gia Tổ Chức Bằng Mã
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-neutral-400">
          Nhập mã được nhà trường, cơ quan hoặc quản trị viên cung cấp để gia nhập không gian làm việc.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#111114] py-6 px-6 sm:px-8 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Mã tham gia / Mã tổ chức
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder="VD: FPT-POLY, NX-K24-HN..."
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all uppercase"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
                Bạn có thể lấy mã này từ giảng viên, quản lý hoặc thành viên trong tổ chức.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác minh mã...</span>
                </>
              ) : (
                <>
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 text-center">
            <Link
              href="/personal/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Quay về Dashboard cá nhân</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}