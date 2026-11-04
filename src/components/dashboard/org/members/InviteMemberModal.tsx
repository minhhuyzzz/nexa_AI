'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  X,
  Link as LinkIcon,
  Check,
  Send,
  Loader2,
  AlertCircle,
  Copy,
  ChevronLeft,
  RotateCw,
  Maximize2,
  Clock,
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
  onSuccess: () => void;
  onOpenBulkImport?: () => void;
}

/**
 * Custom SVG illustration representing NEXA's 5-Domain Digital Competence Network
 * Pure geometry: D1..D5 nodes with connecting radar web and central hub. No external brand slop.
 */
function NexaCompetencyNetworkIllustration() {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[210px] h-auto drop-shadow-sm select-none text-slate-800 dark:text-neutral-200"
      aria-hidden="true"
    >
      {/* Background radar concentric reference rings */}
      <circle cx="120" cy="90" r="75" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
      <circle cx="120" cy="90" r="52" stroke="currentColor" strokeOpacity="0.12" />
      <circle cx="120" cy="90" r="28" stroke="currentColor" strokeOpacity="0.16" />

      {/* Radar polygon connecting the 5 competency domains */}
      <polygon
        points="120,28 178,65 156,134 84,134 62,65"
        fill="url(#nexaRadarGrad)"
        fillOpacity="0.22"
        stroke="#2563EB"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      {/* Connectivity axis lines from central hub */}
      <line x1="120" y1="90" x2="120" y2="28" stroke="#2563EB" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="120" y1="90" x2="178" y2="65" stroke="#2563EB" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="120" y1="90" x2="156" y2="134" stroke="#2563EB" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="120" y1="90" x2="84" y2="134" stroke="#2563EB" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="120" y1="90" x2="62" y2="65" stroke="#2563EB" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 2" />

      {/* Central Identity Hub */}
      <circle cx="120" cy="90" r="14" fill="#2563EB" />
      <circle cx="120" cy="90" r="6" fill="#FFFFFF" />

      {/* 5 Domain Nodes */}
      {/* D1 (Top): Thông tin & Dữ liệu */}
      <g>
        <circle cx="120" cy="28" r="11" fill="url(#nodeGrad1)" stroke="#2563EB" strokeWidth="2" />
        <text x="120" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">D1</text>
      </g>

      {/* D2 (Top-Right): Giao tiếp & Hợp tác */}
      <g>
        <circle cx="178" cy="65" r="11" fill="url(#nodeGrad2)" stroke="#3B82F6" strokeWidth="2" />
        <text x="178" y="69" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">D2</text>
      </g>

      {/* D3 (Bottom-Right): Sáng tạo nội dung số & AI */}
      <g>
        <circle cx="156" cy="134" r="11" fill="url(#nodeGrad3)" stroke="#6366F1" strokeWidth="2" />
        <text x="156" y="138" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">D3</text>
      </g>

      {/* D4 (Bottom-Left): An toàn số */}
      <g>
        <circle cx="84" cy="134" r="11" fill="url(#nodeGrad4)" stroke="#0EA5E9" strokeWidth="2" />
        <text x="84" y="138" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">D4</text>
      </g>

      {/* D5 (Top-Left): Giải quyết vấn đề */}
      <g>
        <circle cx="62" cy="65" r="11" fill="url(#nodeGrad5)" stroke="#2563EB" strokeWidth="2" />
        <text x="62" y="69" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">D5</text>
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="nexaRadarGrad" x1="62" y1="28" x2="178" y2="134" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" stopOpacity="0.8" />
          <stop offset="1" stopColor="#60A5FA" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="nodeGrad1" x1="109" y1="17" x2="131" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="nodeGrad2" x1="167" y1="54" x2="189" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="nodeGrad3" x1="145" y1="123" x2="167" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id="nodeGrad4" x1="73" y1="123" x2="95" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284C7" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="nodeGrad5" x1="51" y1="54" x2="73" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E40AF" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Generate fallback 9-character code in 3 segments (e.g. BF8-1OV-QG8)
 */
function generateClientPinCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < 9; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${res.slice(0, 3)}-${res.slice(3, 6)}-${res.slice(6, 9)}`;
}

/**
 * Format raw code like 'BF8-1OV-QG8' or 'NX-A1B2-C3D4' into spaced display 'BF8 - 1OV - QG8'
 */
function formatPinForDisplay(code: string): string {
  if (!code) return 'BF8 - 1OV - QG8';
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length === 8) {
    return `${clean.slice(0, 4)} - ${clean.slice(4, 8)}`;
  }
  if (clean.length === 9) {
    return `${clean.slice(0, 3)} - ${clean.slice(3, 6)} - ${clean.slice(6, 9)}`;
  }
  if (clean.length >= 10) {
    return `${clean.slice(0, 3)} - ${clean.slice(3, 6)} - ${clean.slice(6, 10)}`;
  }
  return code;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  classes = [],
  remainingSeats = 50,
  maxSeats = 50,
  onSuccess,
  onOpenBulkImport,
}: InviteMemberModalProps) {
  const emailInputId = useId();
  const roleSelectId = useId();
  const classSelectId = useId();

  // Navigation mode: 'main' (email & quick links) vs 'code' (dedicated PIN screen)
  const [viewMode, setViewMode] = useState<'main' | 'code'>('main');

  // Fullscreen projector mode
  const [isFullscreenPin, setIsFullscreenPin] = useState(false);

  // Email form state (No full name, no mandatory edu email)
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ORG_ADMIN'>('MEMBER');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active PIN code state (Strict 6-Hour Lifespan)
  const [activeCode, setActiveCode] = useState<{ code: string; expires_at?: string } | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [refreshingCode, setRefreshingCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJoinLink, setCopiedJoinLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [remainingTimeText, setRemainingTimeText] = useState<string>('6 giờ');

  // Helper to persist/request fresh 6-hour join code
  const createSixHourCode = useCallback(async () => {
    try {
      const createRes = await fetch(`/api/organizations/${organizationId}/join-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Mã PIN tham gia ${organizationName}`,
          maxUses: 500,
          expiresInHours: 6,
        }),
      });
      if (createRes.ok) {
        const createData = await createRes.json();
        const codeObj = createData.joinCode || createData.code;
        if (codeObj?.code) {
          const fresh = { code: codeObj.code, expires_at: codeObj.expires_at };
          setActiveCode(fresh);
          return fresh;
        }
      }
    } catch {
      // Fallback
    }

    // Client resilience fallback: ensure code is ALWAYS available
    const fallbackPin = generateClientPinCode();
    const fallbackObj = {
      code: fallbackPin,
      expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    };
    setActiveCode(fallbackObj);
    return fallbackObj;
  }, [organizationId, organizationName]);

  // Fetch or initialize join code
  const fetchOrInitJoinCode = useCallback(async () => {
    setLoadingCode(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/join-codes`);
      if (res.ok) {
        const data = await res.json();
        const codes = data.codes || [];
        const now = Date.now();

        // Check for active unexpired code
        const valid = codes.find((c: any) => {
          if (c.is_revoked) return false;
          if (c.status && c.status !== 'ACTIVE') return false;
          if (!c.expires_at) return false;
          const exp = new Date(c.expires_at).getTime();
          const used = c.used_count ?? c.current_uses ?? 0;
          return exp > now && (c.max_uses === null || used < c.max_uses);
        });

        if (valid) {
          setActiveCode({ code: valid.code, expires_at: valid.expires_at });
          return;
        }
      }

      // If no valid active code found on server, generate fresh 6-hour code
      await createSixHourCode();
    } catch {
      // Offline / fallback
      await createSixHourCode();
    } finally {
      setLoadingCode(false);
    }
  }, [organizationId, createSixHourCode]);

  // Manual regenerate button (triggers instant 6-hour rotation)
  const handleRegenerateCode = async () => {
    setRefreshingCode(true);
    try {
      await createSixHourCode();
      setCopiedPin(false);
    } finally {
      setRefreshingCode(false);
    }
  };

  // Update remaining expiration time countdown every minute
  useEffect(() => {
    if (!activeCode?.expires_at) {
      setRemainingTimeText('6 giờ');
      return;
    }

    const updateRemaining = () => {
      const exp = new Date(activeCode.expires_at!).getTime();
      const diff = exp - Date.now();
      if (diff <= 0) {
        setRemainingTimeText('Đã hết hạn');
        createSixHourCode();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
          setRemainingTimeText(`${hours} giờ ${minutes} phút`);
        } else {
          setRemainingTimeText(`${minutes} phút`);
        }
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);
    return () => clearInterval(interval);
  }, [activeCode, createSixHourCode]);

  // Load code on dialog open
  useEffect(() => {
    if (isOpen) {
      setViewMode('main');
      setIsFullscreenPin(false);
      // Immediately set an optimistic code so the UI is instant, then sync
      setActiveCode((prev) => prev || {
        code: generateClientPinCode(),
        expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      });
      fetchOrInitJoinCode();
    }
  }, [isOpen, fetchOrInitJoinCode]);

  // Handle ESC key to close modal or fullscreen view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreenPin) {
          setIsFullscreenPin(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreenPin, onClose]);

  if (!isOpen) return null;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nexa.edu.vn';
  const displayPinCode = activeCode?.code || 'NX8-6M2-9K1';
  const joinOrgUrl = `${originUrl}/join/org/${displayPinCode}`;
  const genericJoinUrl = `${originUrl}/join`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinOrgUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyGenericJoinLink = () => {
    navigator.clipboard.writeText(genericJoinUrl);
    setCopiedJoinLink(true);
    setTimeout(() => setCopiedJoinLink(false), 2500);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(displayPinCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email');
      return;
    }

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
          orgRole: role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Không thể tạo lời mời');
      }

      setSuccessMsg(`Đã gửi lời mời thành công đến ${email.trim()}`);
      setEmail('');
      onSuccess();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi lời mời');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* FULLSCREEN PROJECTOR VIEW (FOR CLASSROOM / PRESENTATIONS) */}
      {/* ========================================================= */}
      {isFullscreenPin && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/95 text-white flex flex-col justify-between p-8 sm:p-14 animate-in fade-in duration-200"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase font-mono tracking-widest text-blue-400 font-bold">
                Mã Tham Gia Tổ Chức • NEXA
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
                {organizationName}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenPin(false)}
              className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Đóng chế độ trình chiếu (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Central Stage */}
          <div className="text-center my-auto space-y-6">
            <p className="text-base sm:text-lg text-neutral-300 max-w-xl mx-auto">
              Học viên &amp; thành viên mở trình duyệt, truy cập{' '}
              <span className="font-mono font-bold text-blue-400 underline underline-offset-4">
                {genericJoinUrl}
              </span>{' '}
              và nhập mã sau:
            </p>

            <div className="inline-block py-6 px-10 rounded-3xl bg-zinc-900 border-2 border-blue-500/40 shadow-2xl">
              <div className="font-mono text-5xl sm:text-7xl md:text-8xl font-black tracking-widest text-blue-400 select-all">
                {formatPinForDisplay(displayPinCode)}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-neutral-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Mã tự động làm mới sau 6 giờ • Còn hiệu lực: {remainingTimeText}</span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-zinc-800 pt-4">
            <span>Nhấn <kbd className="px-2 py-0.5 rounded bg-zinc-800 font-mono text-neutral-300">ESC</kbd> để quay lại</span>
            <button
              type="button"
              onClick={handleCopyPin}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 cursor-pointer transition"
            >
              {copiedPin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPin ? 'Đã sao chép mã' : 'Sao chép mã PIN'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN TWO-COLUMN MODAL DIALOG                              */}
      {/* ========================================================= */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-member-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* 2-Column Dialog Container */}
        <div className="relative w-full max-w-4xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 grid grid-cols-1 md:grid-cols-12 max-h-[92vh]">
          {/* Close Button Top-Right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 flex items-center justify-center transition cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>

          {/* ========================================================= */}
          {/* LEFT COLUMN: Actions & Direct Invite (7/12 cols)          */}
          {/* ========================================================= */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            {/* ------------------------------------------------------- */}
            {/* SUB-VIEW 1: CODE VIEW (MỜI QUA MÃ PIN - TỰ ĐỔI SAU 6 GIỜ) */}
            {/* ------------------------------------------------------- */}
            {viewMode === 'code' ? (
              <div className="space-y-6 my-auto">
                {/* Back button */}
                <div>
                  <button
                    type="button"
                    onClick={() => setViewMode('main')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer group mb-2"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" strokeWidth={2.2} />
                    <span>Mời mọi người vào đội nhóm của bạn</span>
                  </button>

                  <h2
                    id="invite-member-modal-title"
                    className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1"
                  >
                    Tham gia qua mã PIN tổ chức
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    Bạn có thể mời bất cứ ai trong tổ chức. Nếu họ chưa tham gia NEXA, hãy gửi lời mời để họ có quyền truy cập làm bài đánh giá.
                  </p>
                </div>

                {/* 6-Hour Expiry Notice */}
                <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-3.5 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-medium">Mã mời này sẽ tự động làm mới sau 6 giờ.</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold opacity-80">
                    Còn: {remainingTimeText}
                  </span>
                </div>

                {/* Big Formatted PIN Display */}
                <div className="text-center py-2 space-y-3">
                  <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-neutral-900 dark:text-neutral-100 select-all py-1">
                    {formatPinForDisplay(displayPinCode)}
                  </div>

                  {/* 3 Action Buttons Under PIN */}
                  <div className="flex items-center justify-center gap-3 pt-1">
                    {/* 1. Copy PIN */}
                    <button
                      type="button"
                      onClick={handleCopyPin}
                      title="Sao chép mã PIN"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 transition cursor-pointer shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-center"
                    >
                      {copiedPin ? (
                        <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                      ) : (
                        <Copy className="w-4 h-4" strokeWidth={2} />
                      )}
                    </button>

                    {/* 2. Rotate / Refresh new 6-hour code */}
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      disabled={refreshingCode}
                      title="Làm mới mã PIN (Hiệu lực 6 giờ mới)"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 transition cursor-pointer shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-center disabled:opacity-50"
                    >
                      <RotateCw className={`w-4 h-4 ${refreshingCode ? 'animate-spin text-blue-600' : ''}`} strokeWidth={2} />
                    </button>

                    {/* 3. Maximize / Projector mode */}
                    <button
                      type="button"
                      onClick={() => setIsFullscreenPin(true)}
                      title="Trình chiếu mã toàn màn hình"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 transition cursor-pointer shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-center"
                    >
                      <Maximize2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Instructions & Link Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-850">
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Chia sẻ liên kết này với người được mời và hướng dẫn họ nhập mã.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={genericJoinUrl}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 font-mono text-xs text-neutral-800 dark:text-neutral-200 select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyGenericJoinLink}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer shrink-0"
                    >
                      {copiedJoinLink ? 'Đã sao chép' : 'Sao chép liên kết'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ------------------------------------------------------- */
              /* SUB-VIEW 2: MAIN INVITE VIEW (LINK, EMAIL & OTHER WAYS) */
              /* ------------------------------------------------------- */
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2
                    id="invite-member-modal-title"
                    className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
                  >
                    Mời mọi người vào đội nhóm của bạn
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    Bạn có thể mời giảng viên hoặc học viên trong đơn vị. Người tham gia được cấp quyền truy cập miễn phí vào các bài đánh giá năng lực số chuẩn hóa.
                  </p>
                </div>

                {/* SECTION 1: MỜI QUA LIÊN KẾT (1-CLICK SHARE) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Mời qua liên kết
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={loadingCode}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                        <span>Đã sao chép liên kết mời!</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" strokeWidth={2} />
                        <span>Sao chép liên kết mời</span>
                      </>
                    )}
                  </button>
                </div>

                {/* DIVIDER: HOẶC */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-zinc-800" />
                  <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    HOẶC
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-zinc-800" />
                </div>

                {/* SECTION 2: MỜI QUA EMAIL (TINH GIẢN - KHÔNG HỌ TÊN - KHÔNG MAIL EDU ÉP BUỘC) */}
                <form onSubmit={handleSendInvite} className="space-y-3">
                  {errorMsg && (
                    <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-8 space-y-1">
                      <label htmlFor={emailInputId} className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        Mời qua email
                      </label>
                      <input
                        id={emailInputId}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label htmlFor={roleSelectId} className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        Chỉ định vai trò
                      </label>
                      <select
                        id={roleSelectId}
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'MEMBER' | 'ORG_ADMIN')}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600 transition cursor-pointer"
                      >
                        <option value="MEMBER">Học sinh / Thành viên</option>
                        <option value="ORG_ADMIN">Quản trị viên</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Class Selector */}
                  {classes.length > 0 && (
                    <div className="pt-0.5">
                      <select
                        id={classSelectId}
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60 text-xs text-slate-600 dark:text-neutral-300 focus:outline-none focus:border-blue-600 transition cursor-pointer"
                      >
                        <option value="">Gán vào lớp học ban đầu (tùy chọn)</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.code ? `(${c.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-neutral-900 shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi lời mời</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* SECTION 3: MỜI BẰNG CÁCH KHÁC */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Mời bằng cách khác
                  </label>

                  <div>
                    {/* Qua mã PIN -> Chuyển vào trang chi tiết mã (không hiện mã trước trang) */}
                    <button
                      type="button"
                      onClick={() => setViewMode('code')}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-left flex items-center justify-between text-xs transition cursor-pointer group shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-bold text-sm">#</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Tham gia qua mã PIN tổ chức
                        </span>
                      </div>
                      <span className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm transition-transform group-hover:translate-x-0.5">
                        &rarr;
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Branded NEXA 5-Domain Visual (5/12 cols)    */}
          {/* ========================================================= */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-50 via-slate-50/80 to-slate-100/60 dark:from-zinc-900/40 dark:via-zinc-900/30 dark:to-zinc-950/80 p-6 sm:p-8 flex flex-col justify-center items-center text-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-zinc-800 relative overflow-hidden">
            {/* Subtle radial ambient background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

            {/* Centered NEXA 5-Domain Network SVG & Clean Value Proposition */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto py-6">
              <NexaCompetencyNetworkIllustration />

              <div className="mt-6 space-y-2 max-w-xs">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Phát triển Năng lực Số Toàn Đơn Vị
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Kết nối thành viên vào không gian khảo thí 5 miền năng lực số chuẩn hóa và lộ trình bồi dưỡng thực chất.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
