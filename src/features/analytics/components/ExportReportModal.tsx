'use client';

import React, { useEffect, useState } from 'react';
import { X, Download, Printer, FileText, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orgName: string;
  orgSlug: string;
  evaluatedCount: number;
  selectedCampaignTitle?: string;
  selectedClassName?: string;
  campaignId?: string;
  classId?: string;
}

export function ExportReportModal({
  isOpen,
  onClose,
  orgName,
  orgSlug,
  evaluatedCount,
  selectedCampaignTitle,
  selectedClassName,
  campaignId,
  classId,
}: Props) {
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    setIsExportingCsv(true);
    const queryParams = new URLSearchParams();
    if (campaignId) queryParams.set('campaignId', campaignId);
    if (classId) queryParams.set('classId', classId);

    const exportUrl = `/api/org/${orgSlug}/analytics/export?${queryParams.toString()}`;
    window.location.href = exportUrl;
    setTimeout(() => {
      setIsExportingCsv(false);
      onClose();
    }, 1200);
  };

  const handlePrintPdf = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111114] rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 text-xs animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 id="export-modal-title" className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              Xuất Báo Cáo Năng Lực Số
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Info Card */}
        <div className="my-4 p-3.5 rounded-md bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-neutral-400">Đơn vị:</span>
            <span className="font-semibold text-slate-800 dark:text-neutral-200">{orgName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-neutral-400">Đợt đánh giá:</span>
            <span className="font-semibold text-slate-800 dark:text-neutral-200">
              {selectedCampaignTitle || 'Tất cả các đợt'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-neutral-400">Lớp / Bộ phận:</span>
            <span className="font-semibold text-slate-800 dark:text-neutral-200">
              {selectedClassName || 'Toàn bộ đơn vị'}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-500 dark:text-neutral-400">Dữ liệu hợp lệ:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {evaluatedCount} bài đã phê duyệt
            </span>
          </div>
        </div>

        {evaluatedCount === 0 && (
          <div className="mb-4 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Không thể xuất báo cáo vì chưa có bài thi nào được phê duyệt điểm trong phạm vi đang chọn.
            </p>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            disabled={evaluatedCount === 0 || isExportingCsv}
            onClick={handleDownloadCsv}
            className="w-full p-3 rounded-md border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all flex items-center justify-between group disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-slate-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-neutral-100">
                  {isExportingCsv ? 'Đang khởi tạo file...' : 'Tải dữ liệu bảng tính (CSV)'}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                  Định dạng UTF-8 BOM, đầy đủ điểm 5 miền và kết quả khảo thí
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={evaluatedCount === 0}
            onClick={handlePrintPdf}
            className="w-full p-3 rounded-md border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all flex items-center justify-between group disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-slate-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-neutral-100">
                  In trang / Lưu bản PDF
                </div>
                <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                  Xuất định dạng trang in báo cáo tổng hợp chuẩn trực tiếp từ trình duyệt
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-neutral-500 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Dữ liệu báo cáo được kiểm tra phân quyền máy chủ và bảo mật tenant nghiêm ngặt.</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
