'use client';

import { useState } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface BusinessRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  planName?: string;
  currentExpiresAt?: string;
  currentSeats?: number;
  onSuccess?: () => void;
}

export function BusinessRenewalModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  planName = 'Gói Business',
  currentExpiresAt,
  currentSeats = 250,
  onSuccess,
}: BusinessRenewalModalProps) {
  const [periodMonths, setPeriodMonths] = useState<number>(12);
  const [requestedSeats, setRequestedSeats] = useState<number>(currentSeats);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const formattedExpiry = currentExpiresAt
    ? new Date(currentExpiresAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Chưa xác định';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/renewal-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodMonths,
          requestedSeats: requestedSeats > 0 ? requestedSeats : currentSeats,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi yêu cầu gia hạn lúc này.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="renewal-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5">
          <div>
            <h2 id="renewal-modal-title" className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Gia hạn gói Business
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Giữ nguyên tổ chức, dữ liệu và quyền lợi. NEXA sẽ xác nhận yêu cầu gia hạn.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-md text-slate-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Đã gửi yêu cầu gia hạn thành công!
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs mx-auto">
              NEXA đã tiếp nhận yêu cầu cho <strong>{organizationName}</strong>. Thời hạn mới sẽ được cập nhật ngay sau khi xác nhận.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Callout thông tin gói */}
            <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs text-neutral-800 dark:text-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 dark:text-neutral-400">Gói đang sử dụng: </span>
                <strong className="text-blue-600 dark:text-blue-400">{planName}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-neutral-400">Hiệu lực đến: </span>
                <strong className="font-mono tabular-nums">{formattedExpiry}</strong>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Thời hạn muốn gia hạn */}
            <div>
              <label htmlFor="periodSelect" className="block text-xs font-semibold text-neutral-900 dark:text-neutral-200 mb-1.5">
                Thời hạn muốn gia hạn <span className="text-rose-500">*</span>
              </label>
              <select
                id="periodSelect"
                value={periodMonths}
                onChange={(e) => setPeriodMonths(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              >
                <option value={12}>12 tháng (Khuyên dùng — Ưu tiên hỗ trợ)</option>
                <option value={6}>6 tháng (Bán niên)</option>
                <option value={3}>3 tháng (Quý)</option>
                <option value={1}>1 tháng (Tháng)</option>
              </select>
            </div>

            {/* Số ghế dự kiến */}
            <div>
              <label htmlFor="seatsInput" className="block text-xs font-semibold text-neutral-900 dark:text-neutral-200 mb-1.5">
                Số ghế thành viên dự kiến
              </label>
              <input
                id="seatsInput"
                type="number"
                min={5}
                max={5000}
                value={requestedSeats}
                onChange={(e) => setRequestedSeats(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                placeholder="250"
              />
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Giữ nguyên hoặc tăng thêm số lượng người học/thành viên trong tổ chức.
              </p>
            </div>

            {/* Ghi chú */}
            <div>
              <label htmlFor="notesInput" className="block text-xs font-semibold text-neutral-900 dark:text-neutral-200 mb-1.5">
                Ghi chú thêm (tùy chọn)
              </label>
              <textarea
                id="notesInput"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-blue-600 resize-none"
                placeholder="Nhu cầu bổ sung AI credits, môn thi hoặc câu hỏi dành cho NEXA..."
              />
            </div>

            {/* Callout thông báo */}
            <div className="p-3 rounded-md bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-zinc-300">
              <span className="font-semibold text-blue-700 dark:text-blue-400">Quy trình minh bạch:</span> Đây là luồng yêu cầu gia hạn trực tiếp đến ban điều hành NEXA. Bạn có thể theo dõi trạng thái ngay tại trang Gói Business sau khi gửi.
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-8.5 px-3.5 rounded-md border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-8.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Gửi yêu cầu gia hạn</span>
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
