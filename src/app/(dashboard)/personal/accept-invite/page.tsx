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
        router.push(`/org/${orgSlug}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác nhận lời mời');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Đang kiểm tra lời mời tham gia tổ chức...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 shadow-xs text-center">
        <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600 mb-4">
          <Building2 className="w-6 h-6" strokeWidth={1.75} />
        </div>

        <h1 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
          Lời mời gia nhập Tổ chức
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          NEXA AI Multi-tenant Organization Workspace
        </p>

        {error && (
          <div className="p-3 mb-6 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">Đã gia nhập thành công! Đang chuyển hướng...</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Bạn đang được đưa đến không gian làm việc của tổ chức.
            </p>
          </div>
        ) : inviteData ? (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-left space-y-2.5">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Tổ chức</span>
                <span className="text-sm font-bold text-slate-900">{inviteData.organization.name}</span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                  {inviteData.organization.code}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Vai trò được cấp</span>
                <span className="text-xs font-semibold text-slate-800">
                  {inviteData.orgRole === 'ADMIN' ? 'Quản trị viên Tổ chức' : 'Thành viên'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Email nhận thư</span>
                <span className="text-xs font-mono text-slate-600">{inviteData.email}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-2.5 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kích hoạt...</span>
                  </>
                ) : (
                  <>
                    <span>Chấp nhận & Tham gia ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <Link
                href="/personal/dashboard"
                className="w-full py-2 px-4 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
              >
                Bỏ qua, về Workspace Cá nhân
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/personal/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
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
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
