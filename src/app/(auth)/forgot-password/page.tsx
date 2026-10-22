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
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Khôi phục mật khẩu</h2>
        <p className="text-xs text-slate-500 mt-1">
          Nhập địa chỉ email tài khoản của bạn để nhận hướng dẫn đặt lại mật khẩu mới.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-xs">
              <div className="font-semibold">Yêu cầu đã được gửi thành công!</div>
              <div className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                Nếu email <span className="font-mono font-medium">{email}</span> tồn tại trên hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200/60">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Quay lại trang Đăng nhập</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ Email tài khoản
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
          >
            <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{loading ? 'Đang gửi yêu cầu...' : 'Gửi liên kết khôi phục'}</span>
          </button>
        </form>
      )}

      <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
        Nhớ lại mật khẩu?{' '}
        <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
