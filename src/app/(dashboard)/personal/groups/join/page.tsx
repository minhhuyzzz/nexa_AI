'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  KeyRound,
  Search,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Users,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

interface PreviewClass {
  id: string;
  name: string;
  code: string;
  description: string;
  evaluatorName: string;
  evaluatorAvatar?: string | null;
  memberCount: number;
  createdAt: string;
  isOwner: boolean;
  isMember: boolean;
  requiresApproval: boolean;
}

export default function JoinPersonalGroupPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewClass | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Joining state
  const [joining, setJoining] = useState(false);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);

  const cleanCode = code.trim().toUpperCase();

  const handleCheckCode = async () => {
    if (!cleanCode || cleanCode.length < 2) {
      setErrorMsg('Vui lòng nhập mã nhóm hợp lệ');
      setPreviewData(null);
      return;
    }

    setChecking(true);
    setErrorMsg(null);
    setPreviewData(null);
    setJoinSuccessMsg(null);

    try {
      const res = await fetch(`/api/classes/preview?code=${encodeURIComponent(cleanCode)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không tìm thấy nhóm với mã này');
      }

      setPreviewData(data.class);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi tra cứu mã');
      setPreviewData(null);
    } finally {
      setChecking(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!previewData) return;

    if (previewData.isMember || previewData.isOwner) {
      router.push(`/personal/groups/${previewData.id}`);
      return;
    }

    setJoining(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode: previewData.code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tham gia nhóm thất bại');
      }

      setJoinSuccessMsg('Gia nhập không gian thành công!');
      setTimeout(() => {
        router.push(`/personal/groups/${data.classId || previewData.id}`);
      }, 700);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi hệ thống');
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Breadcrumb navigation */}
      <div>
        <Link
          href="/personal/groups"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Lớp & Nhóm</span>
        </Link>
      </div>

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-850">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
              THAM GIA HỌC TẬP
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Tham gia lớp hoặc nhóm
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Nhập mã được chia sẻ để xem thông tin không gian trước khi gửi yêu cầu tham gia.
          </p>
        </div>
      </div>

      {/* 3. Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* Left Column: Code input & Preview Verification Card (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Nhập mã tham gia
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Nhận mã từ người quản lý lớp hoặc nhóm. Mã không phải mật khẩu tài khoản.
              </p>
            </div>
          </div>

          {/* Input Box */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200">
              Mã lớp hoặc nhóm
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckCode();
                }}
                placeholder="VD: CLS-4821"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-base font-mono font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="button"
                disabled={checking || !cleanCode}
                onClick={handleCheckCode}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-500/20"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" strokeWidth={2} />
                    <span>Kiểm tra mã</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Notification */}
          {joinSuccessMsg && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{joinSuccessMsg}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-zinc-850 pt-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
              KẾT QUẢ TRA CỨU · THÔNG TIN KHÔNG GIAN
            </span>

            {previewData ? (
              <div className="mt-3 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
                      {previewData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {previewData.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        Người quản lý: <strong className="text-neutral-800 dark:text-zinc-200">{previewData.evaluatorName}</strong>
                        <span className="mx-1.5">&bull;</span>
                        <span className="font-mono">{previewData.memberCount} thành viên</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {previewData.isOwner ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        Bạn là Quản lý
                      </span>
                    ) : previewData.isMember ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Đã tham gia
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        Sẵn sàng gia nhập
                      </span>
                    )}
                  </div>
                </div>

                {previewData.description && (
                  <p className="text-xs text-neutral-700 dark:text-zinc-300 italic border-l-2 border-blue-400 pl-2.5 my-2">
                    {previewData.description}
                  </p>
                )}

                <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                    Mã xác nhận: {previewData.code}
                  </span>
                  <button
                    type="button"
                    disabled={joining}
                    onClick={handleConfirmJoin}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tham gia...</span>
                      </>
                    ) : previewData.isOwner ? (
                      <>
                        <span>Vào quản lý lớp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : previewData.isMember ? (
                      <>
                        <span>Vào không gian lớp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Xác nhận tham gia ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-8 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400 dark:text-neutral-500">
                Nhập mã và bấm &quot;Kiểm tra mã&quot; để xem trước thông tin trước khi vào lớp.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3-Step Guide (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Tham gia chỉ với 3 bước
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  1
                </div>
                <div>
                  <div className="font-bold text-neutral-900 dark:text-neutral-100">
                    Nhận mã tham gia
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    Giảng viên hoặc chủ nhóm cung cấp cho bạn mã định danh (Ví dụ: <code>CLS-8921</code>).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  2
                </div>
                <div>
                  <div className="font-bold text-neutral-900 dark:text-neutral-100">
                    Xác minh thông tin lớp học
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    Kiểm tra tên lớp, giảng viên phụ trách và quy mô thành viên để đảm bảo vào đúng nhóm.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  3
                </div>
                <div>
                  <div className="font-bold text-neutral-900 dark:text-neutral-100">
                    Bắt đầu học và nhận bài
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    Nhận các bài khảo thí đánh giá năng lực được giao và truy cập kho tài liệu lớp học.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-start gap-2 text-[11px] text-slate-400 dark:text-neutral-500 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Mã tham gia được bảo mật; quyền truy cập tài liệu và bài khảo thí tuân thủ chính sách của lớp học.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
