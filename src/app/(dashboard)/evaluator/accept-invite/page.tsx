'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Building2, CheckCircle2, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Thiếu mã liên kết lời mời');
      setIsLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/organizations/accept-invite?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Lời mời không hợp lệ');
        }
        setInviteData(data.invitation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kiểm tra lời mời');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
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
        router.push('/evaluator/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
        <p className="text-xs text-slate-500">Đang kiểm tra liên kết lời mời...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-md border border-rose-200 bg-white shadow-xs space-y-4 text-center">
        <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h2 className="text-base font-bold text-slate-900">Không Thể Tiếp Nhận Lời Mời</h2>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        <Link
          href="/evaluator/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
        >
          <span>Về bàn làm việc</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-md border border-emerald-200 bg-white shadow-xs space-y-4 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h2 className="text-base font-bold text-slate-900">Gia Nhập Thành Công!</h2>
        <p className="text-xs text-slate-500">
          Bạn đã là thành viên chính thức. Đang chuyển hướng về Bàn làm việc...
        </p>
      </div>
    );
  }

  const orgName = inviteData?.organization?.name || 'Tổ chức';
  const roleName = inviteData?.orgRole === 'ORG_ADMIN' ? 'Quản trị viên tổ chức' : 'Người đánh giá / Giảng viên';

  return (
    <div className="max-w-md mx-auto my-12 p-6 rounded-md border border-slate-200 bg-white shadow-xs space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h1 className="text-lg font-bold text-slate-900">
          Lời Mời Gia Nhập Tổ Chức
        </h1>
        <p className="text-xs text-slate-500">
          Bạn được mời tham gia vào không gian khảo thí chuyên môn của:
        </p>
      </div>

      <div className="p-4 rounded-md border border-slate-100 bg-slate-50 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Tổ chức / Đơn vị:</span>
          <span className="font-bold text-slate-900">{orgName}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Vai trò đảm nhiệm:</span>
          <span className="font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
            {roleName}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Email nhận lời mời:</span>
          <span className="font-mono text-slate-700">{inviteData?.email}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          {isAccepting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Chấp nhận lời mời & Gia nhập</span>
        </button>
        <Link
          href="/evaluator/dashboard"
          className="w-full py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium text-center transition-colors"
        >
          Để sau
        </Link>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Đang tải...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
