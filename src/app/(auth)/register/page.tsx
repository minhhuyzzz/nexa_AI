'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { translateAuthError } from '@/lib/utils/auth-error-translator';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const handleGoogleSignup = async () => {
    setError(null);
    setOauthLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : 'Không thể kết nối dịch vụ Google');
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký tài khoản không thành công');
      }

      if (data.requiresEmailConfirmation) {
        setPendingEmail(cleanEmail);
        return;
      }

      router.push(data.redirectUrl || '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-[26px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Kiểm tra email của bạn</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Chúng tôi đã gửi liên kết xác thực tới hộp thư của bạn.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <div className="font-semibold">Xác thực để kích hoạt tài khoản</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                Mở email gửi tới <span className="font-mono font-medium">{pendingEmail}</span> và bấm
                vào liên kết xác thực. Liên kết sẽ đưa bạn thẳng vào bảng điều khiển.
              </div>
            </div>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-2">
            Không thấy email? Hãy kiểm tra thư mục Spam hoặc Thư rác.
          </p>
        </div>

        {/* Login Link (Không viền ngang) */}
        <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-neutral-400 pt-3">
          Đã xác thực xong?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-[26px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Tạo tài khoản cá nhân</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
          Học tập, đánh giá năng lực số toàn diện và khởi tạo bài thi trên NEXA AI.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Địa chỉ email <span className="text-rose-600">*</span>
          </label>
          <input
            id="register-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-2.5 sm:py-3 text-sm border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="register-password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Mật khẩu <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-4 py-2.5 sm:py-3 pr-11 text-sm border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 focus:outline-none p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Xác nhận lại mật khẩu <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2.5 sm:py-3 pr-11 text-sm border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 focus:outline-none p-1 rounded-lg transition-colors cursor-pointer"
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-neutral-500 -mt-1 sm:col-span-2">
            Mật khẩu từ 6 ký tự (kết hợp chữ thường và số).
          </p>
        </div>

        <p className="text-[11px] sm:text-xs text-center text-slate-500 dark:text-neutral-400 pt-1 leading-relaxed">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">Điều khoản dịch vụ</span>{' '}
          và{' '}
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">Chính sách bảo mật dữ liệu</span>.
        </p>

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </form>

      {/* Google OAuth Button */}
      <div>
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={oauthLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-700 dark:text-neutral-200 text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{oauthLoading ? 'Đang mở cổng Google...' : 'Đăng ký nhanh bằng Google'}</span>
        </button>
      </div>

      {/* Login Link (Không viền ngang) */}
      <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-neutral-400 pt-3">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
