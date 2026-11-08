import React from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  Info,
  Calendar,
  Users,
} from 'lucide-react';
import { PersonalSubmissionItem } from '@/features/classes/types/personal-submissions.types';

interface SubmissionTrackingViewProps {
  item: PersonalSubmissionItem;
  onBack: () => void;
}

export function SubmissionTrackingView({ item, onBack }: SubmissionTrackingViewProps) {
  const file = item.submittedFile;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Breadcrumbs */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại danh sách Bài được giao</span>
        </button>
      </div>

      {/* 2. Page Header */}
      <div className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            THEO DÕI BÀI ĐÃ NỘP
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Đã nộp • Chờ đánh giá
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              {item.title} • {item.className}
            </p>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Chờ đánh giá
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Callout */}
      <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
        <div className="leading-relaxed">
          <strong className="font-bold">Hệ thống đã ghi nhận bài nộp thành công.</strong> Bài đang chờ người chấm đánh giá; bạn có thể xem lại tệp và ghi chú đã gửi bên dưới.
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stepper & Version details (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          {/* Stepper */}
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Tiến trình xử lý
            </h2>

            <div className="grid grid-cols-4 items-center gap-2 relative">
              {/* Step 1: Đã giao */}
              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-neutral-800 dark:text-zinc-200">Đã giao</div>
              </div>

              {/* Step 2: Đã nộp */}
              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-neutral-800 dark:text-zinc-200">Đã nộp</div>
              </div>

              {/* Step 3: Chờ đánh giá */}
              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 flex items-center justify-center mx-auto text-xs font-bold ring-2 ring-amber-200 dark:ring-amber-900/50">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Chờ đánh giá</div>
              </div>

              {/* Step 4: Đã chấm */}
              <div className="text-center space-y-1 opacity-40">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mx-auto text-xs font-bold">
                  4
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">Đã chấm</div>
              </div>
            </div>
          </div>

          {/* Submitted version details */}
          <div className="pt-5 space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wide">
              Phiên bản bài nộp đã gửi
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-neutral-400">Thời gian hệ thống ghi nhận</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200 font-mono">
                  {item.submittedAtFormatted || 'Vừa xong'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-neutral-400">Phiên bản</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200 font-mono">
                  0{item.submittedVersion || 1}
                </span>
              </div>
            </div>

            {/* Attached file view */}
            {file && (
              <div className="mt-3 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                      {file.size} • Tệp minh chứng đã lưu
                    </div>
                  </div>
                </div>

                {file.storagePath && (
                  <a
                    href={file.storagePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-750 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Xem tệp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Student note */}
          <div className="pt-5 space-y-2">
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wide">
              Ghi chú đã gửi kèm bài nộp
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed bg-slate-50/60 dark:bg-zinc-900/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-850">
              {item.studentNote || 'Không có ghi chú kèm theo.'}
            </p>
          </div>
        </div>

        {/* Right Column: Summary Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Tóm tắt nhiệm vụ
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-neutral-400">Trạng thái</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">Chờ đánh giá</span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Đã nộp</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  {item.submittedAtFormatted || 'Hôm nay'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Hạn nộp</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  {item.deadlineFormatted || 'Không giới hạn'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Kết quả</span>
                <span className="font-semibold text-slate-400 dark:text-neutral-500">Chưa có</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 font-semibold text-xs text-neutral-800 dark:text-zinc-200 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Quay lại danh sách</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              Hệ thống không hiển thị thời gian dự kiến chấm khi chưa có cam kết từ người đánh giá. Nếu được mở quyền nộp lại, bạn sẽ nhận được thông báo tại đây.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
