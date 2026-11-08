'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  Compass,
  Check,
  Lightbulb,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AdminPreviewClientProps {
  assessmentId: string;
}

export function AdminAssessmentPreviewClient({ assessmentId }: AdminPreviewClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<any | null>(null);
  const [showAnswerKeys, setShowAnswerKeys] = useState(true);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchAssessment() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/assessments/${assessmentId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Không thể tải đề thi quản trị');
        }

        setAssessment(data.assessment);
      } catch (err: any) {
        setError(err.message || 'Lỗi kết nối khi tải bài khảo thí');
      } finally {
        setLoading(false);
      }
    }

    if (assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Đang nạp dữ liệu thẩm định đề thi...
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-[#111114] text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Không Thể Tải Xem Trước Đề Thi
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            {error || 'Bài khảo thí không tồn tại hoặc bạn chưa được cấp quyền Quản trị viên.'}
          </p>
        </div>
        <Link
          href="/admin/content"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Ngân Hàng Đề</span>
        </Link>
      </div>
    );
  }

  const rawItems = assessment.assessment_items || [];
  const items = [...rawItems].sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const totalPoints = items.reduce((acc: number, it: any) => acc + (Number(it.points) || 1), 0);

  const filteredItems = items.filter((it: any) => {
    if (selectedDomainFilter === 'ALL') return true;
    const rawCode = it.competencies?.competency_domains?.code;
    return rawCode === selectedDomainFilter;
  });

  const currentQ = filteredItems[activeQuestionIndex] || filteredItems[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. ADMIN TOP BANNER (Notice of Preview Mode) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-blue-200/90 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white dark:from-blue-950/40 dark:via-zinc-900/40 dark:to-[#111114] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                CHẾ ĐỘ XEM TRƯỚC DÀNH CHO QUẢN TRỊ VIÊN
              </span>
              <span className="text-xs text-slate-400 dark:text-neutral-500">•</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                Thẩm Định Đề Thi &amp; Đáp Án Chuẩn
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Đây là không gian dành riêng cho Quản trị viên kiểm tra nội dung. Toàn bộ thao tác tại đây <strong>không tạo dữ liệu làm bài và không ghi nhận điểm thật</strong> vào hệ thống.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link
            href="/admin/content"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ngân hàng đề</span>
          </Link>

          <Link
            href={`/admin/content/assessments/${assessment.id}`}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Mở Trong Studio</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS STRIP & ADMIN TOGGLES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
            Tổng số câu:
          </span>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
            {items.length} câu
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
            Điểm tối đa:
          </span>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
            {totalPoints} điểm
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
            Thời gian làm bài:
          </span>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
            {assessment.duration_minutes || 45} phút
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
            Ngưỡng đạt chuẩn:
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {assessment.passing_score || 70}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
            Phân hạng:
          </span>
          <div className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {assessment.access_tier === 'VIP' ? 'Đề VIP / PRO' : 'Đề Miễn Phí'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
            Trạng thái:
          </span>
          <div className="text-sm font-bold font-mono mt-1">
            {assessment.is_published ? (
              <span className="text-emerald-600 dark:text-emerald-400">Đã phát hành</span>
            ) : (
              <span className="text-slate-500 dark:text-neutral-400">Bản nháp</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. FILTER BAR & TOGGLE ANSWER KEYS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
        {/* Domain Filter */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
          <span className="text-slate-500 dark:text-neutral-400 mr-1 text-[11px]">Lọc theo miền:</span>
          {['ALL', '01', '02', '03', '04', '05'].map((code) => {
            const isSelected = selectedDomainFilter === code;
            const label = code === 'ALL' ? 'Tất cả' : `Miền ${code}`;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSelectedDomainFilter(code);
                  setActiveQuestionIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Toggle Answer Key */}
        <button
          type="button"
          onClick={() => setShowAnswerKeys(!showAnswerKeys)}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
            showAnswerKeys
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-neutral-400'
          }`}
        >
          {showAnswerKeys ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showAnswerKeys ? 'Đang hiện đáp án đúng' : 'Đang ẩn đáp án'}</span>
        </button>
      </div>

      {/* 4. MAIN CONTENT: 2-COLUMN VIEW (QUESTION DETAILS + QUESTION PALETTE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Question Detail (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-6 shadow-xs">
          {currentQ ? (
            <div className="space-y-6">
              {/* Question Subheader */}
              <div className="flex items-center justify-between pb-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md">
                    Câu {activeQuestionIndex + 1} / {filteredItems.length}
                  </span>
                  {currentQ.competencies?.competency_domains?.code && (
                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                      <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>
                        Miền {currentQ.competencies.competency_domains.code} • {currentQ.competencies.competency_domains.title}
                      </span>
                    </span>
                  )}
                </div>

                <span className="font-mono font-bold text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  +{currentQ.points || 1} điểm
                </span>
              </div>

              {/* Scenario Context (if any) */}
              {currentQ.rubric_guide && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-neutral-300 italic leading-relaxed space-y-1">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 not-italic block font-mono text-[11px]">
                    Barem chấm / Hướng dẫn tình huống:
                  </span>
                  <p>{currentQ.rubric_guide}</p>
                </div>
              )}

              {/* Prompt */}
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug font-sans">
                {currentQ.prompt}
              </h3>

              {/* Options List */}
              {currentQ.item_options && currentQ.item_options.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  {currentQ.item_options.map((opt: any, oIdx: number) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isCorrect = Boolean(opt.is_correct);
                    const isSelected = testAnswers[currentQ.id] === opt.id;

                    let cardStyle =
                      'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-800 dark:text-zinc-200';
                    let letterStyle =
                      'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300';

                    if (showAnswerKeys && isCorrect) {
                      cardStyle =
                        'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500 font-semibold';
                      letterStyle = 'bg-emerald-600 text-white';
                    } else if (isSelected) {
                      cardStyle =
                        'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500';
                      letterStyle = 'bg-blue-600 text-white';
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() =>
                          setTestAnswers((prev) => ({
                            ...prev,
                            [currentQ.id]: opt.id,
                          }))
                        }
                        className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 transition-colors cursor-pointer ${cardStyle}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${letterStyle}`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1 leading-snug">{opt.content}</span>

                        {showAnswerKeys && isCorrect && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đáp án đúng chuẩn</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation Block */}
              {showAnswerKeys && (
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Giải trình sư phạm &amp; Cơ sở chấm điểm</span>
                  </div>
                  <p className="text-slate-700 dark:text-neutral-300 leading-relaxed text-[11px] sm:text-xs">
                    {currentQ.item_options?.find((o: any) => o.is_correct)?.explanation ||
                      currentQ.explanation ||
                      'Câu hỏi được thiết kế theo chuẩn năng lực số 5 miền. Thí sinh lựa chọn phương án đúng sẽ được ghi nhận toàn bộ số điểm của câu hỏi.'}
                  </p>
                </div>
              )}

              {/* Question Navigation */}
              <div className="flex items-center justify-between pt-4 text-xs font-semibold">
                <button
                  type="button"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Câu trước</span>
                </button>

                <button
                  type="button"
                  disabled={activeQuestionIndex === filteredItems.length - 1}
                  onClick={() =>
                    setActiveQuestionIndex((prev) =>
                      Math.min(filteredItems.length - 1, prev + 1)
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-12">
              Không có câu hỏi nào khớp với bộ lọc miền năng lực này.
            </p>
          )}
        </div>

        {/* Right Column: Question Palette Matrix (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-4 shadow-xs">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
              <span>Bảng Ma Trận Đề Thi</span>
              <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                {filteredItems.length} câu
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Chọn ô số câu để thẩm định chi tiết
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-1">
            {filteredItems.map((it: any, idx: number) => {
              const isSelected = activeQuestionIndex === idx;
              const hasCorrectOpt = it.item_options?.some((o: any) => o.is_correct);

              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`h-9 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : hasCorrectOpt && showAnswerKeys
                      ? 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                      : 'border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-slate-700 dark:text-neutral-300 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>Đã có đáp án</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded border-2 border-blue-600" />
              <span>Đang xem</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
