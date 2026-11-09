'use client';

import { useState } from 'react';
import { X, Sparkles, Check, Copy, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { CelebrationCanvas } from '@/components/ui/CelebrationCanvas';

export interface BusinessInquiryTarget {
  id: string;
  org_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  expected_learners?: number;
  notes?: string | null;
}

interface ActivateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: BusinessInquiryTarget | null;
  onSuccess: () => void;
}

export function ActivateBusinessModal({
  isOpen,
  onClose,
  inquiry,
  onSuccess,
}: ActivateBusinessModalProps) {
  const [orgName, setOrgName] = useState(inquiry?.org_name || '');
  const [orgCode, setOrgCode] = useState(
    (inquiry?.org_name || '').slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ORG'
  );
  const [planName, setPlanName] = useState('Business');
  const [cycleMonths, setCycleMonths] = useState<number>(12);
  const [maxSeats, setMaxSeats] = useState<number>(inquiry?.expected_learners || 250);
  const [aiCredits, setAiCredits] = useState<number>(5000);
  const [adminEmail, setAdminEmail] = useState(inquiry?.contact_email || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !inquiry) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const cleanCode = orgCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (cleanCode.length < 2) {
        throw new Error('Mã tổ chức tối thiểu 2 ký tự');
      }

      const res = await fetch('/api/admin/organizations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          planName,
          orgCode: cleanCode,
          cycleMonths,
          maxSeats: Number(maxSeats) || 250,
          maxAssessments: 100,
          aiCredits: Number(aiCredits) || 5000,
          adminEmail: adminEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể kích hoạt Business');
      }

      setInviteUrl(data.inviteUrl);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activate-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5">
          <div>
            <h2 id="activate-modal-title" className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Kích hoạt Business
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Thiết lập gói và tạo lời mời đến người quản trị tổ chức.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-md text-slate-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {inviteUrl ? (
          <div className="p-6 space-y-4">
            <CelebrationCanvas />
            <div className="p-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Đã kích hoạt tổ chức &ldquo;{orgName}&rdquo; thành công!
                </strong>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Gói {planName} ({cycleMonths} tháng), {maxSeats} ghế, {aiCredits} AI credits đã được cấp phát.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Liên kết kích hoạt &amp; nhận quyền quản trị (1 lần):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-mono text-neutral-800 dark:text-neutral-200"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Gửi liên kết này cho <strong>{adminEmail}</strong> để bàn giao quyền ORG_OWNER.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-8.5 px-4 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            {error && (
              <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Tên & Mã tổ chức */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Tên tổ chức <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full h-8.5 px-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Mã tổ chức (Slug) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  className="w-full h-8.5 px-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono uppercase text-neutral-900 dark:text-neutral-100"
                  placeholder="HOASEN"
                />
              </div>
            </div>

            {/* Gói & Chu kỳ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Gói dịch vụ
                </label>
                <select
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full h-8.5 px-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value="Business">Gói Business (Tổ chức / B2B)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Chu kỳ
                </label>
                <select
                  value={cycleMonths}
                  onChange={(e) => setCycleMonths(Number(e.target.value))}
                  className="w-full h-8.5 px-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value={12}>12 tháng</option>
                  <option value={6}>6 tháng</option>
                  <option value={3}>3 tháng</option>
                  <option value={1}>1 tháng</option>
                </select>
              </div>
            </div>

            {/* Số ghế & AI credits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Số ghế thành viên
                </label>
                <input
                  type="number"
                  min={5}
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(Number(e.target.value))}
                  className="w-full h-8.5 px-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono tabular-nums text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  AI credits
                </label>
                <input
                  type="number"
                  min={0}
                  value={aiCredits}
                  onChange={(e) => setAiCredits(Number(e.target.value))}
                  className="w-full h-8.5 px-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono tabular-nums text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            {/* Email quản trị viên */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                Email quản trị viên chính <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full h-8.5 px-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100"
                placeholder="ngocanh@hoasen.edu.vn"
              />
            </div>

            {/* Callout */}
            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-neutral-400">
              Sau khi kích hoạt, NEXA sinh một liên kết nhận quyền duy nhất. Người đại diện dùng tài khoản cá nhân hiện có hoặc tạo tài khoản miễn phí để nhận quyền quản trị.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-8.5 px-3.5 rounded-md border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-8.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Đang kích hoạt...' : 'Kích hoạt và tạo lời mời'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
