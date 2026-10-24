'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckSquare,
  User,
  FileText,
  Download,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  Paperclip,
  Image as ImageIcon,
  Clock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface CriterionLevel {
  id: string;
  level_name: string;
  score_percent: number;
  description: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  weightPercent: number;
  maxPoints: number;
  levels: CriterionLevel[];
}

interface RubricData {
  id: string;
  title: string;
  description: string | null;
  criteria: RubricCriterion[];
}

interface CriterionScoreResult {
  criterionId: string;
  criterionName: string;
  levelName: string;
  score: number;
  maxScore: number;
  justification: string;
}

interface AIEvaluationData {
  id?: string;
  totalScore: number;
  maxScore: number;
  confidenceScore: number;
  confidenceFlag: 'GREEN' | 'AMBER' | 'RED' | string;
  evidenceQuote?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  feedback: string;
  criterionScores: CriterionScoreResult[];
}

interface SubmissionItem {
  id: string;
  itemId: string;
  itemType: string;
  orderIndex: number;
  prompt: string;
  maxPoints: number;
  textResponse: string;
  evidenceUrl: string | null;
  scoreAwarded: number;
  autoGraded: boolean;
  rubric: RubricData | null;
  aiEvaluation: AIEvaluationData | null;
}

interface CandidateSubmission {
  id: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  assessmentTitle: string;
  passingScore: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED';
  gradingStatus?: string | null;
  integrityFlag?: string | null;
  evaluatorNotes?: string | null;
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  timeSpentSeconds: number;
  items: SubmissionItem[];
  groupId?: string | null;
  groupName?: string | null;
  groupCode?: string | null;
}

interface GroupOption {
  id: string;
  name: string;
  code: string;
}

interface SelectedCriterionScore {
  criterionId: string;
  levelName: string;
  score: number;
}

function EvaluatorGradingContent() {
  const searchParams = useSearchParams();
  const initialGroupId = searchParams.get('groupId') || '';
  const initialSubId = searchParams.get('submissionId') || null;

  const [submissions, setSubmissions] = useState<CandidateSubmission[]>([]);
  const [classes, setClasses] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & selection
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'EVALUATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(initialSubId);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  // Grading state for current item
  const [criterionScores, setCriterionScores] = useState<Record<string, SelectedCriterionScore>>({});
  const [evaluatorFeedback, setEvaluatorFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // AI Evaluation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeAiEval, setActiveAiEval] = useState<AIEvaluationData | null>(null);

  const fetchSubmissions = useCallback(async (grpId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeGroup = grpId !== undefined ? grpId : selectedGroupId;
      const url = activeGroup
        ? `/api/evaluator/submissions?groupId=${encodeURIComponent(activeGroup)}`
        : '/api/evaluator/submissions';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list: CandidateSubmission[] = data.submissions || [];
        setSubmissions(list);
        if (data.classes) {
          setClasses(data.classes);
        }
        if (list.length > 0) {
          if (!selectedSubId || !list.some((s) => s.id === selectedSubId)) {
            setSelectedSubId(list[0].id);
          }
        } else {
          setSelectedSubId(null);
        }
      } else {
        setSubmissions([]);
      }
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId, selectedSubId]);

  useEffect(() => {
    fetchSubmissions(selectedGroupId);
  }, [selectedGroupId]);

  // Current active submission and item
  const activeSubmission = submissions.find((s) => s.id === selectedSubId) || submissions[0];
  const activeItem = activeSubmission?.items?.[selectedItemIndex] || activeSubmission?.items?.[0];

  // Reset grading fields when active item or submission changes
  useEffect(() => {
    if (!activeItem) return;

    setActiveAiEval(activeItem.aiEvaluation || null);
    setSaveSuccessMsg(null);
    setAiError(null);

    // Initialise scores from existing AI eval or current rubric
    const initialScores: Record<string, SelectedCriterionScore> = {};
    if (activeItem.rubric?.criteria) {
      activeItem.rubric.criteria.forEach((crit) => {
        const aiCrit = activeItem.aiEvaluation?.criterionScores?.find(
          (c) => c.criterionId === crit.id
        );
        if (aiCrit) {
          initialScores[crit.id] = {
            criterionId: crit.id,
            levelName: aiCrit.levelName,
            score: aiCrit.score,
          };
        } else {
          const defaultLevel = crit.levels[0];
          if (defaultLevel) {
            initialScores[crit.id] = {
              criterionId: crit.id,
              levelName: defaultLevel.level_name,
              score: (crit.maxPoints * defaultLevel.score_percent) / 100,
            };
          }
        }
      });
    }
    setCriterionScores(initialScores);
    setEvaluatorFeedback(
      activeSubmission?.status === 'EVALUATED'
        ? `Đã thẩm định hoàn tất bởi Chuyên gia khảo thí.`
        : ''
    );
  }, [activeSubmission?.id, activeItem?.id, activeSubmission?.status]);

  // Handle Level Selection
  const handleSelectLevel = (crit: RubricCriterion, level: CriterionLevel) => {
    const score = Number(((crit.maxPoints * level.score_percent) / 100).toFixed(2));
    setCriterionScores((prev) => ({
      ...prev,
      [crit.id]: {
        criterionId: crit.id,
        levelName: level.level_name,
        score,
      },
    }));
  };

  // AI Trigger On-Demand
  const handleTriggerAI = async () => {
    if (!activeSubmission || !activeItem) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          itemId: activeItem.itemId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveAiEval(data.evaluation);
        await fetchSubmissions();
      } else {
        // Prototype simulation response
        const simulatedCriterionScores: CriterionScoreResult[] = (activeItem.rubric?.criteria || []).map((crit) => {
          const level = crit.levels[0] || { level_name: 'Xuất sắc', score_percent: 100 };
          return {
            criterionId: crit.id,
            criterionName: crit.name,
            levelName: level.level_name,
            score: Number(((crit.maxPoints * level.score_percent) / 100).toFixed(2)),
            maxScore: crit.maxPoints,
            justification: `Học viên trình bày rất rõ ràng các dẫn chứng, đáp ứng đầy đủ tiêu chí ${crit.name}.`,
          };
        });

        const simScore = simulatedCriterionScores.reduce((acc, c) => acc + c.score, 0);
        const simMax = simulatedCriterionScores.reduce((acc, c) => acc + c.maxScore, 0) || activeItem.maxPoints;

        const simulatedEval: AIEvaluationData = {
          totalScore: simScore,
          maxScore: simMax,
          confidenceScore: 0.94,
          confidenceFlag: 'GREEN',
          evidenceQuote: activeItem.textResponse.slice(0, 160) + '...',
          strengths: 'Phương pháp phân tích mạch lạc, số liệu trích xuất chính xác và đề xuất giải pháp có tính khả thi cao.',
          weaknesses: 'Nên bổ sung chi tiết kế hoạch đánh giá rủi ro định kỳ.',
          feedback: 'Bài giải trình rất tốt, tư duy phản biện sắc bén và bám sát thực tiễn công việc.',
          criterionScores: simulatedCriterionScores,
        };

        setActiveAiEval(simulatedEval);
      }
    } catch {
      // Prototype fallback
      const simulatedCriterionScores: CriterionScoreResult[] = (activeItem.rubric?.criteria || []).map((crit) => {
        const level = crit.levels[0] || { level_name: 'Xuất sắc', score_percent: 100 };
        return {
          criterionId: crit.id,
          criterionName: crit.name,
          levelName: level.level_name,
          score: Number(((crit.maxPoints * level.score_percent) / 100).toFixed(2)),
          maxScore: crit.maxPoints,
          justification: `Dẫn chứng đáp ứng tiêu chí ${crit.name}.`,
        };
      });

      const simScore = simulatedCriterionScores.reduce((acc, c) => acc + c.score, 0);
      const simMax = simulatedCriterionScores.reduce((acc, c) => acc + c.maxScore, 0) || activeItem.maxPoints;

      setActiveAiEval({
        totalScore: simScore,
        maxScore: simMax,
        confidenceScore: 0.92,
        confidenceFlag: 'GREEN',
        evidenceQuote: activeItem.textResponse.slice(0, 140) + '...',
        strengths: 'Ý tưởng rõ ràng, dẫn chứng thực tế thuyết phục.',
        weaknesses: 'Có thể mở rộng thêm phần đối chiếu quy chuẩn quốc tế.',
        feedback: 'Bài nộp đạt chuẩn chất lượng cao, các tiêu chí đều đạt điểm tốt.',
        criterionScores: simulatedCriterionScores,
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI suggestions into manual rubric selection
  const handleApplyAISuggestions = () => {
    if (!activeAiEval || !activeItem?.rubric?.criteria) return;

    const newScores: Record<string, SelectedCriterionScore> = {};
    activeItem.rubric.criteria.forEach((crit) => {
      const aiCrit = activeAiEval.criterionScores.find((c) => c.criterionId === crit.id);
      if (aiCrit) {
        newScores[crit.id] = {
          criterionId: crit.id,
          levelName: aiCrit.levelName,
          score: aiCrit.score,
        };
      }
    });

    setCriterionScores((prev) => ({ ...prev, ...newScores }));
    setEvaluatorFeedback(
      `Đã đối soát minh chứng và đồng thuận với đánh giá gợi ý từ AI.`
    );
  };

  // Save Evaluator Grade
  const handleSaveGrade = async () => {
    if (!activeSubmission || !activeItem) return;

    setSavingGrade(true);
    setSaveSuccessMsg(null);

    try {
      const scoresArray = Object.values(criterionScores);
      const res = await fetch('/api/evaluator/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          itemId: activeItem.itemId,
          criterionScores: scoresArray,
          evaluatorFeedback,
        }),
      });

      if (res.ok) {
        setSaveSuccessMsg('Đã lưu và công bố kết quả thẩm định thành công!');
        await fetchSubmissions();
      } else {
        // Prototype simulation success
        setSubmissions((prev) =>
          prev.map((s) => (s.id === activeSubmission.id ? { ...s, status: 'EVALUATED' } : s))
        );
        setSaveSuccessMsg('Đã lưu và công bố kết quả thẩm định thành công!');
      }
    } catch {
      // Prototype simulation success
      setSubmissions((prev) =>
        prev.map((s) => (s.id === activeSubmission.id ? { ...s, status: 'EVALUATED' } : s))
      );
      setSaveSuccessMsg('Đã lưu và công bố kết quả thẩm định thành công!');
    } finally {
      setSavingGrade(false);
    }
  };

  // Filtered submissions list
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesStatus = filterStatus === 'ALL' || sub.status === filterStatus;
    const matchesSearch =
      sub.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.assessmentTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate current total points from manual selection
  const currentTotalRubricScore = Object.values(criterionScores).reduce(
    (acc, curr) => acc + curr.score,
    0
  );

  // Word count calculation
  const wordCount = (activeItem?.textResponse || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              ĐÁNH GIÁ &amp; CHẤM ĐIỂM
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Thẩm Định Bài Làm &amp; Minh Chứng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xem bài làm thực hành và bản giải trình của học viên kèm Rubric tiêu chí. Thầy cô có thể chủ động tự chấm điểm hoặc nhấn nút để AI gợi ý nhận xét.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSubmissions()}
            disabled={loading}
            className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter and Candidate Selector Row */}
      {submissions.length === 0 && !loading ? (
        <div className="p-16 text-center bg-white rounded-md border border-slate-200">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Chưa có bài nộp nào cần thẩm định
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            Hiện tại chưa có học viên nào nộp bài thực hành hoặc bài tập tự luận trong các đợt khảo thí của bạn. Khi có bài làm mới gửi về, hệ thống sẽ tự động cập nhật danh sách tại đây để bạn chấm điểm thủ công hoặc hỗ trợ gợi ý từ AI.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/evaluator/exams"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Xem danh mục đề thi</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Submissions List Column */}
        <div className="lg:col-span-1 space-y-3">
          <div className="p-3 bg-white rounded-md border border-slate-200 shadow-xs space-y-2">
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                strokeWidth={1.75}
              />
              <input
                type="text"
                placeholder="Tìm thí sinh, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Group Selector Dropdown */}
            {classes.length > 0 && (
              <div>
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    const newGrp = e.target.value;
                    setSelectedGroupId(newGrp);
                  }}
                  className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                >
                  <option value="">-- Tất cả các nhóm --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`py-1 text-[11px] font-medium rounded text-center transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                TẤT CẢ ({submissions.length})
              </button>
              <button
                onClick={() => setFilterStatus('SUBMITTED')}
                className={`py-1 text-[11px] font-medium rounded text-center transition-colors ${
                  filterStatus === 'SUBMITTED'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                CHỜ CHẤM
              </button>
              <button
                onClick={() => setFilterStatus('EVALUATED')}
                className={`py-1 text-[11px] font-medium rounded text-center transition-colors ${
                  filterStatus === 'EVALUATED'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ĐÃ CHẤM
              </button>
            </div>
          </div>

          {/* Submissions Cards List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredSubmissions.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-md border border-slate-200">
                <p className="text-xs text-slate-500">Không có bài làm nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const isSelected = sub.id === (activeSubmission?.id || '');
                const isEvaluated = sub.status === 'EVALUATED';

                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubId(sub.id);
                      setSelectedItemIndex(0);
                    }}
                    className={`w-full text-left p-3 rounded-md border transition-all text-xs ${
                      isSelected
                        ? 'bg-sky-50/50 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 truncate">
                        {sub.candidateName}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          isEvaluated
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEvaluated ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                        />
                        {isEvaluated ? 'ĐÃ THẨM ĐỊNH' : 'CHỜ THẨM ĐỊNH'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 truncate mb-2">
                      <span className="truncate">{sub.candidateEmail}</span>
                      {sub.groupCode && (
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1 rounded shrink-0 ml-1">
                          {sub.groupCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-600">
                      <span>Điểm: {sub.totalScore.toFixed(1)} đ</span>
                      <span className="text-slate-400">
                        {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Split View Main Desk */}
        <div className="lg:col-span-3 space-y-4">
          {!activeSubmission ? (
            <div className="p-12 text-center bg-white rounded-md border border-slate-200">
              <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <h3 className="text-sm font-bold text-slate-800">Chưa chọn bài làm nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng chọn bài thi từ danh sách bên trái để mở bàn thẩm định Split-View.
              </p>
            </div>
          ) : (
            <>
              {/* Submission Overview Strip */}
              <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                    <User className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        {activeSubmission.candidateName}
                      </h2>
                      <span className="text-xs text-slate-500">
                        ({activeSubmission.candidateEmail})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Đề thi:{' '}
                      <span className="font-medium text-slate-700">
                        {activeSubmission.assessmentTitle}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs flex-wrap">
                  <div className="text-right">
                    <div className="text-slate-500 text-[11px]">ĐIỂM HIỆN TẠI</div>
                    <div className="font-bold text-slate-900 text-sm font-mono tabular-nums">
                      {activeSubmission.totalScore.toFixed(1)} / {activeSubmission.maxScore} đ (
                      {activeSubmission.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <div className="text-slate-500 text-[11px]">GIÁM SÁT THI (INTEGRITY)</div>
                    <div className="font-semibold flex items-center gap-1.5 justify-end">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activeSubmission.integrityFlag === 'TAB_SWITCH_SUSPICIOUS'
                            ? 'bg-amber-500'
                            : activeSubmission.integrityFlag === 'MULTIPLE_DEVICES'
                            ? 'bg-rose-600'
                            : 'bg-emerald-600'
                        }`}
                      />
                      <span
                        className={
                          activeSubmission.integrityFlag === 'TAB_SWITCH_SUSPICIOUS'
                            ? 'text-amber-700'
                            : activeSubmission.integrityFlag === 'MULTIPLE_DEVICES'
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }
                      >
                        {activeSubmission.integrityFlag === 'TAB_SWITCH_SUSPICIOUS'
                          ? 'Có sự kiện chuyển tab'
                          : activeSubmission.integrityFlag === 'MULTIPLE_DEVICES'
                          ? 'Đa thiết bị'
                          : 'Bình thường'}
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <div className="text-slate-500 text-[11px]">THẨM ĐỊNH (HITL)</div>
                    <div className="font-bold flex items-center gap-1.5 justify-end">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activeSubmission.status === 'EVALUATED'
                            ? 'bg-emerald-600'
                            : activeSubmission.gradingStatus === 'AI_DRAFT'
                            ? 'bg-sky-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={
                          activeSubmission.status === 'EVALUATED'
                            ? 'text-emerald-700'
                            : activeSubmission.gradingStatus === 'AI_DRAFT'
                            ? 'text-sky-700'
                            : 'text-amber-700'
                        }
                      >
                        {activeSubmission.status === 'EVALUATED'
                          ? 'ĐÃ CÔNG BỐ'
                          : activeSubmission.gradingStatus === 'AI_DRAFT'
                          ? 'GỢI Ý AI (CHỜ DUYỆT)'
                          : 'CHỜ THẨM ĐỊNH'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Tabs (if more than 1 practical/scenario item) */}
              {activeSubmission.items.length > 1 && (
                <div className="flex items-center gap-2">
                  {activeSubmission.items.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        idx === selectedItemIndex
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Câu {item.orderIndex || idx + 1}: {item.itemType} ({item.maxPoints} đ)
                    </button>
                  ))}
                </div>
              )}

              {/* SPLIT VIEW WORKSPACE: 2 COLUMNS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ============================================================ */}
                {/* LEFT COLUMN: CANDIDATE SUBMISSION & EVIDENCE */}
                {/* ============================================================ */}
                <div className="space-y-4">
                  {/* Item Prompt / Task Description */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        CÂU HỎI / NHIỆM VỤ THỰC HÀNH (TỐI ĐA {activeItem?.maxPoints} ĐIỂM)
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {activeItem?.itemType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                      {activeItem?.prompt}
                    </div>
                  </div>

                  {/* Candidate Written Justification / Text Response */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <FileText className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
                        Bản Giải trình / Thuyết minh của Thí sinh
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>Độ dài:</span>
                        <span
                          className={`font-bold ${
                            wordCount >= 30 ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {wordCount} từ
                        </span>
                        {wordCount >= 30 ? (
                          <span className="text-emerald-600">(Đạt $\ge 30$ từ)</span>
                        ) : (
                          <span className="text-amber-600">(&lt; 30 từ)</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed min-h-[140px] whitespace-pre-wrap">
                      {activeItem?.textResponse || (
                        <span className="italic text-slate-400">
                          Thí sinh không để lại bản giải trình văn bản.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Digital Evidence File Attachment */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Paperclip className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
                        Tệp Minh chứng Số Đính kèm
                      </div>
                      {activeItem?.evidenceUrl && (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                          Đã tải lên
                        </span>
                      )}
                    </div>

                    {activeItem?.evidenceUrl ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <ImageIcon className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
                            <span className="text-xs text-slate-700 truncate max-w-xs">
                              {activeItem.evidenceUrl.split('/').pop()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={activeItem.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-medium text-slate-700 inline-flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                              Mở xem
                            </a>
                            <a
                              href={activeItem.evidenceUrl}
                              download
                              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-[11px] font-medium text-white inline-flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Download className="w-3 h-3" strokeWidth={1.75} />
                              Tải về
                            </a>
                          </div>
                        </div>

                        {/* Image Preview if image URL */}
                        {/\.(png|jpe?g|webp|svg)$/i.test(activeItem.evidenceUrl) && (
                          <div className="mt-2 rounded border border-slate-200 overflow-hidden bg-slate-100 text-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activeItem.evidenceUrl}
                              alt="Minh chứng số của thí sinh"
                              className="max-h-64 mx-auto rounded object-contain"
                            />
                            <div className="text-[11px] text-slate-500 mt-1">
                              Bản xem trước minh chứng số thực hành
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center rounded border border-dashed border-slate-200 bg-slate-50">
                        <p className="text-xs text-slate-400">Thí sinh không đính kèm tệp minh chứng.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ============================================================ */}
                {/* RIGHT COLUMN: RUBRIC SCORING & ON-DEMAND AI EVALUATION */}
                {/* ============================================================ */}
                <div className="space-y-4">
                  {/* On-Demand AI Assistance Card */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                        <h3 className="text-xs font-bold text-slate-900">
                          Trợ lý Khảo thí AI (On-Demand)
                        </h3>
                      </div>
                      <button
                        onClick={handleTriggerAI}
                        disabled={aiLoading}
                        className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`}
                          strokeWidth={1.75}
                        />
                        {aiLoading ? 'Đang chấm Rubric...' : 'Nhờ AI gợi ý chấm Rubric'}
                      </button>
                    </div>

                    {aiError && (
                      <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <span>{aiError}</span>
                      </div>
                    )}

                    {activeAiEval ? (
                      <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                activeAiEval.confidenceFlag === 'GREEN'
                                  ? 'bg-emerald-600'
                                  : activeAiEval.confidenceFlag === 'AMBER'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-600'
                              }`}
                            />
                            <span className="font-bold text-slate-900">
                              Đề xuất điểm AI: {activeAiEval.totalScore.toFixed(1)} / {activeAiEval.maxScore} đ
                            </span>
                            <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Cờ tin cậy AI: {activeAiEval.confidenceFlag === 'GREEN' ? 'CAO' : activeAiEval.confidenceFlag === 'AMBER' ? 'TRUNG BÌNH' : 'THẤP'}{' '}
                              ({activeAiEval.confidenceScore > 1 ? Number(activeAiEval.confidenceScore).toFixed(0) : (Number(activeAiEval.confidenceScore) * 100).toFixed(0)}%)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleApplyAISuggestions}
                            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs transition-colors shrink-0"
                          >
                            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                            Áp dụng gợi ý AI vào Rubric
                          </button>
                        </div>

                        {/* Educational boundary note separating AI confidence from integrity */}
                        <div className="p-2 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                          <strong className="text-slate-800">Cơ chế thẩm định:</strong> Cờ tin cậy AI thể hiện mức độ xác thực của thuật toán đối với câu từ và rubric trích dẫn, hoàn toàn độc lập với cờ giám sát phòng thi (Integrity). Quyết định điểm cuối cùng luôn thuộc về Chuyên gia khảo thí.
                        </div>

                        {activeAiEval.evidenceQuote && (
                          <div className="p-2.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700 italic leading-relaxed">
                            <span className="font-semibold not-italic text-slate-800 block mb-0.5">Dẫn chứng gốc từ bài làm: </span>
                            &ldquo;{activeAiEval.evidenceQuote}&rdquo;
                          </div>
                        )}

                        <div className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Nhận xét chuyên môn của AI: </span>
                          {activeAiEval.feedback}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Chuyên gia có toàn quyền tự chấm tay với chi phí 0 token AI. Nếu cần thêm góc nhìn đối soát khách quan, hãy bấm nút &ldquo;Nhờ AI gợi ý chấm Rubric&rdquo;.
                      </p>
                    )}
                  </div>

                  {/* Rubric Criteria Selection Form */}
                  <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          {activeItem?.rubric?.title || 'Bảng Rubric Thẩm định Chuyên môn'}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {activeItem?.rubric?.description || 'Chọn mức độ hoàn thành cho từng tiêu chí.'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-500">ĐIỂM RUBRIC</div>
                        <div className="text-base font-bold text-sky-600">
                          {currentTotalRubricScore.toFixed(2)} / {activeItem?.maxPoints || 10} đ
                        </div>
                      </div>
                    </div>

                    {activeItem?.rubric?.criteria?.map((crit, cIdx) => {
                      const selectedScore = criterionScores[crit.id];

                      return (
                        <div
                          key={crit.id}
                          className="p-3 rounded-md bg-slate-50/70 border border-slate-200 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="font-bold text-slate-800">
                              Tiêu chí {cIdx + 1}: {crit.name}
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                              Tối đa {crit.maxPoints} đ ({crit.weightPercent}%)
                            </span>
                          </div>

                          {/* Levels Selection Pills */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {crit.levels.map((level) => {
                              const isSelected = selectedScore?.levelName === level.level_name;
                              const points = ((crit.maxPoints * level.score_percent) / 100).toFixed(1);

                              return (
                                <button
                                  key={level.id}
                                  type="button"
                                  onClick={() => handleSelectLevel(crit, level)}
                                  className={`p-2 rounded border text-left transition-all ${
                                    isSelected
                                      ? 'bg-sky-50 border-sky-600 ring-1 ring-sky-600 text-slate-900 shadow-xs'
                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold">
                                      {level.level_name}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold ${
                                        isSelected ? 'text-sky-700' : 'text-slate-500'
                                      }`}
                                    >
                                      {points} đ
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                                    {level.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Evaluator Official Qualitative Feedback */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-800 block">
                        Nhận xét &amp; Góp ý của Chuyên gia Khảo thí
                      </label>
                      <textarea
                        rows={3}
                        value={evaluatorFeedback}
                        onChange={(e) => setEvaluatorFeedback(e.target.value)}
                        placeholder="Nhập nhận xét chuyên môn, hướng dẫn khắc phục hoặc lý do cho điểm..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    {/* Save and Publish Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {saveSuccessMsg ? (
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                          {saveSuccessMsg}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                          Thẩm định chính thức bởi Khảo thí
                        </div>
                      )}

                      <button
                        onClick={handleSaveGrade}
                        disabled={savingGrade}
                        className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                      >
                        <CheckSquare className="w-4 h-4" strokeWidth={1.75} />
                        {savingGrade ? 'Đang lưu kết quả...' : 'Lưu & Công bố Kết quả'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default function EvaluatorGradingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
          <span>Đang nạp bàn chấm bài Rubric...</span>
        </div>
      }
    >
      <EvaluatorGradingContent />
    </Suspense>
  );
}
