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
} from 'lucide-react';

interface QuestionOption {
  id: string;
  content: string;
  order_index?: number;
}

interface QuestionItem {
  id: string;
  type: string;
  prompt: string;
  points: number;
  orderIndex: number;
  options: QuestionOption[];
}

interface ModuleInfo {
  id: string;
  title: string;
  description?: string;
  domainCode: string;
  skillCode: string;
  durationMinutes: number;
  pointReward: number;
  passingScore: number;
  securitySettings?: Record<string, any>;
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
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Timer states
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Proctoring / Anti-cheat states
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [isWhiteScreenLocked, setIsWhiteScreenLocked] = useState<boolean>(false);
  const [proctoringNotice, setProctoringNotice] = useState<string | null>(null);

  // Submission & Result states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const tabSwitchCountRef = useRef(tabSwitchCount);
  tabSwitchCountRef.current = tabSwitchCount;
  const timeSpentSecondsRef = useRef(timeSpentSeconds);
  timeSpentSecondsRef.current = timeSpentSeconds;

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
      try {
        const res = await fetch('/api/personal/learning-path/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId,
            answers: answersRef.current,
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

        setIsWhiteScreenLocked(false);
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
    if (loading || submitResult || cooldownRemaining > 0 || timeLeftSeconds <= 0) return;

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
  }, [loading, submitResult, cooldownRemaining, timeLeftSeconds, handleSubmitTest]);

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

  // Tab switch & Window blur detection (Anti-Cheat)
  useEffect(() => {
    if (loading || submitResult || cooldownRemaining > 0) return;
    const isAntiTabSwitch = moduleInfo?.securitySettings?.antiTabSwitch !== false;
    if (!isAntiTabSwitch) return;

    const maxViolations = Number(moduleInfo?.securitySettings?.maxTabSwitchViolations) || 3;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;
          setIsWhiteScreenLocked(true);
          if (nextCount >= maxViolations && !isSubmittingRef.current) {
            setTimeout(() => handleSubmitTest(true), 1000);
          }
          return nextCount;
        });
      }
    };

    const handleWindowBlur = () => {
      // Tránh đếm trùng khi document.hidden đã kích hoạt
      if (document.hidden) return;
      setTabSwitchCount((prev) => {
        const nextCount = prev + 1;
        setIsWhiteScreenLocked(true);
        if (nextCount >= maxViolations && !isSubmittingRef.current) {
          setTimeout(() => handleSubmitTest(true), 1000);
        }
        return nextCount;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [loading, submitResult, cooldownRemaining, moduleInfo, handleSubmitTest]);

  // Anti-Copy protection (Right-click, text selection, key shortcuts)
  useEffect(() => {
    if (loading || submitResult) return;
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
        (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U' || e.key === 'v' || e.key === 'V')
      ) {
        e.preventDefault();
        setProctoringNotice('Phím tắt sao chép bị vô hiệu hóa trong phòng kiểm chứng.');
        setTimeout(() => setProctoringNotice(null), 3000);
      }
      if (e.key === 'F12' || e.key === 'PrintScreen') {
        e.preventDefault();
        setProctoringNotice('Chức năng kiểm tra mã nguồn bị vô hiệu hóa.');
        setTimeout(() => setProctoringNotice(null), 3000);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, submitResult]);

  // Answer selection handler
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
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
          Đang khởi tạo phòng kiểm chứng toàn màn hình...
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error || !moduleInfo) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Không thể vào phòng kiểm chứng
          </h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400">
            {error || 'Học phần không khả dụng hoặc chưa gán đề thi.'}
          </p>
          <Link
            href="/personal/learning-path"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
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
        <div className="max-w-md w-full p-8 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-4">
          <Clock className="w-12 h-12 text-amber-600 mx-auto animate-pulse" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Đang trong thời gian chờ ôn tập
          </h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            Bạn vừa hoàn thành bài thi chưa đạt chuẩn. Để bảo đảm chất lượng học tập, vui lòng dành thời gian đọc lại tài liệu trước khi kiểm chứng lại.
          </p>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
              Thời gian mở lại phòng thi
            </span>
            <span className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatTimer(cooldownRemaining)}
            </span>
          </div>
          <Link
            href="/personal/learning-path"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
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
          {submitResult.isPassed ? (
            <div className="p-8 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  XUẤT SẮC ĐẠT CHUẨN 100%
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Chúc mừng bạn đã vượt trạm thành công!
                </h1>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  Học phần: <strong>{moduleInfo.title}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] font-mono text-slate-500 block mb-1">Điểm số đạt</span>
                  <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {submitResult.percentage}%
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] font-mono text-slate-500 block mb-1">Điểm thưởng PTS</span>
                  <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                    +{submitResult.pointsAwarded} PTS
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[11px] font-mono text-slate-500 block mb-1">Tích lũy hồ sơ năng lực</span>
                  <span className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">
                    +{submitResult.domainScoreIncremented}% Miền {moduleInfo.domainCode}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/personal/learning-path"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition shadow-sm"
                >
                  <span>Tiếp tục lộ trình học tập</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                  CHƯA ĐẠT CHUẨN VƯỢT TRẠM
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Bạn cần đạt {submitResult.passingScore}% để vượt qua học phần này
                </h1>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  Kết quả hiện tại: <strong>{submitResult.percentage}%</strong> ({submitResult.score}/{submitResult.totalPoints} điểm)
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                Để bảo đảm bạn thực sự làm chủ kỹ năng số, hệ thống yêu cầu chuẩn đạt tuyệt đối trước khi mở trạm tiếp theo. Vui lòng xem giải thích chi tiết bên dưới và ôn lại bài học.
              </p>

              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/personal/learning-path"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Quay lại ôn tập bài học</span>
                </Link>
              </div>
            </div>
          )}

          {/* Breakdown / Detailed Explanations */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Giải thích chi tiết từng câu hỏi ({submitResult.breakdown.length} câu)
            </h3>

            <div className="space-y-3">
              {submitResult.breakdown.map((item, idx) => (
                <div
                  key={item.itemId}
                  className={`p-5 rounded-xl border ${
                    item.isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                  } space-y-3`}
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

                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
                    {item.prompt}
                  </p>

                  <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs space-y-1">
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

  // 5. Active Full-Screen Exam Room
  const currentItem = items[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeRunningLow = timeLeftSeconds <= 180;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-zinc-200 flex flex-col select-none">
      {/* Anti-cheat White Screen Overlay on Tab Switch */}
      {isWhiteScreenLocked && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-8 h-8" strokeWidth={1.75} />
          </div>
          <div className="max-w-md space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
              CẢNH BÁO VI PHẠM PHÒNG THI
            </span>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Bạn vừa rời khỏi màn hình kiểm chứng!
            </h2>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Hệ thống giám sát phát hiện bạn đã chuyển sang tab hoặc ứng dụng khác. Mọi hành vi rời phòng thi đều được ghi nhận vào lịch sử đánh giá.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono">
            Số lần cảnh báo vi phạm: <strong className="text-rose-600 dark:text-rose-400">{tabSwitchCount} / {Number(moduleInfo?.securitySettings?.maxTabSwitchViolations) || 3}</strong>
            {tabSwitchCount >= (Number(moduleInfo?.securitySettings?.maxTabSwitchViolations) || 3) && (
              <p className="text-[11px] text-rose-600 mt-1">Đã quá số lần cho phép. Đang tự động thu bài làm...</p>
            )}
          </div>

          {tabSwitchCount < (Number(moduleInfo?.securitySettings?.maxTabSwitchViolations) || 3) && (
            <button
              type="button"
              onClick={() => setIsWhiteScreenLocked(false)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
            >
              Tôi hiểu và tiếp tục làm bài
            </button>
          )}
        </div>
      )}

      {/* Proctoring toast message */}
      {proctoringNotice && (
        <div className="fixed bottom-6 right-6 z-40 p-3 rounded-xl bg-neutral-900 text-white text-xs font-medium shadow-lg flex items-center gap-2 border border-zinc-800">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>{proctoringNotice}</span>
        </div>
      )}

      {/* Fixed Full-Screen Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur border-b border-slate-200/80 dark:border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/personal/learning-path"
            onClick={(e) => {
              if (!confirm('Bạn có chắc chắn muốn rời khỏi bài kiểm chứng? Tiến độ câu trả lời chưa nộp sẽ không được lưu.')) {
                e.preventDefault();
              }
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            title="Thoát phòng thi"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tabular-nums transition-colors ${
            isTimeRunningLow
              ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-neutral-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-neutral-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(timeLeftSeconds)}</span>
        </div>

        {/* Right: Progress & Submit Button */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-mono text-slate-500">
            Đã làm <strong className="text-neutral-900 dark:text-neutral-100">{answeredCount}</strong> / {items.length} câu
          </span>

          <button
            type="button"
            onClick={() => handleSubmitTest(false)}
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

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-between">
        {currentItem ? (
          <div className="space-y-6">
            {/* Question Header & Navigation Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {items.map((it, idx) => {
                  const isAnswered = Boolean(answers[it.id]);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isAnswered
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-mono text-slate-500">
                Chuẩn đạt: <strong className="text-blue-600 dark:text-blue-400">{moduleInfo.passingScore}%</strong>
              </span>
            </div>

            {/* Question Card */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>CÂU HỎI {currentIndex + 1} / {items.length}</span>
                <span>{currentItem.points} ĐIỂM</span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
                {currentItem.prompt}
              </p>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentItem.options.map((opt, optIdx) => {
                  const isSelected = answers[currentItem.id] === opt.id;
                  const optionLabel = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentItem.id, opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {optionLabel}
                        </span>
                        <span className="text-xs sm:text-sm leading-relaxed">{opt.content}</span>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
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

          <button
            type="button"
            disabled={currentIndex === items.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Câu tiếp theo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>
    </div>
  );
}
