'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
  Hash,
  Send,
  LogIn,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface JoinOrgData {
  valid: boolean;
  error?: string;
  joinCode?: {
    id: string;
    code: string;
    title: string;
    expiresAt: string;
  };
  organization?: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
}

export default function JoinOrgPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JoinOrgData | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Check user session
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUser({ id: user.id, email: user.email });
          // Fetch existing profile name if available
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.full_name) {
            setFullName(profile.full_name);
          }
        }

        // Fetch join code info
        const res = await fetch(`/api/join/org/${joinCode}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        setData({ valid: false, error: 'Không thể kết nối đến máy chủ NEXA' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [joinCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/login?redirect=/join/org/${joinCode}`);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`/api/join/org/${joinCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, studentId }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setSubmitError(resData.error || 'Lỗi gửi yêu cầu tham gia');
        return;
      }

      setSubmittedSuccess(true);
    } catch (err) {
      setSubmitError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-sky-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            NEXA DIGITAL COMPETENCY PLATFORM
          </span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Cổng Tiếp Nhận Tham Gia Tổ Chức
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Tham gia hệ thống khảo thí và đánh giá năng lực số theo lời mời
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 sm:px-8 border border-slate-200 rounded-md shadow-xs space-y-5 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-300" />
              Đang xác minh mã tham gia...
            </div>
          ) : !data?.valid ? (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-0.5">Mã tham gia không hợp lệ</div>
                  <div>{data?.error || 'Mã đã hết hạn, bị thu hồi hoặc đã vượt quá số lượt dùng cho phép.'}</div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/personal/overview"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                >
                  <span>Quay về trang cá nhân</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : submittedSuccess ? (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Đã gửi yêu cầu tham gia thành công!</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Yêu cầu của bạn đã được chuyển vào hàng đợi xét duyệt của{' '}
                  <strong>{data.organization?.name}</strong>. Quản trị viên sẽ kiểm tra và kích hoạt quyền thành viên cho bạn.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-600 font-mono">
                <div>Đơn vị: {data.organization?.name}</div>
                <div>Mã tham gia: {data.joinCode?.code}</div>
                <div>Tài khoản: {currentUser?.email}</div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/personal/overview"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors shadow-xs"
                >
                  <span>Truy cập Personal Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Organization Card Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="uppercase">{data.organization?.code}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    Mã PIN: {data.joinCode?.code}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {data.organization?.name}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {data.joinCode?.title}
                </div>
              </div>

              {/* Authentication Guard Notice */}
              {!currentUser ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <LogIn className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-0.5">Yêu cầu đăng nhập tài khoản NEXA</div>
                      <div className="text-[11px] text-amber-800">
                        Bạn cần đăng nhập tài khoản người học để gửi thông tin danh tính và nhận thông báo kết quả xét duyệt.
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/login?redirect=/join/org/${joinCode}`}
                    className="w-full py-1.5 px-3 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-center block transition-colors shadow-xs text-xs"
                  >
                    Đăng nhập hoặc Đăng ký ngay
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {submitError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Tài khoản NEXA của bạn:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.email || ''}
                      className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Họ và tên người học: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Mã sinh viên / Mã định danh đơn vị (nếu có):
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ví dụ: 20210001, SV-K24..."
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Quy trình bảo mật tổ chức:</span>
                    </div>
                    <p>
                      Mã tham gia này không tự động cấp quyền quản trị. Đơn vị sẽ xác minh danh tính và duyệt tài khoản của bạn vào danh sách học viên trực thuộc.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting || !fullName.trim()}
                      className="w-full py-2 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu tham gia'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
