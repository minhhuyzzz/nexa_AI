'use client';

import React, { useEffect } from 'react';
import { DomainMetric } from '../types/org-analytics.types';
import { X, CheckCircle2, AlertCircle, BookOpen, Layers, BarChart2 } from 'lucide-react';

interface Props {
  domain: DomainMetric | null;
  onClose: () => void;
}

export function DomainDetailDrawer({ domain, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (domain) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [domain, onClose]);

  if (!domain) return null;

  const score = domain.score;
  const isEvaluated = score !== null;
  const isProficient = isEvaluated && score >= 75;
  const isGap = isEvaluated && score < 60;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative z-10 w-full max-w-md bg-white dark:bg-[#0A0A0B] border-l border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <div className="p-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                {domain.domainCode}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                Miền năng lực số cốt lõi
              </span>
            </div>
            <h2
              id="drawer-title"
              className="text-base font-bold text-slate-900 dark:text-neutral-100 leading-snug"
            >
              {domain.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng chi tiết"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
              <div className="text-[11px] text-slate-500 dark:text-neutral-400">Điểm trung bình</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                {isEvaluated ? `${score}đ` : 'Chưa có'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1">
                Thang điểm 100
              </div>
            </div>

            <div className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
              <div className="text-[11px] text-slate-500 dark:text-neutral-400">Độ phủ &amp; Người đánh giá</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                {domain.coverageRate !== null ? `${domain.coverageRate}%` : '—'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1">
                {domain.testedCount > 0 ? `${domain.testedCount} người có bằng chứng` : 'Chưa có bài thi'}
              </div>
            </div>
          </div>

          {/* Evaluation Status Banner */}
          <div className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                Đánh giá tình trạng miền
              </span>
              {isProficient ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mức thành thạo (&ge; 75đ)
                </span>
              ) : isGap ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Khoảng trống cần bồi dưỡng (&lt; 60đ)
                </span>
              ) : isEvaluated ? (
                <span className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
                  Mức cơ bản (60 - 74đ)
                </span>
              ) : (
                <span className="text-[11px] font-normal text-slate-400 dark:text-neutral-500 italic">
                  Chưa có bài thi được chấm
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
              Tổng số <span className="font-mono font-semibold text-slate-900 dark:text-neutral-200">{domain.testedCount}</span> bài thi đã hoàn thành phần khảo thí có câu hỏi/minh chứng thuộc miền này.
              {isGap && ' Điểm trung bình dưới 60đ, khuyến nghị đưa vào chương trình tập huấn ưu tiên.'}
            </p>
          </div>

          {/* Scope and Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Mô tả phạm vi năng lực
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed p-3.5 rounded-md bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800">
              {domain.description}
            </p>
          </div>

          {/* Actionable recommendations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Định hướng bồi dưỡng tập thể
            </h3>
            <div className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 space-y-2 text-[11px] text-slate-600 dark:text-neutral-400">
              <p>
                • Phân công giảng viên bộ môn hoặc trưởng nhóm hướng dẫn các chuyên đề thực hành giải quyết tình huống thực tế.
              </p>
              <p>
                • Áp dụng học liệu đã thẩm định trong mục <em>Đề Xuất Can Thiệp Đào Tạo</em> bên dưới để hỗ trợ người học tự bồi dưỡng.
              </p>
              <p>
                • Lên kế hoạch đánh giá lại sau chu kỳ 30 - 60 ngày để đo lường mức độ cải thiện năng lực số.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-zinc-700 transition-colors shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
