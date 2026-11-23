'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle2, ShieldAlert, Award, FileCheck } from 'lucide-react';

interface CertificateCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints?: number;
  requiredPoints?: number;
}

export function CertificateCriteriaModal({
  isOpen,
  onClose,
  currentPoints = 51,
  requiredPoints = 10000,
}: CertificateCriteriaModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 space-y-5 p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Điều kiện nhận chứng chỉ số
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Bộ tiêu chí thẩm định của Hội đồng Khảo thí NEXA AI
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Criteria List */}
        <div className="space-y-3 text-xs">
          {/* Criterion 1: Điểm tích lũy */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                Tích lũy điểm năng lực (Ràng buộc hiện tại)
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                {currentPoints} / {requiredPoints.toLocaleString('vi-VN')} điểm
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 pl-7 leading-relaxed">
              Yêu cầu tích lũy tối thiểu 10.000 điểm thông qua các bài khảo thí, bài tập và lộ trình bồi dưỡng năng lực số.
            </p>
          </div>

          {/* Criterion 2: Hoàn thành kỳ khảo thí chuẩn hóa */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                Đạt chuẩn đánh giá năng lực số
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-neutral-500 px-2 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800">
                Quy định
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 pl-7 leading-relaxed">
              Hoàn thành các đợt đánh giá thuộc Khung năng lực số với kết quả đạt yêu cầu của Hội đồng.
            </p>
          </div>

          {/* Criterion 3: Liêm chính khảo thí */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                Liêm chính học thuật & Xác minh hồ sơ
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-neutral-500 px-2 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800">
                Bảo chứng
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 pl-7 leading-relaxed">
              Dữ liệu bài làm hợp lệ, tuân thủ Nghị định 13/2023/NĐ-CP và không vi phạm quy chế khảo thí.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
