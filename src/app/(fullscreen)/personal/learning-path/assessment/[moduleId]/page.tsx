'use client';

import React, { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  Trophy,
  Award,
  BookOpen,
  RotateCcw,
  Sparkles,
  Lock,
  Loader2,
  Check,
  HelpCircle,
  AlertCircle,
  FileText,
  Upload,
  Paperclip,
  Flag,
  Trash2,
  ExternalLink,
  Lightbulb,
  CheckSquare,
  Eye,
  Info,
} from 'lucide-react';

interface QuestionOption {
  id: string;
  content: string;
  order_index?: number;
  isCorrect?: boolean;
  explanation?: string | null;
}

interface QuestionItem {
  id: string;
  type: string;
  prompt: string;
  points: number;
  orderIndex: number;
  rubricGuide?: string | null;
  options: QuestionOption[];
}

interface ModuleInfo {
  id: string;
  title: string;
  description?: string;
  contentMarkdown?: string;
  orderIndex?: number;
  domainCode: string;
  skillCode: string;
  durationMinutes: number;
  pointReward: number;
  passingScore: number;
  securitySettings?: Record<string, any>;
}

interface PracticalSubmission {
  fileName?: string;
  fileSize?: string;
  evidenceUrl?: string;
  textResponse?: string;
  liveUrl?: string;
}

interface BreakdownItem {
  itemId: string;
  prompt: string;
  userSelectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  explanation: string;
}

interface SubmitResult {
  isPassed: boolean;
  percentage: number;
  passingScore: number;
  score: number;
  totalPoints: number;
  pointsAwarded: number;
  domainScoreIncremented: number;
  breakdown: BreakdownItem[];
  tabSwitchCount: number;
}

interface CandidateInfo {
  name: string;
  email: string;
}

// Clean markdown parser helper that transforms raw symbols (#, ###, **) into clean styled SaaS elements
function renderFormattedMarkdown(markdownText: string) {
  if (!markdownText) return null;
  const lines = markdownText.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { title: string; desc: string }[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <div key={`list-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
          {currentList.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 text-xs space-y-1.5 shadow-2xs"
            >
              <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                <span>{item.title}</span>
              </div>
              {item.desc && (
                <p className="text-slate-600 dark:text-neutral-300 leading-relaxed pl-3.5">
                  {item.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
      flushList();
      const text = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h3
          key={`h2-${idx}`}
          className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-3 mb-1 flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-xs bg-blue-600 dark:bg-blue-400" />
          <span>{text}</span>
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      const text = trimmed.replace(/^###\s*/, '');
      elements.push(
        <h4
          key={`h3-${idx}`}
          className="text-xs font-semibold text-neutral-800 dark:text-zinc-200 mt-2 mb-1"
        >
          {text}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2).trim();
      const match = content.match(/^\*\*(.*?)\*\*:(.*)$/);
      if (match) {
        currentList.push({
          title: match[1].trim(),
          desc: match[2].trim(),
        });
      } else {
        const cleanContent = content.replace(/\*\*/g, '');
        currentList.push({
          title: cleanContent,
          desc: '',
        });
      }
      return;
    }

    flushList();
    elements.push(
      <p
        key={`p-${idx}`}
        className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed my-1"
      >
        {trimmed.replace(/\*\*/g, '')}
      </p>
    );
  });

  flushList();
  return elements;
}

function DonutScoreChart({
  percentage,
  isPassed,
  score,
  totalPoints,
}: {
  percentage: number;
  isPassed: boolean;
  score: number;
  totalPoints: number;
}) {
  const radius = 64;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-slate-100 dark:text-zinc-800"
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={`transition-all duration-1000 ease-out ${
            isPassed ? 'text-emerald-500' : 'text-blue-600'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-mono font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
          {percentage}%
        </span>
        <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 mt-0.5">
          {score}/{totalPoints} đ
        </span>
      </div>
    </div>
  );
}

export default function LearningPathAssessmentPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = use(params);
  const router = useRouter();

  // Test data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    name: 'Thí sinh',
    email: '',
  });
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [practicalAnswers, setPracticalAnswers] = useState<Record<string, PracticalSubmission>>({});
  const [flaggedItems, setFlaggedItems] = useState<Set<string>>(new Set());
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [instantFeedback, setInstantFeedback] = useState<
    Record<string, { isCorrect: boolean; correctOptionId: string | null; explanation: string }>
  >({});

  // Timer states
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Proctoring / Anti-cheat states
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [floatingWarning, setFloatingWarning] = useState<string | null>(null);
  const [proctoringNotice, setProctoringNotice] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);

  // Submission & Result states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [solutionMap, setSolutionMap] = useState<
    Record<string, { correctOptionId: string; explanation: string }>
  >({});

  const isSubmittingRef = useRef<boolean>(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const practicalAnswersRef = useRef(practicalAnswers);
  practicalAnswersRef.current = practicalAnswers;
  const tabSwitchCountRef = useRef(tabSwitchCount);
  tabSwitchCountRef.current = tabSwitchCount;
  const timeSpentSecondsRef = useRef(timeSpentSeconds);
  timeSpentSecondsRef.current = timeSpentSeconds;

  // File input ref for practical tasks
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch test questions
  const fetchAssessmentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/personal/learning-path/assessment/${moduleId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể tải đề kiểm chứng');
      }

      setModuleInfo(data.module);
      setItems(data.items || []);
      if (data.solutionMap) {
        setSolutionMap(data.solutionMap);
      }
      if (data.candidate) {
        setCandidateInfo(data.candidate);
      }

      if (data.isOnCooldown && data.cooldownRemainingSeconds > 0) {
        setCooldownRemaining(data.cooldownRemainingSeconds);
      } else {
        const totalSec = (data.module.durationMinutes || 15) * 60;
        setTimeLeftSeconds(totalSec);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchAssessmentData();
  }, [fetchAssessmentData]);

  // Submit test handler
  const handleSubmitTest = useCallback(
    async (isAutoSubmit = false) => {
      if (isSubmittingRef.current || submitResult) return;
      isSubmittingRef.current = true;
      setSubmitting(true);
      setShowSubmitConfirmModal(false);

      try {
        const res = await fetch('/api/personal/learning-path/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId,
            answers: answersRef.current,
            practicalAnswers: practicalAnswersRef.current,
            tabSwitchCount: tabSwitchCountRef.current,
            timeSpentSeconds: timeSpentSecondsRef.current,
          }),
        });

        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text || 'Lỗi xử lý kết quả trên máy chủ' };
        }

        if (!res.ok) {
          throw new Error(data.error || 'Nộp bài thất bại');
        }

        setSubmitResult({
          isPassed: data.isPassed,
          percentage: data.percentage,
          passingScore: data.passingScore,
          score: data.score,
          totalPoints: data.totalPoints,
          pointsAwarded: data.pointsAwarded,
          domainScoreIncremented: data.domainScoreIncremented,
          breakdown: data.breakdown || [],
          tabSwitchCount: data.tabSwitchCount,
        });
      } catch (err) {
        isSubmittingRef.current = false;
        alert(err instanceof Error ? err.message : 'Lỗi khi nộp bài');
      } finally {
        setSubmitting(false);
      }
    },
    [moduleId, submitResult]
  );

  // Timer countdown
  useEffect(() => {
    if (loading || submitResult || cooldownRemaining > 0 || timeLeftSeconds <= 0 || !isExamStarted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitResult, cooldownRemaining, timeLeftSeconds, isExamStarted, handleSubmitTest]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const cdTimer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cdTimer);
          fetchAssessmentData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cdTimer);
  }, [cooldownRemaining, fetchAssessmentData]);

  // Proctoring: Floating banner alert on Tab Switch (NO full-screen whiteout)
  useEffect(() => {
    if (loading || submitResult || cooldownRemaining > 0 || !isExamStarted) return;
    const isAntiTabSwitch = moduleInfo?.securitySettings?.antiTabSwitch !== false;
    if (!isAntiTabSwitch) return;

    const maxViolations = Number(moduleInfo?.securitySettings?.maxTabSwitchViolations) || 3;

    const triggerWarning = () => {
      setTabSwitchCount((prev) => {
        const nextCount = prev + 1;
        setFloatingWarning(
          nextCount >= maxViolations
            ? `Đã vi phạm quá số lần cho phép (${nextCount}/${maxViolations}). Đang tự động nộp bài...`
            : `Cảnh báo rời phòng thi: Bạn vừa rời màn hình làm bài (${nextCount}/${maxViolations} lần). Vui lòng tập trung!`
        );

        if (nextCount >= maxViolations && !isSubmittingRef.current) {
          setTimeout(() => handleSubmitTest(true), 1500);
        } else {
          setTimeout(() => setFloatingWarning(null), 5000);
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) triggerWarning();
    };

    const handleWindowBlur = () => {
      if (document.hidden) return;
      triggerWarning();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [loading, submitResult, cooldownRemaining, isExamStarted, moduleInfo, handleSubmitTest]);

  // Anti-Copy protection (Right-click, text selection, key shortcuts)
  useEffect(() => {
    if (loading || submitResult || !isExamStarted) return;
    const isAntiCopy = moduleInfo?.securitySettings?.antiCopy !== false;
    if (!isAntiCopy) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setProctoringNotice('Thao tác chuột phải bị vô hiệu hóa trong phòng kiểm chứng.');
      setTimeout(() => setProctoringNotice(null), 3000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U' || e.key === 'v' || e.key === 'V' || e.key === 'p' || e.key === 'P')
      ) {
        e.preventDefault();
        setProctoringNotice('Phím tắt bị vô hiệu hóa để bảo mật bài khảo thí.');
        setTimeout(() => setProctoringNotice(null), 3000);
      }
      if (e.key === 'F12' || e.key === 'PrintScreen') {
        e.preventDefault();
        setProctoringNotice('Chức năng chụp màn hình / kiểm tra mã nguồn bị vô hiệu hóa.');
        setTimeout(() => setProctoringNotice(null), 3000);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, submitResult, isExamStarted, moduleInfo]);

  // Answer selection handler (Zero-Lag Instant Feedback)
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));

    // Zero-lag instant feedback from local solutionMap
    const sol = solutionMap[questionId];
    if (sol) {
      const isCorrect = sol.correctOptionId === optionId;
      setInstantFeedback((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect,
          correctOptionId: sol.correctOptionId,
          explanation: sol.explanation,
        },
      }));
    } else {
      // Background async fallback if not in solutionMap
      fetch('/api/personal/learning-path/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          itemId: questionId,
          optionId,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setInstantFeedback((prev) => ({
              ...prev,
              [questionId]: {
                isCorrect: data.isCorrect,
                correctOptionId: data.correctOptionId,
                explanation: data.explanation,
              },
            }));
          }
        })
        .catch((err) => console.warn('Instant feedback error:', err));
    }
  };

  // Retake test handler (Zero Cooldown, Instant Refresh)
  const handleRetakeTest = () => {
    setSubmitResult(null);
    setAnswers({});
    setPracticalAnswers({});
    setInstantFeedback({});
    setCurrentIndex(0);
    setFlaggedItems(new Set());
    setTimeSpentSeconds(0);
    setIsExamStarted(true);
    fetchAssessmentData();
  };

  // Flag/unflag question handler
  const handleToggleFlag = (questionId: string) => {
    setFlaggedItems((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Practical Task: File upload handler
  const handleFileUpload = (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setPracticalAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        fileName: file.name,
        fileSize: fileSizeFormatted,
        evidenceUrl: `local-upload://${file.name}`,
      },
    }));

    // Auto mark question as answered
    setAnswers((prev) => ({
      ...prev,
      [questionId]: 'PRACTICAL_ATTACHED',
    }));
  };

  const handleRemoveFile = (questionId: string) => {
    setPracticalAnswers((prev) => {
      const copy = { ...prev };
      if (copy[questionId]) {
        delete copy[questionId].fileName;
        delete copy[questionId].fileSize;
        delete copy[questionId].evidenceUrl;
      }
      return copy;
    });
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handlePracticalTextChange = (questionId: string, text: string) => {
    setPracticalAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        textResponse: text,
      },
    }));
    if (text.trim().length > 0) {
      setAnswers((prev) => ({ ...prev, [questionId]: 'TEXT_ANSWERED' }));
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-neutral-800 dark:text-zinc-200">
          Đang khởi tạo phòng kiểm chứng trực tiếp...
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error || !moduleInfo) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Không thể vào phòng kiểm chứng
          </h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400">
            {error || 'Học phần không khả dụng hoặc chưa gán đề thi.'}
          </p>
          <Link
            href="/personal/learning-path"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Lộ trình</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Cooldown Active State
  if (cooldownRemaining > 0 && !submitResult) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-4 shadow-sm">
          <Clock className="w-12 h-12 text-amber-600 mx-auto animate-pulse" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Đang trong thời gian chờ ôn tập
          </h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            Bạn vừa hoàn thành bài kiểm chứng chưa đạt chuẩn. Hãy dành thời gian đọc lại trọng tâm bài học trước khi thử thách lại.
          </p>
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
              Thời gian mở lại phòng thi
            </span>
            <span className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatTimer(cooldownRemaining)}
            </span>
          </div>
          <Link
            href="/personal/learning-path"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Quay lại ôn tập bài học</span>
          </Link>
        </div>
      </div>
    );
  }

  // 4. Test Result View (Passed vs Failed)
  if (submitResult) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-zinc-200 py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Unified Neutral Result Card with Donut Chart */}
          <div className="p-8 rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-6 shadow-sm">
            {/* Donut Chart */}
            <div className="flex justify-center pt-2">
              <DonutScoreChart
                percentage={submitResult.percentage}
                isPassed={submitResult.isPassed}
                score={submitResult.score}
                totalPoints={submitResult.totalPoints}
              />
            </div>

            <div className="space-y-1.5">
              <div>
                {submitResult.isPassed ? (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
                    XUẤT SẮC ĐẠT CHUẨN VƯỢT TRẠM
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                    CHƯA ĐẠT CHUẨN (MỤC TIÊU: ≥ {submitResult.passingScore}%)
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {submitResult.isPassed
                  ? 'Chúc mừng bạn đã vượt trạm thành công!'
                  : `Bạn cần đạt ${submitResult.passingScore}% để hoàn thành trạm này`}
              </h1>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Học phần: <strong>{moduleInfo.title}</strong>
              </p>
            </div>

            {/* 3 Parameter Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <span className="text-[11px] font-mono text-slate-500 block mb-1">Điểm số đạt</span>
                <span className={`text-lg font-mono font-bold ${
                  submitResult.isPassed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-800 dark:text-zinc-200'
                }`}>
                  {submitResult.percentage}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <span className="text-[11px] font-mono text-slate-500 block mb-1">Điểm thưởng PTS</span>
                <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                  +{submitResult.pointsAwarded} PTS
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <span className="text-[11px] font-mono text-slate-500 block mb-1">Tích lũy hồ sơ</span>
                <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                  +{submitResult.domainScoreIncremented}% Miền {moduleInfo.domainCode}
                </span>
              </div>
            </div>

            {/* Action Buttons: Retake Button + Return */}
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleRetakeTest}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại bài thi</span>
              </button>

              <Link
                href="/personal/learning-path"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại Lộ trình</span>
              </Link>
            </div>
          </div>

          {/* Breakdown / Detailed Explanations */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Giải thích chi tiết từng câu hỏi ({submitResult.breakdown.length} câu)
            </h3>

            <div className="space-y-3">
              {submitResult.breakdown.map((item, idx) => (
                <div
                  key={item.itemId}
                  className={`p-5 rounded-2xl border ${
                    item.isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                  } space-y-3 shadow-2xs`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Câu {idx + 1}
                      </span>
                      {item.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" /> Chưa chính xác
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.pointsAwarded}/{item.maxPoints} điểm
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
                    {item.prompt}
                  </p>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 text-xs space-y-1">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 block text-[11px] uppercase font-mono">
                      Kiến thức cốt lõi và giải thích:
                    </span>
                    <p className="text-slate-600 dark:text-neutral-300 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Briefing & Orientation View (Before starting the test)
  if (!isExamStarted) {
    const sec = moduleInfo.securitySettings || {};
    const hasAntiTab = sec.antiTabSwitch !== false;
    const maxTabViolations = Number(sec.maxTabSwitchViolations) || 3;
    const hasAntiCopy = sec.antiCopy !== false;
    const cdMinutes = typeof sec.cooldownMinutes === 'number' ? sec.cooldownMinutes : 15;

    return (
      <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-zinc-200 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/personal/learning-path"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Quay lại Lộ trình</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Phòng kiểm chứng trực tuyến</span>
            </div>
          </div>

          {/* Hero Briefing Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
                  TRẠM KIỂM CHỨNG • MIỀN {moduleInfo.domainCode}
                </span>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                  Mã kỹ năng: {moduleInfo.skillCode}
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {moduleInfo.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                {moduleInfo.description || 'Thực hiện bài kiểm chứng năng lực số theo khung chuẩn hóa của NEXA.'}
              </p>
            </div>
          </div>

          {/* 4 Stats Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 text-center space-y-1 shadow-2xs">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto" />
              <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 block">Thời lượng</span>
              <strong className="text-sm sm:text-base font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {moduleInfo.durationMinutes} phút
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 text-center space-y-1 shadow-2xs">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto" />
              <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 block">Số câu hỏi</span>
              <strong className="text-sm sm:text-base font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {items.length} câu
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 text-center space-y-1 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 block">Chuẩn vượt trạm</span>
              <strong className="text-sm sm:text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ≥ {moduleInfo.passingScore || 70}%
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 text-center space-y-1 shadow-2xs">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto" />
              <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 block">Thành tích</span>
              <strong className="text-sm sm:text-base font-mono font-bold text-blue-600 dark:text-blue-400">
                +{moduleInfo.pointReward || 25} PTS
              </strong>
            </div>
          </div>

          {/* Quy chế Phòng thi & Giám sát Số */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 font-mono">
                Quy chế kiểm chứng năng lực số
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-neutral-300">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Phản hồi tức thì (Instant Feedback): </strong>
                  Mỗi khi lựa chọn đáp án, hệ thống lập tức hiển thị độ chính xác và thẻ giải thích kiến thức cốt lõi để bạn tiếp thu ngay.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Giám sát chuyển tab: </strong>
                  {hasAntiTab
                    ? `Hệ thống hiển thị cảnh báo nổi trên đầu nếu bạn rời cửa sổ làm bài. Vi phạm quá ${maxTabViolations} lần sẽ tự động thu bài.`
                    : 'Không áp dụng giới hạn chuyển tab.'}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Bảo vệ nội dung & Chống gian lận: </strong>
                  {hasAntiCopy
                    ? 'Khóa phím tắt sao chép, chuột phải và in màn hình nhằm bảo toàn tính độc lập của chứng chỉ.'
                    : 'Tự do thao tác chuột và bàn phím.'}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Thời gian làm bài: </strong>
                  Đồng hồ đếm ngược bắt đầu ngay khi nhấn <em>Bắt đầu làm bài</em>. Bạn có thể nộp bài bất cứ lúc nào sau khi hoàn tất.
                </span>
              </div>
            </div>
          </div>

          {/* Action Call to Action */}
          <div className="pt-2 flex flex-col items-center justify-center space-y-2 text-center">
            <button
              type="button"
              onClick={() => setIsExamStarted(true)}
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold inline-flex items-center gap-2.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <span>Vào phòng kiểm chứng vượt trạm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500">
              Nhấn để kích hoạt đồng hồ đếm ngược và bước vào không gian thử thách.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 6. Active Full-Screen Exam Room (Vibrant & Immersive)
  const currentItem = items[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeRunningLow = timeLeftSeconds <= 180;
  const isPracticalQuestion =
    currentItem?.type === 'PRACTICAL_TASK' ||
    currentItem?.type === 'PRACTICAL' ||
    currentItem?.type === 'DIGITAL_EVIDENCE' ||
    currentItem?.type === 'ESSAY';

  const userSelectedOptionId = currentItem ? answers[currentItem.id] : null;
  const selectedOption = currentItem?.options?.find((o) => o.id === userSelectedOptionId);
  const correctOption = currentItem?.options?.find((o) => o.isCorrect);
  const currentPractical = currentItem ? practicalAnswers[currentItem.id] : null;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-zinc-200 flex flex-col relative select-none">
      {/* Background Dynamic Watermark (Anti-Screenshot Protection) */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.035] dark:opacity-[0.045] flex flex-wrap gap-24 p-12 text-neutral-900 dark:text-white font-mono text-xs select-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="transform -rotate-25 whitespace-nowrap">
            NEXA ASSESSMENT • {candidateInfo.name} ({candidateInfo.email || 'Candidate'})
          </div>
        ))}
      </div>

      {/* Floating Proctoring Alert Banner on Tab Switch (Sleek, Non-blocking, Top Floating) */}
      {floatingWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-3.5 rounded-2xl bg-neutral-900/95 text-white backdrop-blur-md shadow-xl border border-rose-500/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-xs flex-1">
              <strong className="block text-rose-300 font-semibold mb-0.5">Giám sát phòng thi</strong>
              <span>{floatingWarning}</span>
            </div>
            <button
              type="button"
              onClick={() => setFloatingWarning(null)}
              className="text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Proctoring toast message */}
      {proctoringNotice && (
        <div className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl bg-neutral-900 text-white text-xs font-medium shadow-lg flex items-center gap-2.5 border border-zinc-800 animate-in fade-in duration-200">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>{proctoringNotice}</span>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Rời khỏi bài kiểm chứng?
                </h3>
                <p className="text-xs text-slate-500">
                  Tiến độ trả lời chưa nộp sẽ không được lưu vào hệ thống.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <Link
                href="/personal/learning-path"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Rời phòng thi
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Xác nhận nộp bài kiểm chứng
                </h3>
                <p className="text-xs text-slate-500">
                  Bạn có chắc chắn muốn nộp bài để tính điểm vượt trạm?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Số câu đã làm:</span>
                <strong className="text-blue-600 dark:text-blue-400">{answeredCount} / {items.length} câu</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số câu chưa làm:</span>
                <span className="text-neutral-800 dark:text-zinc-200">{items.length - answeredCount} câu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đánh dấu xem lại:</span>
                <span className="text-amber-600">{flaggedItems.size} câu</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={() => handleSubmitTest(false)}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Nộp bài ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Full-Screen Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Tạm dừng / Rời phòng thi"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                KIỂM CHỨNG TRẠM
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                Miền {moduleInfo.domainCode}
              </span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
              {moduleInfo.title}
            </h1>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-mono font-bold tabular-nums transition-all ${
            isTimeRunningLow
              ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-neutral-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-neutral-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{formatTimer(timeLeftSeconds)}</span>
        </div>

        {/* Right: Progress & Submit Button */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-mono text-slate-500">
            Đã làm <strong className="text-neutral-900 dark:text-neutral-100">{answeredCount}</strong> / {items.length} câu
          </span>

          <button
            type="button"
            onClick={() => setShowSubmitConfirmModal(true)}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Progress Line */}
      <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1 overflow-hidden sticky top-[61px] z-30">
        <div
          className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${(answeredCount / Math.max(1, items.length)) * 100}%` }}
        />
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-between z-20">
        {currentItem ? (
          <div className="space-y-6">
            {/* Question Header & Navigation Pills */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {items.map((it, idx) => {
                  const isAnswered = Boolean(answers[it.id]);
                  const isCurrent = idx === currentIndex;
                  const isFlagged = flaggedItems.has(it.id);

                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                          : isFlagged
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : isAnswered
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentItem.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                    flaggedItems.has(currentItem.id)
                      ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedItems.has(currentItem.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</span>
                </button>

                <span className="text-xs font-mono text-slate-500">
                  Chuẩn đạt: <strong className="text-blue-600 dark:text-blue-400">{moduleInfo.passingScore}%</strong>
                </span>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-6 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    CÂU HỎI {currentIndex + 1} / {items.length}
                  </span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
                    {isPracticalQuestion ? 'THỰC HÀNH / NỘP TỆP' : 'TRẮC NGHIỆM ĐƠN'}
                  </span>
                </div>
                <span>{currentItem.points} ĐIỂM</span>
              </div>

              <div className="space-y-2">
                <p className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
                  {currentItem.prompt}
                </p>
                {currentItem.rubricGuide && (
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-slate-600 dark:text-neutral-300">
                    <strong className="text-blue-600 dark:text-blue-400">Tiêu chí đánh giá: </strong>
                    {currentItem.rubricGuide}
                  </div>
                )}
              </div>

              {/* DẠNG 1: TRẮC NGHIỆM (MCQ) - CÓ INSTANT FEEDBACK */}
              {!isPracticalQuestion && currentItem.options && currentItem.options.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2.5">
                    {currentItem.options.map((opt, optIdx) => {
                      const isSelected = userSelectedOptionId === opt.id;
                      const fb = instantFeedback[currentItem.id];
                      const hasFeedback = Boolean(fb && isSelected);
                      const isOptionCorrect = fb?.isCorrect;
                      const isTrueCorrectOption = fb?.correctOptionId === opt.id;
                      const optionLabel = String.fromCharCode(65 + optIdx);

                      // Style variants for Instant Feedback
                      let buttonStyle =
                        'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40 text-neutral-800 dark:text-zinc-200';

                      if (isSelected) {
                        if (hasFeedback) {
                          if (isOptionCorrect) {
                            buttonStyle =
                              'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20';
                          } else {
                            buttonStyle =
                              'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20';
                          }
                        } else {
                          buttonStyle =
                            'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-600';
                        }
                      } else if (fb && isTrueCorrectOption) {
                        // Highlight correct answer if user answered wrongly
                        buttonStyle =
                          'border-emerald-400/80 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400/40';
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(currentItem.id, opt.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${buttonStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                                isSelected
                                  ? hasFeedback
                                    ? isOptionCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-rose-600 text-white'
                                    : 'bg-blue-600 text-white'
                                  : fb && isTrueCorrectOption
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                              }`}
                            >
                              {optionLabel}
                            </span>
                            <span className="text-xs sm:text-sm leading-relaxed">{opt.content}</span>
                          </div>

                          {/* Instant Feedback Status Icon */}
                          {isSelected && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasFeedback ? (
                                isOptionCorrect ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Chính xác</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                                    <XCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Chưa chính xác</span>
                                  </span>
                                )
                              ) : (
                                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Instant Feedback Animated Knowledge Card */}
                  {instantFeedback[currentItem.id] && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 text-xs space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 font-mono text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Kiến thức cốt lõi & Hướng dẫn kỹ năng:</span>
                      </div>
                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
                        {instantFeedback[currentItem.id].explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* DẠNG 2: THỰC HÀNH / NỘP TỆP (WORD, PDF, EXCEL, ESSAY) */}
              {isPracticalQuestion && (
                <div className="space-y-4 pt-2">
                  {/* File Upload Dropzone */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".doc,.docx,.pdf,.xlsx,.xls,.zip"
                    onChange={(e) => handleFileUpload(currentItem.id, e)}
                  />

                  {currentPractical?.fileName ? (
                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                            {currentPractical.fileName}
                          </p>
                          <span className="text-[11px] font-mono text-slate-500">
                            {currentPractical.fileSize} • Đã đính kèm tệp bài làm
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                          Thay thế tệp
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(currentItem.id)}
                          className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Xóa tệp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-zinc-900/30 transition-all text-center space-y-2 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          Kéo thả hoặc nhấn để tải lên tệp bài làm (.docx, .pdf, .xlsx)
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                          Hỗ trợ định dạng Word (.doc, .docx), PDF, Excel. Dung lượng tối đa 25MB.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Textarea for note / solution description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-500 block">
                      GHI CHÚ / GIẢI TRÌNH BÀI THỰC HÀNH (TÙY CHỌN):
                    </label>
                    <textarea
                      rows={3}
                      value={currentPractical?.textResponse || ''}
                      onChange={(e) => handlePracticalTextChange(currentItem.id, e.target.value)}
                      placeholder="Nhập nội dung giải trình tóm tắt, cách thức giải quyết yêu cầu bài thực hành..."
                      className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">Không có câu hỏi nào.</div>
        )}

        {/* Footer Navigation */}
        <div className="pt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Câu trước</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            {currentIndex + 1} / {items.length}
          </span>

          {currentIndex === items.length - 1 ? (
            <button
              type="button"
              onClick={() => setShowSubmitConfirmModal(true)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              <span>Hoàn thành & Nộp bài</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
