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
  LogIn,
  KeyRound,
  ExternalLink,
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
    slug?: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [orgSlug, setOrgSlug] = useState<string>('');

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
        if (result.organization?.slug) {
          setOrgSlug(result.organization.slug);
        }
      } catch {
        setData({ valid: false, error: 'Không thể kết nối đến máy chủ NEXA' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [joinCode]);

  const handleDirectJoin = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ fullName }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setSubmitError(resData.error || 'Không thể tham gia tổ chức.');
        return;
      }

      setJoinedSuccess(true);
      if (resData.organizationSlug) {
        setOrgSlug(resData.organizationSlug);
      }
    } catch {
      setSubmitError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono">
            NEXA WORKSPACE
          </span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Gia Nhập Tổ Chức
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-neutral-400">
          Kết nối vào không gian khảo thí và đánh giá năng lực số trực tiếp
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#111114] py-6 px-6 sm:px-8 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl space-y-5 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 dark:text-neutral-500">
              <Clock className="w-5 h-5 mx-auto mb-2 animate-spin text-blue-600" />
              Đang xác minh mã mời...
            </div>
          ) : !data?.valid ? (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-0.5">Mã tham gia không hợp lệ</div>
                  <div>{data?.error || 'Mã đã hết hạn, bị thu hồi hoặc đã vượt quá số lượt dùng cho phép.'}</div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/personal/overview"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-neutral-900 font-semibold transition-colors"
                >
                  <span>Quay về trang cá nhân</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : joinedSuccess ? (
            /* ======================================================== */
            /* SUCCESS STATE: DIRECT ACTIVE MEMBERSHIP                  */
            /* ======================================================== */
            <div className="space-y-4 py-2 animate-in fade-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Tham gia thành công!</span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Bạn đã trở thành thành viên chính thức của <strong>{data.organization?.name}</strong>. Giờ đây bạn có thể truy cập không gian khảo thí và các bài đánh giá được giao.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 rounded-xl text-[11px] text-slate-600 dark:text-neutral-400 font-mono space-y-1">
                <div>Đơn vị: {data.organization?.name}</div>
                <div>Mã tham gia: {data.joinCode?.code}</div>
                <div>Tài khoản: {currentUser?.email}</div>
                <div>Trạng thái: Hoạt động (Active)</div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={orgSlug ? `/org/${orgSlug}` : '/personal/overview'}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <span>Truy cập không gian tổ chức ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/personal/overview"
                  className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 font-medium text-center transition text-xs"
                >
                  Về trang cá nhân
                </Link>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* FORM STATE: INSTANT JOIN CONFIRMATION                    */
            /* ======================================================== */
            <div className="space-y-5">
              {/* Organization Card Banner */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                  <span className="uppercase">{data.organization?.code}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-neutral-800 dark:text-neutral-200 font-bold">
                    Mã PIN: {data.joinCode?.code}
                  </span>
                </div>
                <div className="text-base font-bold text-neutral-900 dark:text-neutral-100 pt-0.5">
                  {data.organization?.name}
                </div>
                {data.joinCode?.title && (
                  <div className="text-xs text-slate-500 dark:text-neutral-400">
                    {data.joinCode.title}
                  </div>
                )}
              </div>

              {/* Authentication Guard Notice */}
              {!currentUser ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-amber-900 dark:text-amber-200 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <LogIn className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-0.5">Yêu cầu đăng nhập tài khoản NEXA</div>
                      <div className="text-[11px] text-amber-800 dark:text-amber-300">
                        Vui lòng đăng nhập để liên kết tài khoản của bạn vào tổ chức này.
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/login?redirect=/join/org/${joinCode}`}
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-center block transition-colors shadow-xs text-xs"
                  >
                    Đăng nhập hoặc Đăng ký ngay
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleDirectJoin} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                      Tài khoản liên kết:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.email || ''}
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-600 dark:text-neutral-400 font-mono text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                      Họ và tên hiển thị (tùy chọn):
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Nhập họ và tên..."
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-blue-600 text-xs text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Đang tham gia...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Xác nhận tham gia tổ chức</span>
                        </>
                      )}
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
