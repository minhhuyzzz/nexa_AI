'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  KeyRound,
  Mail,
  Copy,
  Link as LinkIcon,
  Send,
  Loader2,
  Check,
  AlertCircle,
  UserPlus,
  ChevronDown,
  RotateCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { OrgClassItem } from './types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  classes?: OrgClassItem[];
  remainingSeats?: number;
  maxSeats?: number;
  isOwner?: boolean;
  onSuccess?: () => void;
  onOpenBulkImport?: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  isOwner = false,
  onSuccess,
}: InviteMemberModalProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'email'>('code');
  const [joinCode, setJoinCode] = useState<string>('');
  const [activeCodeId, setActiveCodeId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Email invite state
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'MEMBER' | 'ASSESSOR' | 'ORG_ADMIN'>('MEMBER');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validate email on blur (chỉ kiểm tra khi rời khỏi trường nhập, không kiểm tra liên tục khi đang gõ)
  const validateEmailOnBlur = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError('Vui lòng nhập địa chỉ email người nhận (ví dụ: giangvien@truong.edu.vn).');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setFieldError('Email chưa đúng định dạng. Vui lòng kiểm tra lại cấu trúc dạng ten@donvi.edu.vn.');
      return false;
    }
    setFieldError(null);
    return true;
  };

  // Tính thời gian còn hiệu lực theo thời gian thực
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining('Hiệu lực 8 giờ');
      return;
    }

    const calculateRemaining = () => {
      const diffMs = new Date(expiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeRemaining('Mã đã hết hạn (hãy bấm làm mới)');
        return;
      }
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours > 0) {
        setTimeRemaining(`Còn ${hours} giờ ${minutes} phút`);
      } else {
        setTimeRemaining(`Còn ${minutes} phút`);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Tạo mã mới có hiệu lực 8 giờ
  const generateNew8HourCode = useCallback(async (oldCodeId?: string | null) => {
    if (!organizationId) return;
    try {
      // Nếu có mã cũ, thu hồi để tránh trùng lặp
      if (oldCodeId) {
        fetch(`/api/organizations/${organizationId}/join-codes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codeId: oldCodeId }),
        }).catch(() => {});
      }

      const createRes = await fetch(`/api/organizations/${organizationId}/join-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours: 8, maxUses: 1000, title: 'Mã tham gia 8 giờ' }),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        if (createData.joinCode?.code) {
          setJoinCode(createData.joinCode.code);
          setActiveCodeId(createData.joinCode.id || null);
          setExpiresAt(createData.joinCode.expires_at || null);
          return;
        }
      }
    } catch (err) {
      console.error('Error generating 8h join code:', err);
    }
  }, [organizationId]);

  // Lấy mã hiện hành hoặc tạo mới nếu chưa có hoặc đã hết hạn
  const fetchOrGenerateCode = useCallback(async () => {
    if (!organizationId) return;
    setLoadingCode(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/join-codes`);
      if (res.ok) {
        const data = await res.json();
        const codes = data.codes || [];
        const now = Date.now();

        // Tìm mã còn hiệu lực
        const active = codes.find((c: any) => {
          if (c.is_revoked || (c.status && c.status !== 'ACTIVE')) return false;
          if (!c.expires_at) return false;
          return new Date(c.expires_at).getTime() > now;
        });

        if (active?.code) {
          setJoinCode(active.code);
          setActiveCodeId(active.id);
          setExpiresAt(active.expires_at);
          return;
        }

        // Nếu không có mã nào còn hạn, tạo mã 8 giờ mới
        await generateNew8HourCode();
        return;
      }

      // Fallback
      setJoinCode('JOIN-NEXA');
      setActiveCodeId(null);
      setExpiresAt(null);
    } catch {
      setJoinCode('JOIN-NEXA');
      setActiveCodeId(null);
      setExpiresAt(null);
    } finally {
      setLoadingCode(false);
    }
  }, [organizationId, generateNew8HourCode]);

  // Bấm nút xoay tròn để làm mới mã tức thì
  const handleRefreshCode = async () => {
    if (loadingCode || isRotating) return;
    setIsRotating(true);
    setCopiedCode(false);
    setCopiedLink(false);
    try {
      await generateNew8HourCode(activeCodeId);
    } finally {
      setTimeout(() => setIsRotating(false), 500);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrGenerateCode();
      setErrorMsg(null);
      setSuccessMsg(null);
      setEmail('');
      setSelectedRole('MEMBER');
      setCopiedCode(false);
      setCopiedLink(false);
    }
  }, [isOpen, fetchOrGenerateCode]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const directLink = `${origin}/join/org/${joinCode || '...'}`;

  const handleCopyCode = async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    if (!directLink) return;
    try {
      await navigator.clipboard.writeText(directLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmailOnBlur() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          email: email.trim().toLowerCase(),
          orgRole: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Không thể tạo lời mời');
      }

      setSuccessMsg(`Đã gửi thư mời thành công đến ${email.trim()}`);
      setEmail('');
      setFieldError(null);
      onSuccess?.();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi lời mời');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none"
          aria-label="Đóng hộp thoại"
        >
          <X className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6 pr-10">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
              Mời thành viên
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {organizationName}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="p-1 rounded-xl bg-slate-100/90 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex gap-1 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none ${
              activeTab === 'code'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Mã mời &amp; Liên kết</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none ${
              activeTab === 'email'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Mời qua Email</span>
          </button>
        </div>

        {/* TAB 1: MÃ MỜI & LIÊN KẾT TRỰC TIẾP (Hoà với nền trắng, không khung viền) */}
        {activeTab === 'code' && (
          <div className="space-y-4 pt-1">
            {/* Mục 1: Mã mời tham gia tổ chức */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <span>Mã mời tham gia tổ chức</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 text-[10px] font-semibold">
                    <Clock className="w-3 h-3" />
                    Tự đổi sau 8h
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                  {timeRemaining}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-11 min-h-[44px] px-3.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-700/80 flex items-center text-sm font-bold font-mono text-blue-600 dark:text-blue-400 tracking-wider">
                  {loadingCode ? (
                    <span className="text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 text-xs font-normal">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo mã...
                    </span>
                  ) : (
                    joinCode
                  )}
                </div>

                {/* Nút xoay tròn cập nhật mã mới */}
                <button
                  type="button"
                  onClick={handleRefreshCode}
                  disabled={loadingCode || isRotating}
                  title="Tạo mã mới ngay (mã cũ sẽ hết hiệu lực)"
                  aria-label="Cập nhật mã mới"
                  className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none"
                >
                  <RotateCw
                    className={`w-4 h-4 ${
                      isRotating || loadingCode ? 'animate-spin text-blue-600 dark:text-blue-400' : ''
                    }`}
                  />
                </button>

                {/* Nút sao chép mã */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  disabled={loadingCode || !joinCode}
                  className="h-11 min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mục 2: Liên kết trực tiếp (Hoà với nền trắng, không viền gạch ngang) */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Liên kết tham gia trực tiếp</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Thành viên mở liên kết là xác nhận vào thẳng tổ chức, không cần nhập mã.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                disabled={loadingCode || !joinCode}
                className="h-11 min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã chép liên kết</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Chép liên kết</span>
                  </>
                )}
              </button>
            </div>

            {/* Mục 3: Ghi chú bảo mật (Hoà vào nền trắng, không khung viền) */}
            <div className="pt-2 flex items-start gap-2 text-xs text-slate-500 dark:text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Bảo mật tổ chức:</span> Thành viên tham gia qua mã mời hoặc liên kết sẽ tự động nhận vai trò <strong className="text-neutral-800 dark:text-neutral-200">Thành viên</strong> (chỉ học tập và làm bài thi).
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MỜI QUA EMAIL */}
        {activeTab === 'email' && (
          <form onSubmit={handleSendEmailInvite} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email input (1 Cột, Label trên, On blur validation, Hướng dẫn lỗi chi tiết) */}
            <div className="space-y-1.5">
              <label htmlFor="invite-email" className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Địa chỉ email người được mời <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onBlur={validateEmailOnBlur}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                aria-invalid={!!fieldError}
                aria-describedby={fieldError ? 'invite-email-error' : undefined}
                placeholder="dongnghiep@donvi.edu.vn"
                className={`w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 transition-colors focus-visible:outline-none motion-reduce:transition-none ${
                  fieldError
                    ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 bg-red-50/10'
                    : 'border border-slate-200 dark:border-zinc-700/80 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent'
                }`}
              />
              {fieldError && (
                <p id="invite-email-error" className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldError}</span>
                </p>
              )}
            </div>

            {/* Role dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="invite-role" className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Vai trò trong tổ chức
              </label>
              <div className="relative">
                <select
                  id="invite-role"
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as 'MEMBER' | 'ASSESSOR' | 'ORG_ADMIN')
                  }
                  className="w-full h-11 min-h-[44px] px-3.5 pr-9 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none appearance-none cursor-pointer motion-reduce:transition-none"
                >
                  <option value="MEMBER">Thành viên</option>
                  <option value="ASSESSOR">Khảo thí viên</option>
                  {isOwner && <option value="ORG_ADMIN">Quản trị viên</option>}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className={`w-full h-11 min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none ${
                  isSubmitting || !email.trim()
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 cursor-not-allowed border border-slate-200 dark:border-zinc-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi thư mời...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Gửi thư mời qua email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
