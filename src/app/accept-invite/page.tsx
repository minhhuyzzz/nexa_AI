'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, CheckCircle2, AlertCircle, ArrowRight, Loader2, Lock, User, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<{
    id: string;
    email: string;
    orgRole: string;
    status: string;
    expiresAt: string;
    organization: { id: string; name: string; slug: string; code: string };
    hasExistingAccount: boolean;
  } | null>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // New account form state
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Thiếu mã xác thực lời mời trong liên kết.');
      setLoading(false);
      return;
    }

    async function init() {
      try {
        // 1. Verify invitation token
        const res = await fetch(`/api/organizations/accept-invite?token=${encodeURIComponent(token!)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Lời mời không hợp lệ hoặc đã hết hạn.');
        }
        setInviteData(data.invitation);

        // 2. Check current logged-in user
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user?.email) {
          setCurrentUserEmail(authData.user.email.toLowerCase().trim());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải thông tin lời mời');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [token]);

  // Handle accepting when user is logged in
  const handleAcceptLoggedIn = async () => {
    if (!token) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/organizations/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể chấp nhận lời mời');
      }

      setSuccess(true);
      setTimeout(() => {
        const orgSlug = data.organization?.slug || inviteData?.organization?.slug || inviteData?.organization?.code?.toLowerCase() || 'default';
        const role = data.organization?.role || inviteData?.orgRole || 'MEMBER';
        const isManager = ['ORG_OWNER', 'ORG_ADMIN'].includes(role);

        if (isManager) {
          router.push(`/org/${orgSlug}`);
        } else {
          router.push(`/personal/dashboard?joinedOrg=${encodeURIComponent(orgSlug)}`);
        }
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác nhận lời mời');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle creating account & accepting when user has no account
  const handleCreateAccountAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !inviteData) return;

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/organizations/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo tài khoản');
      }

      // Automatically sign in the user
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: inviteData.email,
        password,
      });

      if (signInErr) {
        console.warn('Auto sign-in failed, redirecting to login:', signInErr.message);
        router.push(`/login?email=${encodeURIComponent(inviteData.email)}`);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        const orgSlug = data.organization?.slug || inviteData.organization?.slug || inviteData.organization?.code?.toLowerCase() || 'default';
        const role = inviteData.orgRole || 'MEMBER';
        const isManager = ['ORG_OWNER', 'ORG_ADMIN'].includes(role);

        if (isManager) {
          router.push(`/org/${orgSlug}`);
        } else {
          router.push(`/personal/dashboard?joinedOrg=${encodeURIComponent(orgSlug)}`);
        }
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Đang kiểm tra lời mời tham gia tổ chức...</p>
      </div>
    );
  }

  const roleLabel =
    inviteData?.orgRole === 'ORG_OWNER'
      ? 'Chủ sở hữu tổ chức'
      : inviteData?.orgRole === 'ORG_ADMIN'
      ? 'Quản trị viên'
      : inviteData?.orgRole === 'ASSESSOR'
      ? 'Khảo thí viên'
      : 'Thành viên';

  const isEmailMatching = currentUserEmail && inviteData && currentUserEmail === inviteData.email.toLowerCase().trim();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center py-12 px-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 mb-4">
          <Building2 className="w-6 h-6" strokeWidth={1.75} />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 text-center">
          Lời mời tham gia tổ chức
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400 text-center mt-1 mb-6">
          Nền tảng đánh giá &amp; phát triển năng lực số NEXA AI
        </p>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 mb-6 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <div className="font-semibold">Thông báo</div>
              <div className="mt-0.5 leading-relaxed">{error}</div>
            </div>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Chào mừng bạn đến với tổ chức!
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Đang chuyển hướng bạn vào không gian làm việc...
            </p>
          </div>
        ) : inviteData ? (
          <div className="space-y-5">
            {/* Organization Info Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-left">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Đơn vị mời
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {inviteData.organization?.name}
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 text-xs">
                <span className="text-slate-500 dark:text-zinc-400">Vai trò bổ nhiệm:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {roleLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-zinc-400">
                <span>Email nhận lời mời:</span>
                <span className="font-mono text-neutral-800 dark:text-zinc-200 font-medium">
                  {inviteData.email}
                </span>
              </div>
            </div>

            {/* CASE 1: Currently logged in with the matching email */}
            {isEmailMatching ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-zinc-300 text-center">
                  Bạn đang đăng nhập bằng <strong>{currentUserEmail}</strong>. Nhấn nút bên dưới để xác nhận quyền và bắt đầu làm việc.
                </p>
                <button
                  type="button"
                  onClick={handleAcceptLoggedIn}
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xác nhận...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác nhận &amp; Vào không gian tổ chức</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : currentUserEmail ? (
              /* Logged in with different email */
              <div className="space-y-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60">
                  Bạn đang đăng nhập bằng <strong>{currentUserEmail}</strong>, nhưng lời mời này được gửi đến <strong>{inviteData.email}</strong>.
                </p>
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm inline-flex items-center justify-center gap-2 block"
                >
                  Đăng nhập tài khoản {inviteData.email}
                </Link>
              </div>
            ) : inviteData.hasExistingAccount ? (
              /* CASE 2: Has account but NOT logged in */
              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-600 dark:text-zinc-300">
                  Tài khoản <strong>{inviteData.email}</strong> đã tồn tại trên NEXA. Vui lòng đăng nhập để tiếp tục.
                </p>
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}&email=${encodeURIComponent(inviteData.email)}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm inline-flex items-center justify-center gap-2 block text-center"
                >
                  <span>Đăng nhập để nhận quyền</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              /* CASE 3: NO account yet -> Direct setup form */
              <form onSubmit={handleCreateAccountAndAccept} className="space-y-3.5 text-left">
                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Thiết lập tài khoản {roleLabel} mới
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Email đăng nhập (cố định)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={inviteData.email}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 text-xs text-slate-500 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang thiết lập...</span>
                    </>
                  ) : (
                    <>
                      <span>Kích hoạt tài khoản &amp; Vào tổ chức</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500 text-center">Đang tải trang xác nhận...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
