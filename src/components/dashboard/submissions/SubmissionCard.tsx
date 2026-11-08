import React from 'react';
import {
  FileText,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Building2,
} from 'lucide-react';
import {
  PersonalSubmissionItem,
  SubmissionViewMode,
} from '@/features/classes/types/personal-submissions.types';

interface SubmissionCardProps {
  item: PersonalSubmissionItem;
  onSelect: (item: PersonalSubmissionItem, view: SubmissionViewMode) => void;
}

export function SubmissionCard({ item, onSelect }: SubmissionCardProps) {
  // Determine CTA text & target view mode
  let ctaText = 'Xem nhiệm vụ';
  let targetView: SubmissionViewMode = 'detail';
  let isPrimaryCta = false;

  switch (item.status) {
    case 'todo':
      ctaText = 'Xem nhiệm vụ';
      targetView = 'detail';
      isPrimaryCta = true;
      break;
    case 'progress':
      ctaText = 'Tiếp tục';
      targetView = 'submit';
      isPrimaryCta = true;
      break;
    case 'wait':
      ctaText = 'Theo dõi';
      targetView = 'tracking';
      isPrimaryCta = false;
      break;
    case 'done':
      ctaText = 'Xem kết quả';
      targetView = 'result';
      isPrimaryCta = false;
      break;
    case 'resubmit':
      ctaText = 'Sửa & nộp lại';
      targetView = 'submit';
      isPrimaryCta = true;
      break;
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-blue-300 dark:hover:border-zinc-700 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Icon & Info */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <FileText className="w-5 h-5" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              onClick={() => onSelect(item, targetView)}
              className="text-sm font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-1"
            >
              {item.title}
            </h3>

            {item.isOverdue && item.status !== 'done' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                <AlertTriangle className="w-2.5 h-2.5" />
                Quá hạn
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1 font-medium text-neutral-700 dark:text-zinc-300">
              <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              {item.className}
              {item.classCode ? ` (${item.classCode})` : ''}
            </span>

            {item.organizationName && (
              <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                <Building2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span>{item.organizationName}</span>
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 max-w-xl">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Middle: Deadline & Status */}
      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0">
        {/* Due date */}
        <div className="text-left md:text-right min-w-[120px]">
          <div className="flex items-center md:justify-end gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <span className="font-medium text-neutral-800 dark:text-zinc-200">
              {item.deadlineFormatted || 'Không giới hạn'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-neutral-500">
            Hạn chót nộp bài
          </span>
        </div>

        {/* Status Badge */}
        <div className="min-w-[110px] text-left md:text-center">
          {item.status === 'todo' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
              <Clock className="w-3 h-3 text-blue-500" />
              Chưa bắt đầu
            </span>
          )}
          {item.status === 'progress' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              <FileText className="w-3 h-3 text-slate-500" />
              Bản nháp
            </span>
          )}
          {item.status === 'wait' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40">
              <Clock className="w-3 h-3 text-amber-600" />
              Chờ đánh giá
            </span>
          )}
          {item.status === 'done' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Đã chấm {item.officialScore !== undefined ? `(${item.officialScore}đ)` : ''}
            </span>
          )}
          {item.status === 'resubmit' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40">
              <RotateCcw className="w-3 h-3 text-rose-600" />
              Yêu cầu nộp lại
            </span>
          )}
        </div>

        {/* CTA Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onSelect(item, targetView)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              isPrimaryCta
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                : 'border border-slate-200/90 dark:border-zinc-750 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 shadow-2xs'
            }`}
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
