'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  KeyRound,
  Link as LinkIcon,
  Mail,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Send,
  Building2,
} from 'lucide-react';

interface OrgInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: {
    id: string;
    name: string;
    code?: string;
    slug?: string;
  };
  userRole?: string;
}

export function OrgInviteModal({
  isOpen,
  onClose,
  organization,
  userRole,
}: OrgInviteModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'email'>('quick');

  // Copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Email form state
  const [email, setEmail] = useState('');
  const [orgRole, setOrgRole] = useState<'MEMBER' | 'ORG_ADMIN'>('MEMBER');
  const [sending, setSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const inviteCode = organization.code || organization.slug || '';
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const inviteLink = `${origin}/join/org/${inviteCode}`;

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setEmailSuccess('');
      setEmailError('');
      setSending(false);
      setCopiedCode(false);
      setCopiedLink(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setSending(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          email: cleanEmail,
          orgRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailError(data.error || 'Gửi lời mời thất bại. Vui lòng thử lại.');
      } else {
        setEmailSuccess(`Đã gửi lời mời thành công đến ${cleanEmail}! Lời mời có hiệu lực trong 7 ngày.`);
        setEmail('');
      }
    } catch {
      setEmailError('Lỗi kết nối máy chủ khi gửi lời mời.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 text-slate-900 dark:text-neutral-100 overflow-hidden relative">
        {/* Close button */}
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
            <UserPlus className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 truncate">
              Mời thành viên
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
              {organization.name}
            </p>
          </div>
        </div>

        {/* Tabs: Mã & Link / Gửi qua Email */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Mã mời & Liên kết</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Mời qua Email</span>
          </button>
        </div>

        {/* Tab 1: Mã mời & Liên kết trực tiếp */}
        {activeTab === 'quick' && (
          <div className="mt-4 space-y-4">
            {/* Box 1: Mã mời */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                  Mã mời tham gia tổ chức
                </span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                  Nhập tại cổng tham gia
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono font-bold text-sm text-blue-600 dark:text-blue-400 tracking-wider">
                  {inviteCode || 'CHƯA_CÓ_MÃ'}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  disabled={!inviteCode}
                  className="py-2 px-3 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-750 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Box 2: Link tham gia */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                  Liên kết tham gia trực tiếp
                </span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                  Mở là vào thẳng
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-[11px] text-slate-600 dark:text-neutral-300 truncate">
                  {inviteLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!inviteCode}
                  className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép link</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Chép link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Thành viên mới chỉ cần nhận mã hoặc bấm vào liên kết trên để xác nhận tham gia tổ chức mà không cần thao tác phức tạp.
            </p>
          </div>
        )}

        {/* Tab 2: Mời qua Email */}
        {activeTab === 'email' && (
          <form onSubmit={handleSendEmailInvite} className="mt-4 space-y-4">
            {emailSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{emailSuccess}</span>
              </div>
            )}

            {emailError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{emailError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Địa chỉ email người được mời *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder="dongnghiep@donvi.edu.vn"
                required
                disabled={sending}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Vai trò trong tổ chức
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrgRole('MEMBER')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    orgRole === 'MEMBER'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="font-semibold text-xs">Thành viên</div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Học tập & làm bài thi
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrgRole('ORG_ADMIN')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    orgRole === 'ORG_ADMIN'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="font-semibold text-xs">Quản trị viên</div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Quản lý lớp & thành viên
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi thư mời...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi thư mời qua email</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default OrgInviteModal;