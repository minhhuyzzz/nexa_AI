'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể gửi yêu cầu khôi phục mật khẩu. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-[26px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Khôi phục mật khẩu</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
          Nhập địa chỉ email tài khoản của bạn để nhận hướng dẫn đặt lại mật khẩu mới.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-xs">
              <div className="font-semibold">Yêu cầu đã được gửi thành công!</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                Nếu email <span className="font-mono font-medium">{email}</span> tồn tại trên hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Quay lại trang Đăng nhập</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Địa chỉ Email tài khoản
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 sm:py-3 text-sm border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4" strokeWidth={1.75} />
            <span>{loading ? 'Đang gửi yêu cầu...' : 'Gửi liên kết khôi phục'}</span>
          </button>
        </form>
      )}

      <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-neutral-400 pt-4">
        Nhớ lại mật khẩu?{' '}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
