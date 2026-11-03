'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  KeyRound,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  User,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface JoinOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OrgCheckResult {
  valid: boolean;
  error?: string;
  joinCode?: {
    id: string;
    code: string;
    title: string;
    expiresAt: string | null;
  };
  organization?: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
}

export function JoinOrgModal({ isOpen, onClose, onSuccess }: JoinOrgModalProps) {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<OrgCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form submission state
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-fetch profile name for pre-filling
  useEffect(() => {
    if (!isOpen) return;

    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.full_name) {
            setFullName(profile.full_name);
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    loadUserProfile();
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setChecking(false);
      setCheckResult(null);
      setErrorMessage('');
      setStudentId('');
      setSubmitting(false);
      setIsSuccess(false);
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Vui lòng nhập mã tham gia hoặc mã đơn vị.');
      return;
    }

    setChecking(true);
    setErrorMessage('');
    setCheckResult(null);

    try {
      const res = await fetch(`/api/join/org/${cleanCode}`);
      const data: OrgCheckResult = await res.json();

      if (!res.ok || !data.valid) {
        setErrorMessage(data.error || 'Mã tham gia không tồn tại hoặc đã hết hiệu lực.');
      } else {
        setCheckResult(data);
      }
    } catch {
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkResult?.valid || !code.trim()) return;

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const cleanCode = code.trim().toUpperCase();
      const res = await fetch(`/api/join/org/${cleanCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          studentId: studentId.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Gửi yêu cầu tham gia thất bại.');
        return;
      }

      setIsSuccess(true);
      setSuccessMsg(
        data.message ||
          `Yêu cầu tham gia đã được gửi thành công đến ${checkResult.organization?.name}.`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setErrorMessage('Lỗi hệ thống khi gửi yêu cầu tham gia.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 text-slate-900 dark:text-neutral-100 overflow-hidden relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60 shrink-0">
            <KeyRound className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
              Tham gia tổ chức
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Nhập mã mời hoặc mã đơn vị thay vì chờ thư mời qua email
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="mt-4">
          {isSuccess ? (
            /* Success State */
            <div className="space-y-4 py-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  Gửi yêu cầu gia nhập thành công!
                </h4>
                <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                  {successMsg}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-left text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tổ chức:</span>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">
                    {checkResult?.organization?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã tham gia:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {code.trim().toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.refresh();
                  }}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          ) : (
            /* Input / Verification Form */
            <form onSubmit={checkResult ? handleSubmit : handleCheckCode} className="space-y-4">
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Code Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Mã tham gia / Mã đơn vị
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      if (checkResult) setCheckResult(null);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="VD: FPT-POLY, NX-K24-HN..."
                    disabled={checking || submitting}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all uppercase"
                    autoFocus
                  />
                  {!checkResult && (
                    <button
                      type="button"
                      onClick={() => handleCheckCode()}
                      disabled={checking || !code.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {checking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Kiểm tra</span>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                  Mã do giảng viên, trưởng bộ phận hoặc quản trị viên tổ chức cung cấp.
                </p>
              </div>

              {/* Step 2: Org Info & Identity Confirmation (Visible after valid check) */}
              {checkResult && checkResult.organization && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800 animate-in fade-in duration-150">
                  {/* Org Banner Card */}
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                          {checkResult.organization.name}
                        </div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                          {checkResult.joinCode?.title || 'Đơn vị thành viên'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono uppercase">
                        {checkResult.organization.code || 'ORG'}
                      </span>
                    </div>
                  </div>

                  {/* Profile inputs */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                      Họ và tên hiển thị trong tổ chức *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                      Mã số sinh viên / Mã nhân viên (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="VD: PH12345 / NV-098"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang gửi yêu cầu...</span>
                        </>
                      ) : (
                        <>
                          <span>Xác nhận tham gia tổ chức</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinOrgModal;