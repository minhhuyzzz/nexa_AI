import React from 'react';
import {
  ChevronLeft,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  Download,
  ArrowRight,
  Info,
  Clock,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import {
  PersonalSubmissionItem,
  SubmissionViewMode,
} from '@/features/classes/types/personal-submissions.types';

interface SubmissionDetailViewProps {
  item: PersonalSubmissionItem;
  onBack: () => void;
  onNavigate: (view: SubmissionViewMode) => void;
}

export function SubmissionDetailView({ item, onBack, onNavigate }: SubmissionDetailViewProps) {
  const isActionable = item.status === 'todo' || item.status === 'progress' || item.status === 'resubmit';

  const defaultRequirements = [
    'Sử dụng dữ liệu và tài liệu đính kèm để hoàn thành nội dung bài làm theo đúng yêu cầu.',
    'Trình bày phương pháp, luận điểm và đính kèm biểu đồ/minh chứng cụ thể nếu có.',
    'Nộp đúng định dạng được chấp nhận (PDF, DOCX, XLSX, ZIP) trước thời hạn quy định.',
  ];

  const requirements = item.requirements && item.requirements.length > 0 ? item.requirements : defaultRequirements;

  const defaultRubric = [
    { id: '1', name: 'Độ chính xác và đầy đủ của thông tin & minh chứng', maxPoints: 40 },
    { id: '2', name: 'Phương pháp phân tích, tư duy và lập luận logic', maxPoints: 30 },
    { id: '3', name: 'Hình thức trình bày, cấu trúc tài liệu và kết luận', maxPoints: 30 },
  ];

  const rubric = item.rubric && item.rubric.length > 0 ? item.rubric : defaultRubric;
  const totalMaxPoints = rubric.reduce((sum, r) => sum + r.maxPoints, 0) || item.maxScore || 100;

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

      {/* 2. Heading Header */}
      <div className="pb-4 border-b border-slate-100 dark:border-zinc-850">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            CHI TIẾT NHIỆM VỤ
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {item.title}
          </h1>

          {/* Status Badge */}
          <div className="shrink-0">
            {item.status === 'todo' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Chưa bắt đầu
              </span>
            )}
            {item.status === 'progress' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Bản nháp
              </span>
            )}
            {item.status === 'wait' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Chờ đánh giá
              </span>
            )}
            {item.status === 'done' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đã chấm
              </span>
            )}
            {item.status === 'resubmit' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                Yêu cầu nộp lại
              </span>
            )}
          </div>
        </div>

        {/* Metadata info */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-zinc-200">
            <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            {item.className} {item.classCode ? `(${item.classCode})` : ''}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            Hạn chót: <strong className="text-neutral-800 dark:text-zinc-200">{item.deadlineFormatted || 'Không giới hạn'}</strong>
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            Hình thức: Nộp tệp minh chứng
          </span>
        </div>
      </div>

      {/* 3. Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Requirements & Rubric (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Mô tả nhiệm vụ */}
          <section className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Mô tả nhiệm vụ
            </h2>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              {item.description ||
                'Vui lòng đọc kỹ tài liệu hướng dẫn và hoàn thành bài tập theo đúng các tiêu chí được giao. Sau khi hoàn thiện, hãy nộp tệp bài làm và ghi chú giải trình kèm theo.'}
            </p>

            <div className="border-t border-slate-100 dark:border-zinc-850 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wide">
                Yêu cầu thực hiện
              </h3>
              <div className="space-y-2">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-850 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wide">
                Tiêu chí chấm điểm (Rubric)
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-zinc-850 border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                {rubric.map((r, idx) => (
                  <div key={r.id || idx} className="flex items-center justify-between p-3 text-xs bg-slate-50/40 dark:bg-zinc-900/30">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold font-mono text-[10px] flex items-center justify-center">
                        0{idx + 1}
                      </span>
                      <span className="text-neutral-800 dark:text-zinc-200 font-medium">
                        {r.name}
                      </span>
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 shrink-0 ml-4">
                      {r.maxPoints} điểm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Tài liệu từ người giao */}
          <section className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Tài liệu từ người giao
            </h2>

            {item.attachments && item.attachments.length > 0 ? (
              <div className="space-y-2">
                {item.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {att.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                          {att.size}
                        </div>
                      </div>
                    </div>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-750 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải xuống</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400 dark:text-neutral-500">
                Người giao không đính kèm tệp tài liệu riêng cho nhiệm vụ này.
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Overview Card & CTA (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Thông tin bài được giao
            </h2>

            <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-zinc-850">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-neutral-400">Trạng thái</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  {item.status === 'todo' && 'Chưa bắt đầu'}
                  {item.status === 'progress' && 'Đang làm bản nháp'}
                  {item.status === 'wait' && 'Chờ đánh giá'}
                  {item.status === 'done' && 'Đã chấm điểm'}
                  {item.status === 'resubmit' && 'Yêu cầu nộp lại'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Hạn nộp</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {item.deadlineFormatted || 'Không giới hạn'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Hình thức</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">Nộp tệp</span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Điểm tối đa</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {totalMaxPoints} điểm
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Người giao</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  {item.evaluatorName || 'Giảng viên / Quản trị'}
                </span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              {isActionable ? (
                <button
                  type="button"
                  onClick={() => onNavigate('submit')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <span>{item.status === 'progress' ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : item.status === 'wait' ? (
                <button
                  type="button"
                  onClick={() => onNavigate('tracking')}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 font-semibold text-xs text-neutral-800 dark:text-zinc-200 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Theo dõi bài nộp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('result')}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Xem kết quả &amp; Phản hồi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Info Notice Box */}
          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              Bạn có thể chuẩn bị bài và lưu bản nháp trước khi nộp. Điểm bài được giao không đồng nghĩa với điểm PTS hay năng lực số.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
