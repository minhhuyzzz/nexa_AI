'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { translateAuthError } from '@/lib/utils/auth-error-translator';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Email hoặc mật khẩu không chính xác');
      }

      // Safe local redirect check (prevent Open Redirect vulnerability)
      let destination = data.redirectUrl || '/dashboard';
      if (
        redirectParam &&
        redirectParam.startsWith('/') &&
        !redirectParam.startsWith('//') &&
        !redirectParam.includes('\\')
      ) {
        destination = redirectParam;
      }

      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-[26px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Đăng nhập tài khoản</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
          Chào mừng bạn trở lại! Tiếp tục hành trình đánh giá và phát triển năng lực số.
        </p>
      </div>

      {redirectParam && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <span>Vui lòng đăng nhập để tiếp nhận quyền truy cập hoặc lời mời của bạn.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Địa chỉ email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-2.5 sm:py-3 text-sm border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" strokeWidth={1.75} />
          <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
        </button>
      </form>

      {/* Google OAuth Button - Placed at Bottom */}
      <div>
        <button
          type="button"
          onClick={handleGoogleLogin}
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
          <span>{oauthLoading ? 'Đang mở cổng Google...' : 'Đăng nhập bằng Google'}</span>
        </button>
      </div>

      {/* Register Link (Không viền ngang) */}
      <div className="text-center text-xs text-slate-500 dark:text-neutral-400 pt-3">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
          Đăng ký miễn phí
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-xs text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Đang tải trang đăng nhập...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
