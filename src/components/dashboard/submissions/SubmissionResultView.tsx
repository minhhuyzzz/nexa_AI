import React from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  FileText,
  ExternalLink,
  Info,
  Award,
} from 'lucide-react';
import { PersonalSubmissionItem } from '@/features/classes/types/personal-submissions.types';

interface SubmissionResultViewProps {
  item: PersonalSubmissionItem;
  onBack: () => void;
}

export function SubmissionResultView({ item, onBack }: SubmissionResultViewProps) {
  const score = item.officialScore ?? 0;
  const maxScore = item.maxScore ?? 100;
  const isPassed = item.isPassed ?? score >= (maxScore * 0.7);

  const defaultRubricBreakdown = [
    { id: '1', name: 'Độ chính xác và đầy đủ của thông tin & minh chứng', maxPoints: 40, awardedPoints: Math.round(score * 0.4) },
    { id: '2', name: 'Phương pháp phân tích, tư duy và lập luận logic', maxPoints: 30, awardedPoints: Math.round(score * 0.3) },
    { id: '3', name: 'Hình thức trình bày, cấu trúc tài liệu và kết luận', maxPoints: 30, awardedPoints: Math.round(score * 0.3) },
  ];

  const rubric = item.rubric && item.rubric.length > 0 ? item.rubric : defaultRubricBreakdown;
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
      <div className="pb-4 border-b border-slate-100 dark:border-zinc-850">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            KẾT QUẢ &amp; PHẢN HỒI
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Kết quả bài được giao
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              {item.title} • {item.className}
            </p>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Đã chấm điểm
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Feedback & Rubric (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          {/* Feedback from Evaluator */}
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Nhận xét của người chấm
            </h2>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 text-xs text-neutral-800 dark:text-zinc-200 leading-relaxed space-y-2">
              <p>
                {item.evaluatorFeedback ||
                  'Bài làm có phương pháp rõ ràng, số liệu được xử lý tốt và kết luận đáp ứng các tiêu chuẩn của bài học. Bạn nên chú ý bổ sung phần ghi chú biểu đồ cụ thể hơn ở lần thực hành kế tiếp để người đọc dễ theo dõi.'}
              </p>
              <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium pt-1">
                {item.evaluatorName || 'Giảng viên phụ trách'} • {item.evaluatorGradedAt || 'Đã xác nhận'}
              </div>
            </div>
          </div>

          {/* Rubric Points Breakdown */}
          <div className="border-t border-slate-100 dark:border-zinc-850 pt-5 space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wide">
              Điểm chi tiết theo tiêu chí (Rubric)
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-zinc-850 border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              {rubric.map((r, idx) => (
                <div key={r.id || idx} className="flex items-center justify-between p-3.5 text-xs bg-slate-50/40 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold font-mono text-[10px] flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <span className="text-neutral-800 dark:text-zinc-200 font-medium">
                      {r.name}
                    </span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono shrink-0 ml-4">
                    {r.awardedPoints ?? r.maxPoints} / {r.maxPoints} điểm
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submitted File View */}
          {file && (
            <div className="border-t border-slate-100 dark:border-zinc-850 pt-5 space-y-3">
              <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wide">
                Tệp bài làm đã nộp
              </h3>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                      {file.size} • Phiên bản đã được chấm
                    </div>
                  </div>
                </div>

                {file.storagePath && (
                  <a
                    href={file.storagePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-750 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Xem lại</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Score Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 text-center">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 text-left">
              Kết quả chính thức
            </h2>

            {/* Score Big Display */}
            <div className="p-6 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="text-4xl font-extrabold text-blue-700 dark:text-blue-400 font-mono tracking-tight">
                {score}{' '}
                <span className="text-sm font-normal text-slate-500 dark:text-neutral-400">
                  / {maxScore}
                </span>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isPassed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  {isPassed ? 'Đạt yêu cầu' : 'Chưa đạt chuẩn'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-left divide-y divide-slate-100 dark:divide-zinc-850 pt-2">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-neutral-400">Ngày hoàn tất</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  {item.evaluatorGradedAt || 'Đã hoàn thành'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Hình thức</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  Người đánh giá chấm
                </span>
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
              Đây là điểm của bài được giao. Chỉ các minh chứng đáp ứng chính sách đánh giá mới được xem xét cập nhật hồ sơ năng lực; PTS được quản lý riêng.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
