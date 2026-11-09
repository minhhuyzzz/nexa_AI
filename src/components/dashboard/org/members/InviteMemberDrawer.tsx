'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  User,
  Users,
  FileSpreadsheet,
  Link as LinkIcon,
  Check,
  Info,
  Send,
  Loader2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import type { OrgClassItem } from './types';

interface InviteMemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  classes: OrgClassItem[];
  remainingSeats: number;
  maxSeats: number;
  onSuccess: () => void;
  onOpenBulkImport: () => void;
  onSelectJoinCodesTab: () => void;
}

const ROLE_PERMISSIONS: Record<
  string,
  { label: string; allowed: string[]; denied: string[] }
> = {
  MEMBER: {
    label: 'Thành viên',
    allowed: ['Tham gia lớp, học tập và làm bài đánh giá', 'Xem kết quả và phản hồi cá nhân'],
    denied: ['Quản lý người dùng, phân quyền', 'Cấu hình hệ thống và tổ chức'],
  },
  ASSESSOR: {
    label: 'Khảo thí viên',
    allowed: [
      'Quản lý lớp học được phân công',
      'Giao đề khảo thí và mở phòng thi trực tiếp',
      'Chấm bài tự luận và đánh giá bằng chứng',
      'Xem báo cáo lớp phụ trách',
    ],
    denied: ['Quản lý thành viên toàn tổ chức', 'Cài đặt tổ chức và gói dịch vụ'],
  },
  ORG_ADMIN: {
    label: 'Quản trị viên',
    allowed: ['Quản lý thành viên và duyệt yêu cầu', 'Tạo và điều hành đợt đánh giá', 'Quản lý lớp học và bàn chấm bài', 'Xem toàn bộ báo cáo và hạn ngạch'],
    denied: ['Thay đổi quyền của Platform Admin'],
  },
};

export function InviteMemberDrawer({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  classes,
  remainingSeats,
  maxSeats,
  onSuccess,
  onOpenBulkImport,
  onSelectJoinCodesTab,
}: InviteMemberDrawerProps) {
  const [method, setMethod] = useState<'email' | 'bulk' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [welcomeNote, setWelcomeNote] = useState(
    `Chào mừng bạn đến với không gian học tập của ${organizationName}! Vui lòng truy cập liên kết để hoàn tất tham gia.`
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentRoleInfo = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.MEMBER;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (remainingSeats <= 0) {
      setError('Tổ chức đã sử dụng hết số ghế khả dụng');
      return;
    }

    setLoading(true);
    setError(null);

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
        throw new Error(data.error || 'Không thể tạo lời mời');
      }

      setInviteResult({ inviteUrl: data.invitation?.inviteUrl || '' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi lời mời');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteResult?.inviteUrl) return;
    navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('MEMBER');
    setSelectedClassId('');
    setError(null);
    setInviteResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white dark:bg-[#111114] shadow-2xl border-l border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Mời thành viên mới
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Gửi lời mời để thêm thành viên vào không gian tổ chức.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Quota Banner */}
            <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-600 dark:text-neutral-300">
                  Hạn mức tổ chức:{' '}
                  <strong className="font-mono text-neutral-900 dark:text-neutral-100">{maxSeats} ghế</strong> &bull;{' '}
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    còn {remainingSeats} ghế trống
                  </span>
                </span>
              </div>
              {remainingSeats <= 0 && (
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Đã hết ghế
                </span>
              )}
            </div>

            {/* Step 1: Phương thức mời */}
            <div>
              <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono mb-2.5">
                1. Phương thức mời
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`p-3 rounded-md border text-left transition-all ${
                    method === 'email'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-zinc-300 hover:border-slate-300'
                  }`}
                >
                  <Mail className="w-4 h-4 mb-1.5 text-blue-600" />
                  <div className="text-xs font-bold">Email</div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Mời từng người qua email
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBulkImport();
                  }}
                  className="p-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left hover:border-slate-300 text-neutral-700 dark:text-zinc-300 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 mb-1.5 text-emerald-600" />
                  <div className="text-xs font-bold">Hàng loạt (CSV)</div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Tải tệp danh sách nhiều người
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectJoinCodesTab();
                  }}
                  className="p-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left hover:border-slate-300 text-neutral-700 dark:text-zinc-300 transition-all"
                >
                  <LinkIcon className="w-4 h-4 mb-1.5 text-indigo-600" />
                  <div className="text-xs font-bold">Mã gia nhập</div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Tạo link/QR tự tham gia
                  </div>
                </button>
              </div>
            </div>

            {inviteResult ? (
              /* Success Result Card */
              <div className="p-4 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                  <Check className="w-4 h-4" />
                  <span>Đã tạo lời mời thành công!</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  Lời mời đã được ghi nhận. Bạn có thể sao chép liên kết bên dưới để gửi trực tiếp cho thành viên:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.inviteUrl}
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded text-neutral-800 dark:text-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    &larr; Mời thêm thành viên khác
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSendInvite} className="space-y-6">
                {/* Step 2: Thông tin thành viên */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                    2. Thông tin thành viên
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-neutral-400 mb-1">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="minhnguyen@fpt.edu.vn"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 dark:text-neutral-400 mb-1">
                        Họ tên (tùy chọn)
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nguyễn Minh Nguyên"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="sendEmailNow"
                      checked={sendEmailNow}
                      onChange={(e) => setSendEmailNow(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="sendEmailNow" className="text-xs text-slate-600 dark:text-neutral-400">
                      Gửi email thông báo ngay kèm hướng dẫn kích hoạt tài khoản
                    </label>
                  </div>
                </div>

                {/* Step 3: Phân quyền & gán lớp */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                    3. Phân quyền &amp; gán lớp
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-neutral-400 mb-1">
                        Vai trò <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      >
                        <option value="MEMBER">Thành viên</option>
                        <option value="ASSESSOR">Khảo thí viên</option>
                        <option value="ORG_ADMIN">Quản trị viên</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 dark:text-neutral-400 mb-1">
                        Gán vào lớp / nhóm
                      </label>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      >
                        <option value="">Không gán lớp ban đầu</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.code ? `(${c.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Permission Preview */}
                  <div className="p-3.5 rounded-md bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs space-y-2">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <span>Quyền của vai trò:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">
                        {currentRoleInfo.label}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {currentRoleInfo.allowed.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                          <span>{item}</span>
                        </div>
                      ))}
                      {currentRoleInfo.denied.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-slate-400 dark:text-neutral-500">
                          <X className="w-3.5 h-3.5 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 4: Ghi chú chào mừng */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                      4. Ghi chú chào mừng
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {welcomeNote.length} / 500
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={welcomeNote}
                    onChange={(e) => setWelcomeNote(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || remainingSeats <= 0}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Gửi lời mời</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
