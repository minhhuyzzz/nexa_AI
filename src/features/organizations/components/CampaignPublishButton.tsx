'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface CampaignPublishButtonProps {
  orgSlug: string;
  orgId: string;
  campaignId: string;
  initialIsPublished: boolean;
  initialPublishedAt?: string | null;
  gradedCount: number;
  totalSubmissions: number;
}

export function CampaignPublishButton({
  orgSlug,
  orgId,
  campaignId,
  initialIsPublished,
  initialPublishedAt,
  gradedCount,
  totalSubmissions,
}: CampaignPublishButtonProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPublishedAt || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể công bố kết quả đợt thi');
      }

      setIsPublished(true);
      setPublishedAt(data.publishedAt || new Date().toISOString());
      setShowConfirmModal(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi công bố kết quả');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPublished) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
        <span>
          Đã công bố điểm cho thí sinh{' '}
          {publishedAt
            ? `(${new Date(publishedAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })})`
            : ''}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-neutral-900 rounded-md text-xs font-semibold shadow-2xs transition-colors shrink-0 disabled:opacity-50"
      >
        <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Công bố kết quả toàn đợt</span>
      </button>

      {/* Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Xác nhận công bố kết quả
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Duyệt và phát hành điểm chính thức cho thí sinh
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-2 bg-slate-50 dark:bg-zinc-900 p-3.5 rounded-md border border-slate-100 dark:border-zinc-800">
              <p>
                Sau khi công bố, toàn bộ thí sinh đã nộp bài trong đợt thi này sẽ nhận được thông báo
                và có thể xem trực tiếp điểm số cùng nhận xét của ban giám khảo.
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1 font-mono">
                <span>Số bài đã nộp: {totalSubmissions}</span>
                <span>Số bài đã chấm: {gradedCount}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="px-3.5 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận công bố</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
