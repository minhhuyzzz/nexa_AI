'use client';

import { useEffect, useState, use, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Upload,
  Paperclip,
  FileText,
  Link as LinkIcon,
  Lock,
  Unlock,
  Check,
  X,
  Sparkles,
  Award,
} from 'lucide-react';

interface Option {
  id: string;
  content: string;
  order_index: number;
}

interface Question {
  id: string;
  prompt: string;
  points: number;
  type?: string;
  order_index: number;
  difficulty_level?: string;
  competency_id?: string;
  rubric_guide?: string;
  competencies?: {
    skill_code: string;
    title: string;
  };
  options: Option[];
}

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  point_reward: number;
}

function AssessmentTakeContent({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const pin = searchParams.get('pin');

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staged Exam Flow (One-way Section Lock)
  const [activeStage, setActiveStage] = useState<'STAGE_1_OBJECTIVE' | 'STAGE_2_PRACTICAL'>('STAGE_1_OBJECTIVE');
  const [isStage1Locked, setIsStage1Locked] = useState(false);
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);

  // Navigation & Answers
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [evidenceUrls, setEvidenceUrls] = useState<Record<string, string>>({});
  const [liveUrls, setLiveUrls] = useState<Record<string, string>>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(2700);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [lastSaved, setLastSaved] = useState<string>('Vừa xong');

  // Smart Proctoring (Anti-Cheat) State
  const [violationCount, setViolationCount] = useState(0);
  const [warningModal, setWarningModal] = useState<{
    open: boolean;
    level: number;
    title: string;
    message: string;
  }>({ open: false, level: 0, title: '', message: '' });

  const blurTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningModalOpenRef = useRef(false);
  warningModalOpenRef.current = warningModal.open;

  const handleFinalSubmitRef = useRef<() => void>(() => {});
  const handleExecuteLockStage1Ref = useRef<() => void>(() => {});

  // 1. Load Assessment
  useEffect(() => {
    async function loadAssessment() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/assessments/${assessmentId}`);
        const data = await res.json();

        if (res.ok && data.assessment && data.items && data.items.length > 0) {
          setAssessment(data.assessment);
          setQuestions(data.items);
          const totalSec = (data.assessment.duration_minutes || 45) * 60;
          let remainingSec = totalSec;

          // Late joiner check: if joining an active live room, deduct elapsed time
          if (roomId || pin) {
            try {
              const roomRes = await fetch(`/api/rooms/status?roomId=${roomId || ''}&pin=${pin || ''}`);
              if (roomRes.ok) {
                const roomData = await roomRes.json();
                if (roomData.room?.startedAt) {
                  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(roomData.room.startedAt).getTime()) / 1000));
                  remainingSec = Math.max(0, totalSec - elapsed);
                }
              }
            } catch {
              // fallback
            }
          }
          setTimeRemaining(remainingSec);

          // If no MCQ/Scenario exists in the exam, start directly in Stage 2
          const hasObjective = data.items.some(
            (q: Question) => q.type === 'MCQ' || q.type === 'SCENARIO'
          );
          if (!hasObjective) {
            setActiveStage('STAGE_2_PRACTICAL');
            setIsStage1Locked(true);
          }
        } else {
          setError(data.error || 'Bài khảo thí không có câu hỏi hợp lệ hoặc chưa được kích hoạt');
        }

        // Restore any local draft
        const cacheKey = `nexa_exam_draft_${assessmentId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            setSelectedAnswers(JSON.parse(cached));
          } catch {}
        }

        const cacheTextKey = `nexa_exam_draft_text_${assessmentId}`;
        const cachedText = localStorage.getItem(cacheTextKey);
        if (cachedText) {
          try {
            setTextAnswers(JSON.parse(cachedText));
          } catch {}
        }

        const cacheEvKey = `nexa_exam_draft_ev_${assessmentId}`;
        const cachedEv = localStorage.getItem(cacheEvKey);
        if (cachedEv) {
          try {
            setEvidenceUrls(JSON.parse(cachedEv));
          } catch {}
        }

        const cacheLiveKey = `nexa_exam_draft_live_${assessmentId}`;
        const cachedLive = localStorage.getItem(cacheLiveKey);
        if (cachedLive) {
          try {
            setLiveUrls(JSON.parse(cachedLive));
          } catch {}
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối khi tải đề thi');
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [assessmentId, roomId, pin]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || timeRemaining <= 0 || isSubmitting || submittedResult) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmitRef.current(); // Auto submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeRemaining, isSubmitting, submittedResult]);

  // 3. Smart Proctoring (Debounced 2000ms Anti-Cheat)
  useEffect(() => {
    if (loading || isSubmitting || submittedResult || isStage1Locked || activeStage !== 'STAGE_1_OBJECTIVE') {
      return;
    }

    const triggerViolation = () => {
      if (warningModalOpenRef.current) return; // Prevent double trigger while modal is open

      setViolationCount((prev) => {
        const next = prev + 1;
        if (next === 1) {
          setWarningModal({
            open: true,
            level: 1,
            title: 'Cảnh Báo Rời Màn Hình (Lần 1 / 3)',
            message:
              'Hệ thống phát hiện bạn vừa chuyển tab hoặc rời cửa sổ bài thi. Vui lòng tập trung làm bài thi khách quan, không chuyển tab.',
          });
        } else if (next === 2) {
          setWarningModal({
            open: true,
            level: 2,
            title: 'Cảnh Báo Nghiêm Trọng (Lần 2 / 3)',
            message:
              'Bạn đã rời màn hình bài thi lần thứ 2! Nếu vi phạm thêm 1 lần nữa, Chặng 1 sẽ tự động nộp bài và khóa toàn bộ đáp án trắc nghiệm.',
          });
        } else if (next >= 3) {
          setWarningModal({
            open: true,
            level: 3,
            title: 'Tự Động Khóa Chặng 1 (Vi Phạm Lần 3 / 3)',
            message:
              'Bạn đã vi phạm quy chế chuyển tab quá 3 lần. Hệ thống đã tự động lưu và khóa cứng đáp án Chặng 1, chuyển bạn sang Chặng Thực hành.',
          });
          // Auto lock stage 1 and move to stage 2
          handleExecuteLockStage1Ref.current();
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation();
      }
    };

    const handleWindowBlur = () => {
      // Debounce window.blur for 2000ms to avoid false positives on system notifications
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => {
        if (!document.hasFocus() || document.hidden) {
          triggerViolation();
        }
      }, 2000);
    };

    const handleWindowFocus = () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [loading, isSubmitting, submittedResult, isStage1Locked, activeStage]);

  // Split questions into 2 sections
  const stage1Questions = questions.filter(
    (q) => q.type === 'MCQ' || q.type === 'SCENARIO'
  );
  const stage2Questions = questions.filter(
    (q) =>
      q.type === 'PRACTICAL' ||
      q.type === 'DIGITAL_EVIDENCE' ||
      q.type === 'PRACTICAL_TASK' ||
      q.type === 'PRACTICAL_FILE'
  );

  const activeQuestionsList = activeStage === 'STAGE_1_OBJECTIVE' ? stage1Questions : stage2Questions;
  const currentQ = activeQuestionsList[currentIndex] || activeQuestionsList[0];

  // Auto-Save Draft every 15s
  useEffect(() => {
    if (questions.length === 0) return;

    const saveTimer = setInterval(() => {
      localStorage.setItem(`nexa_exam_draft_${assessmentId}`, JSON.stringify(selectedAnswers));
      localStorage.setItem(`nexa_exam_draft_text_${assessmentId}`, JSON.stringify(textAnswers));
      localStorage.setItem(`nexa_exam_draft_ev_${assessmentId}`, JSON.stringify(evidenceUrls));
      localStorage.setItem(`nexa_exam_draft_live_${assessmentId}`, JSON.stringify(liveUrls));
      setLastSaved(new Date().toLocaleTimeString('vi-VN'));
    }, 15000);

    return () => clearInterval(saveTimer);
  }, [assessmentId, selectedAnswers, textAnswers, evidenceUrls, liveUrls, questions]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isStage1Locked) return;
    const updated = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(updated);
    localStorage.setItem(`nexa_exam_draft_${assessmentId}`, JSON.stringify(updated));
  };

  const handleTextChange = (questionId: string, value: string) => {
    const updated = { ...textAnswers, [questionId]: value };
    setTextAnswers(updated);
    localStorage.setItem(`nexa_exam_draft_text_${assessmentId}`, JSON.stringify(updated));
  };

  const handleLiveUrlChange = (questionId: string, value: string) => {
    const updated = { ...liveUrls, [questionId]: value };
    setLiveUrls(updated);
    localStorage.setItem(`nexa_exam_draft_live_${assessmentId}`, JSON.stringify(updated));
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    setUploadingFile(true);
    setUploadError(null);

    try {
      const mockUrl = URL.createObjectURL(file);
      const updated = { ...evidenceUrls, [questionId]: mockUrl };
      setEvidenceUrls(updated);
      localStorage.setItem(`nexa_exam_draft_ev_${assessmentId}`, JSON.stringify(updated));
    } catch {
      setUploadError('Không thể tải tệp tin lên. Vui lòng thử lại.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Execute Locking Stage 1
  const handleExecuteLockStage1 = () => {
    setIsStage1Locked(true);
    setShowLockConfirmModal(false);
    if (stage2Questions.length > 0) {
      setActiveStage('STAGE_2_PRACTICAL');
      setCurrentIndex(0);
    } else {
      handleFinalSubmit();
    }
  };
  handleExecuteLockStage1Ref.current = handleExecuteLockStage1;

  // Final Submit
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      // 1. Compute objective score (0.01s instant)
      let objectiveEarned = 0;
      let totalObjectivePoints = 0;

      stage1Questions.forEach((q) => {
        totalObjectivePoints += q.points || 10;
        const selectedOptId = selectedAnswers[q.id];
        const correctOpt = q.options?.find((o: any) => o.is_correct);
        if (correctOpt && correctOpt.id === selectedOptId) {
          objectiveEarned += q.points || 10;
        }
      });

      const totalPracticalPoints = stage2Questions.reduce((acc, q) => acc + (q.points || 20), 0);
      const totalExamPoints = totalObjectivePoints + totalPracticalPoints;

      const resultPayload = {
        assessmentTitle: assessment?.title || 'Bài Khảo Thí Năng Lực Số',
        objectiveScore: objectiveEarned,
        totalObjectiveScore: totalObjectivePoints,
        totalPracticalPoints,
        totalExamPoints,
        hasPractical: stage2Questions.length > 0,
        submissionDate: new Date().toLocaleString('vi-VN'),
        passed: (objectiveEarned / (totalObjectivePoints || 1)) >= ((assessment?.passing_score || 70) / 100),
      };

      setSubmittedResult(resultPayload);

      // Clean local cache
      localStorage.removeItem(`nexa_exam_draft_${assessmentId}`);
      localStorage.removeItem(`nexa_exam_draft_text_${assessmentId}`);
      localStorage.removeItem(`nexa_exam_draft_ev_${assessmentId}`);
      localStorage.removeItem(`nexa_exam_draft_live_${assessmentId}`);
    } catch {
      alert('Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };
  handleFinalSubmitRef.current = handleFinalSubmit;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500">Đang chuẩn bị phòng thi và bảo mật bài khảo thí...</p>
      </div>
    );
  }

  // Error Screen
  if (error || !assessment || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-md border border-slate-200 bg-white text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" strokeWidth={1.75} />
        <h2 className="text-base font-bold text-slate-900">Không Thể Tải Đề Thi</h2>
        <p className="text-xs text-slate-500">{error || 'Bài thi không tồn tại hoặc chưa được phát hành.'}</p>
        <Link
          href="/learner/assessments"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh mục</span>
        </Link>
      </div>
    );
  }

  // Result Screen (After Final Submit)
  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 rounded-md border border-slate-200 bg-white shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            KẾT QUẢ KHẢO THÍ CHUẨN HÓA
          </span>
          <h1 className="text-xl font-bold text-slate-900">{submittedResult.assessmentTitle}</h1>
          <p className="text-xs text-slate-500">Nộp bài vào lúc {submittedResult.submissionDate}</p>
        </div>

        {/* Score Card */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-md bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Điểm Trắc Nghiệm &amp; Tình Huống:</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {submittedResult.objectiveScore} / {submittedResult.totalObjectiveScore} đ
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Chấm khách quan tự động (0.01s)</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Điểm Phần Thực Hành:</span>
            <div className="text-2xl font-bold font-mono text-sky-700 tabular-nums">
              {submittedResult.hasPractical ? 'Chờ Đánh Giá' : 'Không có'}
            </div>
            <span className="text-[11px] text-slate-500">
              {submittedResult.hasPractical ? `Thẩm định theo Rubric (${submittedResult.totalPracticalPoints}đ)` : 'Bài thi thuần khách quan'}
            </span>
          </div>
        </div>

        {/* AI On-Demand Trigger Box */}
        {submittedResult.hasPractical && (
          <div className="p-4 rounded-md border border-sky-200 bg-sky-50/40 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-sky-900">
              <Sparkles className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span>Dịch Vụ AI Thẩm Định Rubric &amp; Gợi Ý Lộ Trình (Theo Yêu Cầu)</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Theo quy chuẩn kiến trúc NEXA, hệ thống không tự động trừ lượt AI khi nộp bài. Bạn có thể chủ động nhấn nút dưới đây để nhờ AI thẩm định trước hoặc xem phản hồi cá nhân hóa.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => alert('Đang gửi bài thực hành sang AI Gateway để thẩm định Rubric...')}
                className="px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors shadow-xs"
              >
                Chấm Thử Bằng AI Theo Rubric
              </button>

              <button
                type="button"
                onClick={() => alert('Đang kích hoạt AI phân tích khoảng trống năng lực số...')}
                className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
              >
                Phân Tích Năng Lực &amp; Lộ Trình AI
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            href="/learner/assessments"
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về danh mục khảo thí</span>
          </Link>

          <Link
            href="/learner/dashboard"
            className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs"
          >
            Về Bảng Điều Khiển
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16">
      {/* Top Floating Exam Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {activeStage === 'STAGE_1_OBJECTIVE' ? 'CHẶNG 1: TRẮC NGHIỆM &amp; TÌNH HUỐNG' : 'CHẶNG 2: BÀI TẬP THỰC HÀNH'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            {isStage1Locked && (
              <span className="text-[10px] font-mono font-bold px-1.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Chặng 1 đã khóa
              </span>
            )}
          </div>
          <h1 className="text-sm font-bold text-slate-900 truncate max-w-lg">{assessment.title}</h1>
        </div>

        {/* Countdown Timer & Submit Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-sm font-bold text-slate-900 tabular-nums">
            <Clock className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {activeStage === 'STAGE_1_OBJECTIVE' && stage2Questions.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowLockConfirmModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Hoàn Thành Chặng 1 &amp; Sang Thực Hành</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp Bài Thi</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage Indicator Bar */}
      {stage1Questions.length > 0 && stage2Questions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveStage('STAGE_1_OBJECTIVE')}
            className={`p-3 rounded-md border text-left flex items-center justify-between transition-colors ${
              activeStage === 'STAGE_1_OBJECTIVE'
                ? 'border-sky-600 bg-sky-50/50 text-sky-900 font-bold'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold">Chặng 1:</span>
              <span>Trắc nghiệm &amp; Tình huống ({stage1Questions.length} câu)</span>
            </div>
            {isStage1Locked ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                <Lock className="w-3 h-3" /> Đã khóa
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-sky-600">Đang làm</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isStage1Locked) {
                setShowLockConfirmModal(true);
              } else {
                setActiveStage('STAGE_2_PRACTICAL');
              }
            }}
            className={`p-3 rounded-md border text-left flex items-center justify-between transition-colors ${
              activeStage === 'STAGE_2_PRACTICAL'
                ? 'border-sky-600 bg-sky-50/50 text-sky-900 font-bold'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold">Chặng 2:</span>
              <span>Bài tập Thực hành &amp; Minh chứng ({stage2Questions.length} bài)</span>
            </div>
            {activeStage === 'STAGE_2_PRACTICAL' ? (
              <span className="text-[11px] font-semibold text-emerald-600">Đang làm</span>
            ) : (
              <span className="text-[11px] font-mono text-slate-400">Chưa bắt đầu</span>
            )}
          </button>
        </div>
      )}

      {/* Context-Aware Smart Proctoring Banners */}
      {activeStage === 'STAGE_1_OBJECTIVE' && (
        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
            <span>
              <strong>Chế độ Giám sát Nghiêm ngặt:</strong> Không rời khỏi màn hình hoặc chuyển tab trong suốt thời gian làm bài trắc nghiệm.
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px] font-semibold">
            <span className="text-slate-500">Số lần vi phạm:</span>
            <span className={`px-2 py-0.5 rounded ${violationCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
              {violationCount}/3
            </span>
          </div>
        </div>
      )}

      {activeStage === 'STAGE_2_PRACTICAL' && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>
            <strong>Phần Thực hành:</strong> Giám sát tự động tạm dừng. Bạn được phép mở ứng dụng ngoài (Canva, Figma, Google Drive, Sheets, Word...) để thao tác sản phẩm số, sau đó quay lại dán liên kết hoặc tải tệp đính kèm.
          </span>
        </div>
      )}

      {/* Main Question Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Question Content (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  Câu {currentIndex + 1} / {activeQuestionsList.length}
                </span>
                <span className="font-semibold text-sky-700 px-2 py-0.5 rounded bg-sky-50 border border-sky-100">
                  {currentQ?.type === 'MCQ'
                    ? 'Trắc nghiệm khách quan'
                    : currentQ?.type === 'SCENARIO'
                    ? 'Tình huống thực tế'
                    : 'Thực hành số'}
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-500">
                +{currentQ?.points || 10} điểm
              </span>
            </div>

            {/* Prompt */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 leading-relaxed font-sans">
                {currentQ?.prompt}
              </h2>

              {currentQ?.rubric_guide && (
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <strong>Tiêu chí Rubric:</strong> {currentQ.rubric_guide}
                </div>
              )}
            </div>

            {/* Options for MCQ / Scenario */}
            {(currentQ?.type === 'MCQ' || currentQ?.type === 'SCENARIO') && (
              <div className="space-y-2.5 pt-2">
                {currentQ.options?.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = selectedAnswers[currentQ.id] === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isStage1Locked}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`w-full p-3.5 rounded-md border text-left text-xs transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50/60 font-semibold text-sky-900 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      } ${isStage1Locked ? 'cursor-not-allowed opacity-75' : ''}`}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="leading-relaxed">{opt.content}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Practical Inputs */}
            {(currentQ?.type === 'PRACTICAL' ||
              currentQ?.type === 'DIGITAL_EVIDENCE' ||
              currentQ?.type === 'PRACTICAL_TASK' ||
              currentQ?.type === 'PRACTICAL_FILE') && (
              <div className="space-y-4 pt-3 border-t border-slate-100 text-xs">
                {/* 1. Solution Explanation */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Bản tóm tắt giải trình giải pháp thiết kế / kỹ thuật
                  </label>
                  <textarea
                    rows={4}
                    value={textAnswers[currentQ.id] || ''}
                    onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                    placeholder="Mô tả công cụ đã dùng, ý tưởng thiết kế, thông điệp truyền thông hoặc giải pháp kỹ thuật..."
                    className="w-full p-3 rounded-md border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* 2. File Upload / Live Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-md border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-sky-600" />
                      <span>Tải tệp sản phẩm (PDF, DOCX, ZIP, Ảnh)</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(currentQ.id, f);
                      }}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-sky-50 file:text-sky-700"
                    />
                    {evidenceUrls[currentQ.id] && (
                      <span className="text-[11px] text-emerald-700 font-semibold block">
                        &check; Đã đính kèm tệp tin
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-md border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>Hoặc dán liên kết số (Figma, Canva, Drive...)</span>
                    </label>
                    <input
                      type="url"
                      value={liveUrls[currentQ.id] || ''}
                      onChange={(e) => handleLiveUrlChange(currentQ.id, e.target.value)}
                      placeholder="https://canva.com/..., https://figma.com/..."
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prev / Next Pagination */}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors disabled:opacity-40"
            >
              &larr; Câu trước
            </button>

            <span className="text-slate-400 font-mono text-[11px]">
              Tự động lưu: {lastSaved}
            </span>

            <button
              type="button"
              disabled={currentIndex === activeQuestionsList.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(activeQuestionsList.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors disabled:opacity-40"
            >
              Câu tiếp theo &rarr;
            </button>
          </div>
        </div>

        {/* Right Column: Question Matrix Navigator */}
        <div className="space-y-4">
          <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                BẢNG CÂU HỎI ({answeredCount}/{questions.length})
              </h3>
              {isStage1Locked && (
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Khóa Chặng 1
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {activeQuestionsList.map((q, idx) => {
                const isAnswered = Boolean(selectedAnswers[q.id] || textAnswers[q.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-md text-xs font-bold font-mono transition-all ${
                      isCurrent
                        ? 'bg-sky-600 text-white ring-2 ring-sky-500'
                        : isAnswered
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-sky-600" />
                <span>Đang chọn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-800" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                <span>Chưa trả lời</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ONE-WAY LOCK CONFIRMATION */}
      {showLockConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Khóa Chặng 1 &amp; Sang Thực Hành?</h3>
                <p className="text-xs text-slate-500">Quy tắc khảo thí khóa một chiều (One-way Lock)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sau khi chuyển sang Chặng 2 (Thực hành), toàn bộ câu trả lời trắc nghiệm Chặng 1 sẽ được <strong>lưu cứng vào hệ thống và KHÔNG thể sửa đổi</strong>. Bạn có chắc chắn muốn chuyển sang chặng tiếp theo?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLockConfirmModal(false)}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={handleExecuteLockStage1}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
              >
                Xác Nhận Khóa &amp; Làm Thực Hành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ANTI-CHEAT WARNING MODAL */}
      {warningModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-md border border-rose-300 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">{warningModal.title}</h3>
                <span className="text-[11px] font-mono font-semibold text-rose-700">
                  Vi phạm: {violationCount} / 3 lần
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">{warningModal.message}</p>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setWarningModal({ ...warningModal, open: false })}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Tôi Đã Hiểu &amp; Tiếp Tục Làm Bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FINAL SUBMIT CONFIRMATION */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Xác Nhận Nộp Bài Khảo Thí?</h3>
                <p className="text-xs text-slate-500">Chấm trắc nghiệm tức thì trong 0.01s</p>
              </div>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div>Thời gian còn lại: <strong className="font-mono text-slate-900">{formatTime(timeRemaining)}</strong></div>
              <div>Đã trả lời: <strong className="font-mono text-slate-900">{answeredCount}/{questions.length}</strong> câu</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
              >
                {isSubmitting ? 'Đang chấm điểm...' : 'Xác Nhận Nộp Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssessmentTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">Đang chuẩn bị phòng thi và bảo mật bài khảo thí...</p>
        </div>
      }
    >
      <AssessmentTakeContent assessmentId={resolvedParams.id} />
    </Suspense>
  );
}

