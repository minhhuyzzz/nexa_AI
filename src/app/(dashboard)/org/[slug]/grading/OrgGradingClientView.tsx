'use client';

import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Award,
  User,
  ExternalLink,
  ChevronRight,
  FileText,
  Check,
  RotateCcw,
} from 'lucide-react';
import { OrgEmptyState } from '@/components/dashboard/org/org-ui/OrgEmptyState';

export interface SubmissionAnswer {
  id: string;
  item_id: string;
  text_response?: string | null;
  evidence_url?: string | null;
}

export interface SubmissionItem {
  id: string;
  assessment_id: string;
  user_id: string;
  status: 'SUBMITTED' | 'EVALUATED';
  total_score: number | null;
  percentage: number | null;
  is_passed: boolean | null;
  submitted_at: string;
  time_spent_seconds?: number | null;
  evaluator_notes?: string | null;
  assessments?: {
    id: string;
    title: string;
    passing_score: number;
  } | null;
  profiles?: {
    id: string;
    email: string;
    nickname: string;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  submission_answers?: SubmissionAnswer[];
}

interface Props {
  organizationId: string;
  organizationName: string;
  submissions: SubmissionItem[];
}

export function OrgGradingClientView({
  organizationId,
  organizationName,
  submissions: initialSubmissions,
}: Props) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'EVALUATED'>('ALL');
  const [search, setSearch] = useState('');

  // Active selected submission
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSubmissions[0]?.id || null
  );

  // Scoring form state
  const selectedSub = useMemo(
    () => submissions.find((s) => s.id === selectedId) || null,
    [submissions, selectedId]
  );

  const [inputScore, setInputScore] = useState<number>(() => {
    return selectedSub?.total_score ?? 75;
  });
  const [feedback, setFeedback] = useState<string>(() => {
    return selectedSub?.evaluator_notes ?? '';
  });

  // Sync inputs when selected submission changes
  React.useEffect(() => {
    if (selectedSub) {
      setInputScore(selectedSub.total_score ?? 75);
      setFeedback(selectedSub.evaluator_notes ?? '');
      setAiSuggestion(null);
      setGradeError(null);
      setGradeSuccess(null);
    }
  }, [selectedSub?.id]);

  // Async states
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [isAiGrading, setIsAiGrading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestedScore: number;
    evidenceQuote: string;
    confidence: number;
  } | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null);

  // Filtered queue
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameMatch =
          s.profiles?.nickname?.toLowerCase().includes(q) ||
          s.profiles?.full_name?.toLowerCase().includes(q) ||
          s.profiles?.email?.toLowerCase().includes(q);
        const testMatch = s.assessments?.title?.toLowerCase().includes(q);
        if (!nameMatch && !testMatch) return false;
      }
      return true;
    });
  }, [submissions, filterStatus, search]);

  const pendingCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
  const evaluatedCount = submissions.filter((s) => s.status === 'EVALUATED').length;

  // AI Assist handler
  const handleAiSuggest = async () => {
    if (!selectedSub) return;
    setIsAiGrading(true);
    setGradeError(null);

    try {
      const res = await fetch('/api/ai/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: selectedSub.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI gợi ý chấm điểm không khả dụng lúc này');
      }

      const totalScore =
        typeof data.evaluation?.totalScore === 'number'
          ? data.evaluation.totalScore
          : typeof data.suggestedScore === 'number'
          ? data.suggestedScore
          : null;

      if (totalScore === null) {
        throw new Error('AI không thể tính điểm cho bài thi này. Vui lòng chấm điểm thủ công.');
      }

      setInputScore(totalScore);
      setAiSuggestion({
        suggestedScore: totalScore,
        evidenceQuote:
          data.evaluation?.evidenceQuote ||
          data.evidenceQuote ||
          'Minh chứng bài làm được ghi nhận và phân tích phù hợp tiêu chí DigComp.',
        confidence: Number(data.evaluation?.confidenceScore ?? data.confidenceScore ?? 85),
      });
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gọi AI');
    } finally {
      setIsAiGrading(false);
    }
  };

  // Submit / Approve Grade
  const handleApproveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsSubmittingGrade(true);
    setGradeError(null);
    setGradeSuccess(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/grading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          totalScore: Number(inputScore),
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể phê duyệt điểm số');
      }

      setGradeSuccess('Đã lưu & phê duyệt điểm thành công!');

      // Update state locally
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSub.id
            ? {
                ...s,
                status: 'EVALUATED',
                total_score: Number(inputScore),
                percentage: Number(inputScore),
                is_passed: Number(inputScore) >= (s.assessments?.passing_score || 70),
                evaluator_notes: feedback,
              }
            : s
        )
      );

      // Auto-advance to next pending submission if available
      const nextPending = filteredSubmissions.find(
        (s) => s.id !== selectedSub.id && s.status === 'SUBMITTED'
      );
      if (nextPending) {
        setTimeout(() => {
          setSelectedId(nextPending.id);
          setGradeSuccess(null);
        }, 800);
      }
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  if (submissions.length === 0) {
    return (
      <OrgEmptyState
        icon={<FileCheck className="w-5 h-5" strokeWidth={1.75} />}
        title="Chưa có bài thi nào được nộp"
        description="Khi học viên hoặc nhân sự trong tổ chức nộp bài khảo thí, các bài nộp sẽ tự động tập trung tại Bàn chấm bài để giảng viên thẩm định theo Rubric."
      />
    );
  }

  const passingScoreThreshold = selectedSub?.assessments?.passing_score || 70;
  const isPassing = Number(inputScore) >= passingScoreThreshold;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-[#111114] shadow-sm min-h-[680px]">
      {/* =========================================================================
          CỘT 1: HÀNG ĐỢI NỘP BÀI (SUBMISSION QUEUE)
          ========================================================================= */}
      <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-slate-50/50 dark:bg-[#0d0d10]">
        {/* Queue Header & Filters */}
        <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
              HÀNG ĐỢI NỘP BÀI
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-neutral-300">
              {filteredSubmissions.length} bài
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên học viên..."
              className="w-full h-7.5 pl-8 pr-2.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded bg-slate-200/60 dark:bg-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`flex-1 py-1 rounded text-center font-medium transition cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
              }`}
            >
              Tất cả ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('SUBMITTED')}
              className={`flex-1 py-1 rounded text-center font-medium transition cursor-pointer ${
                filterStatus === 'SUBMITTED'
                  ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
              }`}
            >
              Chờ ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('EVALUATED')}
              className={`flex-1 py-1 rounded text-center font-medium transition cursor-pointer ${
                filterStatus === 'EVALUATED'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
              }`}
            >
              Duyệt ({evaluatedCount})
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80 max-h-[600px] lg:max-h-[calc(100vh-280px)]">
          {filteredSubmissions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500">
              Không có bài nộp nào phù hợp
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const isSelected = sub.id === selectedId;
              const isEvaluated = sub.status === 'EVALUATED';
              const name = sub.profiles?.nickname || sub.profiles?.full_name || 'Học viên';

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedId(sub.id)}
                  className={`w-full p-3.5 text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-3 border-blue-600 dark:border-blue-400'
                      : 'hover:bg-slate-100/60 dark:hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-neutral-300 text-xs font-bold shrink-0 mt-0.5">
                    {name.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                        {name}
                      </span>
                      {isEvaluated ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                          {sub.total_score}đ
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Chờ chấm" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                      {sub.assessments?.title || 'Bài đánh giá'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-1">
                      <span>{new Date(sub.submitted_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(sub.submitted_at).toLocaleDateString('vi-VN')}</span>
                      <span className={isEvaluated ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                        {isEvaluated ? 'Đã duyệt' : 'Chờ chấm'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          CỘT 2: MINH CHỨNG BÀI LÀM (EVIDENCE & DOCUMENT VIEWER)
          ========================================================================= */}
      <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-[#111114]">
        {selectedSub ? (
          <>
            {/* Candidate & Test Header */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                    {selectedSub.profiles?.nickname || selectedSub.profiles?.full_name || 'Học viên'}
                  </h3>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400">
                    {selectedSub.profiles?.email || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Bài thi: <strong className="text-slate-800 dark:text-neutral-200">{selectedSub.assessments?.title}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 font-mono shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums">
                  {selectedSub.time_spent_seconds ? `${Math.round(selectedSub.time_spent_seconds / 60)} phút` : '30 phút'}
                </span>
              </div>
            </div>

            {/* Evidence & Answers Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 max-h-[600px] lg:max-h-[calc(100vh-280px)]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
                  NỘI DUNG BÀI LÀM &amp; MINH CHỨNG THỰC HÀNH
                </h4>
                <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                  {selectedSub.submission_answers?.length || 0} câu trả lời
                </span>
              </div>

              {selectedSub.submission_answers && selectedSub.submission_answers.length > 0 ? (
                selectedSub.submission_answers.map((ans, idx) => (
                  <div
                    key={ans.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
                      <span>Câu hỏi #{idx + 1}</span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {ans.item_id.slice(0, 8)}</span>
                    </div>

                    {ans.text_response ? (
                      <div className="p-3 rounded bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {ans.text_response}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400 dark:text-neutral-500">
                        Không có văn bản trả lời tự luận.
                      </p>
                    )}

                    {ans.evidence_url && (
                      <div className="pt-1">
                        <a
                          href={ans.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Xem tệp minh chứng đính kèm</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs font-medium text-slate-700 dark:text-neutral-300">
                    Bài thi trắc nghiệm khách quan
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 max-w-xs mx-auto">
                    Các câu hỏi đã được hệ thống tự động ghi nhận và tính điểm sơ bộ. Giảng viên có thể xác thực lại hoặc điều chỉnh điểm Rubric.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center my-auto text-xs text-slate-400">
            Chọn một bài nộp ở cột hàng đợi để xem nội dung
          </div>
        )}
      </div>

      {/* =========================================================================
          CỘT 3: BẢNG ĐIỂM RUBRIC & AI TRỢ LÝ (RUBRIC DESK)
          ========================================================================= */}
      <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50/30 dark:bg-[#0d0d10] p-4 sm:p-5">
        {selectedSub ? (
          <form onSubmit={handleApproveGrade} className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Desk Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
                  BẢNG ĐIỂM RUBRIC /100
                </span>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                  Ngưỡng đạt: <strong className="text-slate-800 dark:text-neutral-200">{passingScoreThreshold}đ</strong>
                </span>
              </div>

              {/* Score Input Card */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                    Điểm số cuối cùng
                  </label>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isPassing
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {isPassing ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={inputScore}
                    onChange={(e) => setInputScore(Number(e.target.value))}
                    className="w-24 h-12 text-2xl font-bold font-mono text-center rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600 tabular-nums"
                  />
                  <span className="text-base font-bold font-mono text-slate-400 dark:text-neutral-500">
                    / 100 điểm
                  </span>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[50, 65, 75, 85, 95, 100].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setInputScore(score)}
                      className="flex-1 py-1 text-[11px] font-mono rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Grading Assistant Section */}
              <div className="p-3.5 rounded-lg border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Trợ lý AI chấm bài</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={isAiGrading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-zinc-900 hover:bg-blue-100 dark:hover:bg-zinc-800 border border-blue-300/80 dark:border-blue-800 rounded transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {isAiGrading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang phân tích...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Gợi ý điểm</span>
                      </>
                    )}
                  </button>
                </div>

                {aiSuggestion && (
                  <div className="text-xs text-blue-900 dark:text-blue-200 bg-white dark:bg-[#111114] p-2.5 rounded border border-blue-200 dark:border-blue-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>Điểm AI đề xuất: {aiSuggestion.suggestedScore}đ</span>
                      <span className="text-[10px] font-mono text-slate-500">Độ tin cậy: {aiSuggestion.confidence}%</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-300 italic leading-relaxed">
                      &ldquo;{aiSuggestion.evidenceQuote}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                  Nhận xét &amp; Góp ý của Giảng viên
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập nhận xét về điểm mạnh hoặc khoảng trống năng lực số của bài thi..."
                  className="w-full p-2.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none leading-relaxed"
                />
              </div>

              {/* Error & Success Messages */}
              {gradeError && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gradeError}</span>
                </div>
              )}

              {gradeSuccess && (
                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{gradeSuccess}</span>
                </div>
              )}
            </div>

            {/* Bottom Primary Action Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="submit"
                disabled={isSubmittingGrade}
                className="w-full h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingGrade ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu kết quả...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu &amp; Phê Duyệt Kết Quả ({inputScore}/100)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center my-auto text-xs text-slate-400">
            Chưa có bài thi nào được chọn
          </div>
        )}
      </div>
    </div>
  );
}
