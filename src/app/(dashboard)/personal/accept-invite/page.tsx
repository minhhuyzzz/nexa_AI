'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<{
    id: string;
    email: string;
    orgRole: string;
    status: string;
    expiresAt: string;
    organization: { id: string; name: string; slug: string; code: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Thiếu mã xác thực lời mời trong liên kết.');
      setLoading(false);
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/organizations/accept-invite?token=${encodeURIComponent(token!)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Lời mời không hợp lệ hoặc đã hết hạn.');
        }
        setInviteData(data.invitation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải thông tin lời mời');
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
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
        const role = data.membership?.role || inviteData?.orgRole || 'MEMBER';
        const isManager = ['ORG_OWNER', 'ORG_ADMIN'].includes(role);

        if (isManager) {
          router.push(`/org/${orgSlug}`);
        } else {
          router.push(`/personal/dashboard?joinedOrg=${encodeURIComponent(orgSlug)}`);
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác nhận lời mời');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Đang kiểm tra lời mời tham gia tổ chức...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 font-sans">
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 mb-4">
          <Building2 className="w-6 h-6" strokeWidth={1.75} />
        </div>

        <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-1">
          Lời mời gia nhập Tổ chức
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-6">
          Không gian khảo thí &amp; đánh giá năng lực số đa tổ chức
        </p>

        {error && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Đã gia nhập thành công! Đang chuyển hướng...</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500">
              Bạn đang được đưa đến không gian làm việc của tổ chức.
            </p>
          </div>
        ) : inviteData ? (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-left space-y-2.5">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-neutral-500 block font-medium">Tổ chức</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{inviteData.organization.name}</span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300">
                  {inviteData.organization.code}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 dark:text-neutral-500 block font-medium">Vai trò được cấp</span>
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {inviteData.orgRole === 'ADMIN' ? 'Quản trị viên Tổ chức' : 'Thành viên'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 dark:text-neutral-500 block font-medium">Email nhận thư</span>
                <span className="text-xs font-mono text-slate-600 dark:text-neutral-400">{inviteData.email}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kích hoạt...</span>
                  </>
                ) : (
                  <>
                    <span>Chấp nhận &amp; Tham gia ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <Link
                href="/personal/dashboard"
                className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-neutral-400 text-xs font-medium transition-colors"
              >
                Bỏ qua, về Workspace Cá nhân
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/personal/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
          >
            Quay lại Tổng quan Cá nhân
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
