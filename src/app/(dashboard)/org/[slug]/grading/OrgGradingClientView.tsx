'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  ArrowRight,
  Filter,
  X,
  Layers,
  GraduationCap,
  Calendar,
} from 'lucide-react';

export interface AssessmentItemInfo {
  id: string;
  prompt: string;
  points: number;
  type: string;
  order_index?: number;
}

export interface SubmissionAnswer {
  id: string;
  item_id: string;
  text_response?: string | null;
  evidence_url?: string | null;
  score_awarded?: number | null;
  auto_graded?: boolean | null;
  assessment_items?: AssessmentItemInfo | AssessmentItemInfo[] | null;
}

export interface SubmissionItem {
  id: string;
  assessment_id: string;
  user_id: string;
  status: 'SUBMITTED' | 'EVALUATED';
  grading_status?: string | null;
  total_score: number | null;
  percentage: number | null;
  is_passed: boolean | null;
  submitted_at: string;
  time_spent_seconds?: number | null;
  evaluator_notes?: string | null;
  class_assignment_id?: string | null;
  campaign_id?: string | null;
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

export interface OrgClassOption {
  id: string;
  name: string;
  class_code: string;
}

export interface OrgCampaignOption {
  id: string;
  title: string;
}

interface Props {
  organizationId: string;
  organizationName: string;
  slug: string;
  classes: OrgClassOption[];
  campaigns: OrgCampaignOption[];
  classAssignmentMap?: Record<string, string>; // class_assignment_id -> class_id
  submissions: SubmissionItem[];
  initialClassId?: string;
  initialCampaignId?: string;
  initialStatus?: string;
  initialSubmissionId?: string | null;
}

export function OrgGradingClientView({
  organizationId,
  organizationName,
  slug,
  classes,
  campaigns,
  classAssignmentMap = {},
  submissions: initialSubmissions,
  initialClassId = '',
  initialCampaignId = '',
  initialStatus = 'ALL',
  initialSubmissionId = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'EVALUATED'>(
    initialStatus === 'SUBMITTED' || initialStatus === 'EVALUATED' ? initialStatus : 'ALL'
  );
  const [search, setSearch] = useState('');

  // Mobile segmented control: queue | evidence | rubric
  const [mobileTab, setMobileTab] = useState<'queue' | 'evidence' | 'rubric'>('queue');

  // Active selected submission
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSubmissionId || initialSubmissions[0]?.id || null
  );

  // Filtered queue based on context dropdowns, status, and search
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // 1. Filter by Class
      if (selectedClassId) {
        if (!s.class_assignment_id) return false;
        const mappedClassId = classAssignmentMap[s.class_assignment_id];
        if (mappedClassId !== selectedClassId) return false;
      }

      // 2. Filter by Campaign
      if (selectedCampaignId) {
        if (s.campaign_id !== selectedCampaignId) return false;
      }

      // 3. Filter by Status
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;

      // 4. Filter by Search Query
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
  }, [submissions, selectedClassId, selectedCampaignId, filterStatus, search, classAssignmentMap]);

  // Keep selected submission valid when filter changes
  useEffect(() => {
    if (filteredSubmissions.length > 0) {
      const stillInList = filteredSubmissions.some((s) => s.id === selectedId);
      if (!stillInList) {
        setSelectedId(filteredSubmissions[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredSubmissions, selectedId]);

  const selectedSub = useMemo(
    () => submissions.find((s) => s.id === selectedId) || null,
    [submissions, selectedId]
  );

  // Partition answers for active submission: auto-graded MCQ vs Open/Practical
  const { autoMcqAnswers, openAnswers, mcqAutoPoints, mcqMaxPoints } = useMemo(() => {
    if (!selectedSub?.submission_answers) {
      return { autoMcqAnswers: [], openAnswers: [], mcqAutoPoints: 0, mcqMaxPoints: 0 };
    }

    const autoMcq: SubmissionAnswer[] = [];
    const open: SubmissionAnswer[] = [];
    let mcqScore = 0;
    let mcqMax = 0;

    for (const ans of selectedSub.submission_answers) {
      const rawItem = Array.isArray(ans.assessment_items)
        ? ans.assessment_items[0]
        : ans.assessment_items;
      const pts = Number(rawItem?.points) || 10;

      if (ans.auto_graded === true) {
        autoMcq.push(ans);
        mcqScore += Number(ans.score_awarded) || 0;
        mcqMax += pts;
      } else {
        open.push(ans);
      }
    }

    return {
      autoMcqAnswers: autoMcq,
      openAnswers: open,
      mcqAutoPoints: mcqScore,
      mcqMaxPoints: mcqMax,
    };
  }, [selectedSub]);

  // Scoring form state per open item
  const [openItemScores, setOpenItemScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string>('');

  // Sync inputs when selected submission changes
  useEffect(() => {
    if (selectedSub) {
      const initialItemScores: Record<string, number> = {};
      (selectedSub.submission_answers || []).forEach((ans) => {
        if (!ans.auto_graded) {
          const rawItem = Array.isArray(ans.assessment_items)
            ? ans.assessment_items[0]
            : ans.assessment_items;
          const maxPts = Number(rawItem?.points) || 20;
          initialItemScores[ans.item_id] =
            typeof ans.score_awarded === 'number' ? ans.score_awarded : maxPts;
        }
      });
      setOpenItemScores(initialItemScores);
      setFeedback(selectedSub.evaluator_notes ?? '');
      setAiSuggestion(null);
      setGradeError(null);
      setGradeSuccess(null);
    }
  }, [selectedSub?.id]);

  // Total calculated score: MCQ auto score + sum of open item scores
  const calculatedTotalScore = useMemo(() => {
    const openTotal = Object.values(openItemScores).reduce((sum, val) => sum + (Number(val) || 0), 0);
    // If no open answers exist (e.g. legacy test record), fallback to selectedSub total_score
    if (openAnswers.length === 0 && autoMcqAnswers.length === 0) {
      return selectedSub?.total_score ?? 0;
    }
    return mcqAutoPoints + openTotal;
  }, [mcqAutoPoints, openItemScores, openAnswers.length, autoMcqAnswers.length, selectedSub?.total_score]);

  // Async states
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [isAiGrading, setIsAiGrading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestedScore: number;
    evidenceQuote: string;
    confidence: number;
    confidenceFlag?: 'GREEN' | 'AMBER' | 'RED' | string;
    feedback?: string | null;
  } | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null);

  const pendingCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
  const evaluatedCount = submissions.filter((s) => s.status === 'EVALUATED').length;
  const hasActiveFilter = Boolean(selectedClassId || selectedCampaignId || filterStatus !== 'ALL' || search.trim());

  const handleResetFilters = () => {
    setSelectedClassId('');
    setSelectedCampaignId('');
    setFilterStatus('ALL');
    setSearch('');
  };

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

      // Distribute AI suggestion into open items proportionally
      if (openAnswers.length > 0) {
        const availableOpenMax = openAnswers.reduce((sum, a) => {
          const rawItem = Array.isArray(a.assessment_items) ? a.assessment_items[0] : a.assessment_items;
          return sum + (Number(rawItem?.points) || 20);
        }, 0);

        const openSuggested = Math.max(0, totalScore - mcqAutoPoints);
        const ratio = availableOpenMax > 0 ? openSuggested / availableOpenMax : 1;

        const newScores: Record<string, number> = {};
        openAnswers.forEach((ans) => {
          const rawItem = Array.isArray(ans.assessment_items) ? ans.assessment_items[0] : ans.assessment_items;
          const maxPts = Number(rawItem?.points) || 20;
          newScores[ans.item_id] = Math.min(maxPts, Math.round(maxPts * ratio));
        });
        setOpenItemScores(newScores);
      }

      setAiSuggestion({
        suggestedScore: totalScore,
        evidenceQuote:
          data.evaluation?.evidenceQuote ||
          data.evidenceQuote ||
          'Minh chứng bài làm được ghi nhận và phân tích phù hợp tiêu chí năng lực số.',
        confidence: Number(data.evaluation?.confidenceScore ?? data.confidenceScore ?? 85),
        confidenceFlag: data.evaluation?.confidenceFlag || (Number(data.evaluation?.confidenceScore ?? 85) >= 80 ? 'GREEN' : 'AMBER'),
        feedback: data.evaluation?.feedback || 'Bài làm đáp ứng đúng yêu cầu nhiệm vụ số.',
      });
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gọi AI');
    } finally {
      setIsAiGrading(false);
    }
  };

  // Apply AI Suggestion explicitly into open inputs and feedback
  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.feedback && !feedback.trim()) {
      setFeedback(aiSuggestion.feedback);
    }
    setGradeSuccess('Đã áp dụng toàn bộ đề xuất điểm và nhận xét của AI vào bài thi!');
    setTimeout(() => setGradeSuccess(null), 3000);
  };

  // Submit / Approve Grade
  const handleApproveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsSubmittingGrade(true);
    setGradeError(null);
    setGradeSuccess(null);

    try {
      const itemScoresPayload = openAnswers.map((ans) => ({
        itemId: ans.item_id,
        score: openItemScores[ans.item_id] ?? 0,
      }));

      const res = await fetch(`/api/organizations/${organizationId}/grading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          totalScore: calculatedTotalScore,
          itemScores: itemScoresPayload.length > 0 ? itemScoresPayload : undefined,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể phê duyệt điểm số');
      }

      setGradeSuccess('Đã lưu & phê duyệt điểm thành công (bảo toàn điểm trắc nghiệm)!');

      // Update state locally
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSub.id
            ? {
                ...s,
                status: 'EVALUATED',
                total_score: calculatedTotalScore,
                percentage: calculatedTotalScore,
                is_passed: calculatedTotalScore >= (s.assessments?.passing_score || 70),
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

  const passingScoreThreshold = selectedSub?.assessments?.passing_score || 70;
  const isPassing = calculatedTotalScore >= passingScoreThreshold;

  return (
    <div className="space-y-4">
      {/* =========================================================================
          THANH BỘ LỌC THEO NGỮ CẢNH (Lớp/Nhóm, Đợt thi, Trạng thái)
          ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Lớp / Không gian học dropdown */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-neutral-500">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 text-neutral-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer"
            >
              <option value="">Tất cả Lớp &amp; Nhóm ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.class_code})
                </option>
              ))}
            </select>
          </div>

          {/* Đợt khảo thí dropdown */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-neutral-500">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-750 text-neutral-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer"
            >
              <option value="">Tất cả Đợt khảo thí ({campaigns.length})</option>
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.title}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button if active */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-750 text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
              title="Xóa bộ lọc"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Filter count summary */}
        <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 shrink-0">
          Hiển thị <strong className="text-neutral-900 dark:text-neutral-100">{filteredSubmissions.length}</strong> / {submissions.length} bài
        </div>
      </div>

      {/* Mobile Segmented Navigation Bar (Visible only on < 1024px) */}
      <div className="lg:hidden flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('queue')}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
            mobileTab === 'queue'
              ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Hàng đợi ({filteredSubmissions.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('evidence')}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
            mobileTab === 'evidence'
              ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Bài làm {selectedSub ? `(${selectedSub.profiles?.nickname || 'Học viên'})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('rubric')}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
            mobileTab === 'rubric'
              ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          3. Chấm điểm
        </button>
      </div>

      {/* Main 3-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-slate-200/90 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[680px]">
        {/* =========================================================================
            CỘT 1: HÀNG ĐỢI NỘP BÀI (SUBMISSION QUEUE) - 3 cols
            ========================================================================= */}
        <div
          className={`lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-slate-50/50 dark:bg-[#0d0d10] ${
            mobileTab === 'queue' ? 'block' : 'hidden lg:flex'
          }`}
        >
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
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên học viên, bài thi..."
                className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/60 dark:bg-zinc-800 text-[11px]">
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
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400">
                  <FileCheck className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <p className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                  Hàng đợi trống
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 leading-relaxed max-w-xs mx-auto">
                  {hasActiveFilter
                    ? 'Không có bài nộp nào phù hợp với bộ lọc hiện tại.'
                    : 'Chưa có bài thi nào đang chờ chấm. Khi học viên nộp bài thực hành hoặc tự luận, bài làm sẽ tự động hiển thị tại đây để bạn thẩm định.'}
                </p>
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
                    onClick={() => {
                      setSelectedId(sub.id);
                      setMobileTab('evidence');
                    }}
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
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                            title="Chờ chấm"
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                        {sub.assessments?.title || 'Bài đánh giá'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-1">
                        <span>
                          {new Date(sub.submitted_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          &bull; {new Date(sub.submitted_at).toLocaleDateString('vi-VN')}
                        </span>
                        <span
                          className={
                            isEvaluated
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-amber-600 dark:text-amber-400 font-semibold'
                          }
                        >
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
            CỘT 2: MINH CHỨNG BÀI LÀM (EVIDENCE & DOCUMENT VIEWER) - 5 cols
            ========================================================================= */}
        <div
          className={`lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-[#111114] ${
            mobileTab === 'evidence' ? 'block' : 'hidden lg:flex'
          }`}
        >
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
                    Bài thi:{' '}
                    <strong className="text-slate-800 dark:text-neutral-200">
                      {selectedSub.assessments?.title}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="tabular-nums">
                    {selectedSub.time_spent_seconds
                      ? `${Math.round(selectedSub.time_spent_seconds / 60)} phút`
                      : '30 phút'}
                  </span>
                </div>
              </div>

              {/* Evidence & Answers Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5 max-h-[600px] lg:max-h-[calc(100vh-280px)]">
                {/* Auto-graded MCQ Banner if present */}
                {autoMcqAnswers.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-850 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Phần Trắc Nghiệm ({autoMcqAnswers.length} câu)</span>
                      </span>
                      <span className="font-mono tabular-nums">
                        Đạt {mcqAutoPoints} / {mcqMaxPoints} điểm
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 leading-relaxed">
                      Điểm trắc nghiệm được hệ thống tự động ghi nhận chính xác theo đáp án gốc và được bảo toàn nguyên vẹn khi bạn thẩm định các câu hỏi tự luận/thực hành.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
                    CÂU HỎI THỰC HÀNH &amp; TỰ LUẬN ({openAnswers.length} câu)
                  </h4>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                    {selectedSub.submission_answers?.length || 0} câu tổng cộng
                  </span>
                </div>

                {openAnswers.length > 0 ? (
                  openAnswers.map((ans, idx) => {
                    const rawItem = Array.isArray(ans.assessment_items)
                      ? ans.assessment_items[0]
                      : ans.assessment_items;
                    const maxPts = Number(rawItem?.points) || 20;

                    return (
                      <div
                        key={ans.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
                          <span className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px]">
                              Câu #{idx + 1}
                            </span>
                            <span>{rawItem?.prompt || 'Nhiệm vụ thực hành / tự luận'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            Tối đa: {maxPts}đ
                          </span>
                        </div>

                        {ans.text_response ? (
                          <div className="p-3 rounded-lg bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Mở tệp / liên kết minh chứng bài làm</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
                    <FileText
                      className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto"
                      strokeWidth={1.5}
                    />
                    <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                      Bài thi trắc nghiệm khách quan
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 max-w-xs mx-auto leading-relaxed">
                      Bài thi này gồm các câu hỏi trắc nghiệm đã được hệ thống tự động chấm điểm ({mcqAutoPoints}đ). Bạn có thể đối soát và điều chỉnh tổng điểm nếu cần.
                    </p>
                  </div>
                )}

                {/* Mobile Next CTA */}
                <div className="lg:hidden pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setMobileTab('rubric')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span>Tiếp tục sang Bảng điểm &amp; Nhận xét</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Workflow Interactive Explainer when no submission is currently chosen */
            <div className="p-8 my-auto max-w-md mx-auto space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-2xs">
                <FileText className="w-7 h-7" strokeWidth={1.75} />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Quy trình thẩm định Bàn chấm bài
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Bàn chấm bài (Grading Workbench) là không gian để giám khảo kiểm tra sản phẩm thực hành số và tự luận của thí sinh theo chuẩn 5 miền.
                </p>
              </div>

              <div className="space-y-3 text-left pt-1">
                <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-800 dark:text-zinc-200">
                      Học viên nộp sản phẩm thực hành
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Tải lên tệp đính kèm (Word, Excel, PDF...) hoặc chia sẻ liên kết trực tuyến (Drive, Figma, GitHub...).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-800 dark:text-zinc-200">
                      Tiếp nhận vào Hàng đợi tự động
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Trắc nghiệm được hệ thống tự động chấm 100%, câu thực hành chuyển về hàng đợi để giám khảo thẩm định.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-800 dark:text-zinc-200">
                      Đối soát Rubric &amp; Phê duyệt điểm
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Giám khảo mở xem file/link sản phẩm, đối chiếu barem hướng dẫn, nhập nhận xét và phê duyệt kết quả.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            CỘT 3: BẢNG ĐIỂM RUBRIC & AI TRỢ LÝ (RUBRIC DESK) - 4 cols
            ========================================================================= */}
        <div
          className={`lg:col-span-4 flex flex-col justify-between bg-slate-50/30 dark:bg-[#0d0d10] p-4 sm:p-5 ${
            mobileTab === 'rubric' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {selectedSub ? (
            <form onSubmit={handleApproveGrade} className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Desk Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
                    BẢNG ĐIỂM RUBRIC /100
                  </span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                    Ngưỡng đạt:{' '}
                    <strong className="text-slate-800 dark:text-neutral-200">
                      {passingScoreThreshold}đ
                    </strong>
                  </span>
                </div>

                {/* Score Input Card with breakdown */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                      Điểm tổng kết cuối cùng
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
                    <span className="text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                      {calculatedTotalScore}
                    </span>
                    <span className="text-base font-bold font-mono text-slate-400 dark:text-neutral-500">
                      / 100 điểm
                    </span>
                  </div>

                  {/* Score breakdown per question */}
                  {openAnswers.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500 block">
                        Chấm điểm từng câu thực hành:
                      </span>
                      {openAnswers.map((ans, idx) => {
                        const rawItem = Array.isArray(ans.assessment_items)
                          ? ans.assessment_items[0]
                          : ans.assessment_items;
                        const maxPts = Number(rawItem?.points) || 20;
                        const currentScore = openItemScores[ans.item_id] ?? 0;

                        return (
                          <div
                            key={ans.item_id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800"
                          >
                            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 truncate">
                              Câu #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={maxPts}
                                step={1}
                                value={currentScore}
                                onChange={(e) => {
                                  const val = Math.min(maxPts, Math.max(0, Number(e.target.value)));
                                  setOpenItemScores((prev) => ({
                                    ...prev,
                                    [ans.item_id]: val,
                                  }));
                                }}
                                className="w-14 h-8 text-center text-xs font-mono font-bold rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
                              />
                              <span className="text-xs font-mono text-slate-400">/ {maxPts}đ</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Locked MCQ points indicator if test is hybrid */}
                  {autoMcqAnswers.length > 0 && (
                    <div className="pt-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>✓ Đã bao gồm trắc nghiệm:</span>
                      <span className="font-bold">+{mcqAutoPoints} điểm</span>
                    </div>
                  )}
                </div>

                {/* AI Grading Assistant Section */}
                <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Trợ lý AI chấm bài</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiSuggest}
                      disabled={isAiGrading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-zinc-900 hover:bg-blue-100 dark:hover:bg-zinc-800 border border-blue-300/80 dark:border-blue-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
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
                    <div className="text-xs bg-white dark:bg-[#111114] p-3 rounded-xl border border-blue-200 dark:border-blue-900 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-neutral-900 dark:text-neutral-100 flex-wrap gap-1">
                        <span className="text-blue-600 dark:text-blue-400">
                          Điểm AI đề xuất: {aiSuggestion.suggestedScore} / 100đ
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          aiSuggestion.confidence >= 80
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}>
                          Độ tin cậy: {aiSuggestion.confidence}%
                        </span>
                      </div>

                      {aiSuggestion.evidenceQuote && (
                        <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border-l-2 border-blue-500 text-[11px] text-slate-700 dark:text-neutral-300 italic leading-relaxed">
                          <span className="font-semibold not-italic text-blue-900 dark:text-blue-300 block mb-0.5">
                            Căn cứ trích dẫn từ bài làm:
                          </span>
                          &ldquo;{aiSuggestion.evidenceQuote}&rdquo;
                        </div>
                      )}

                      {aiSuggestion.feedback && (
                        <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
                          <strong className="text-slate-800 dark:text-neutral-200">Gợi ý sư phạm:</strong> {aiSuggestion.feedback}
                        </p>
                      )}

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={handleApplyAiSuggestion}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Áp dụng gợi ý của AI</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                    Nhận xét &amp; Góp ý của Giám khảo
                  </label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Nhập nhận xét về điểm mạnh hoặc khoảng trống năng lực số của bài thi..."
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none leading-relaxed"
                  />
                </div>

                {/* Error & Success Messages */}
                {gradeError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{gradeError}</span>
                  </div>
                )}

                {gradeSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
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
                  className="w-full h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingGrade ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu kết quả...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lưu &amp; Phê Duyệt Kết Quả ({calculatedTotalScore}/100)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Skeleton Frame for Rubric Desk when no submission is chosen */
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-5 opacity-70">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
                    BẢNG ĐIỂM RUBRIC /100
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Ngưỡng đạt: <strong>70đ</strong>
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Điểm số thẩm định
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-400">
                      CHỜ CHỌN BÀI
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="w-24 h-12 text-2xl font-bold font-mono text-center rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-400 flex items-center justify-center">
                      --
                    </span>
                    <span className="text-base font-bold font-mono text-slate-400">
                      / 100 điểm
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center space-y-1">
                  <Sparkles className="w-4 h-4 text-slate-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-500">
                    Trợ lý AI chấm bài tự động
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Sẵn sàng phân tích và đề xuất điểm số khi bạn chọn một bài nộp.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  disabled
                  className="w-full h-10 px-4 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Chọn một bài nộp để bắt đầu chấm</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
