'use client';

import { useEffect, useState, use, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CompetencyRadarChart } from '@/components/dashboard/personal/CompetencyRadarChart';
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
  Loader2,
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
  Trophy,
  AlertTriangle,
  Compass,
  BookOpen,
  Flag,
  Maximize2,
  Minimize2,
  LayoutGrid,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { QuestionReviewSection, type QuestionReviewItem } from '@/components/dashboard/personal/QuestionReviewSection';
import { useSmartProctoring } from '@/features/assessments/hooks/useSmartProctoring';
import { DynamicWatermark } from '@/features/assessments/components/take/DynamicWatermark';
import { QuestionPaletteDrawer } from '@/features/assessments/components/take/QuestionPaletteDrawer';
import {
  AssessmentSecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
} from '@/features/assessments/types/security.types';

interface Option {
  id: string;
  content: string;
  order_index: number;
  explanation?: string;
  is_correct?: boolean;
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
  explanation?: string;
  scenario_context?: string;
  competencies?: {
    skill_code: string;
    title: string;
    competency_domains?: {
      code: string;
      title: string;
    };
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
  access_tier?: string;
  is_vip?: boolean;
  is_system_baseline?: boolean;
  security_settings?: AssessmentSecuritySettings | null;
}

const CANONICAL_BASELINE_ID = 'a0000000-0000-0000-0000-000000000001';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface AssessmentTakeContentProps {
  assessmentId: string;
  overrideReturnUrl?: string;
  isPreviewMode?: boolean;
  workspaceTitle?: string;
}

function AssessmentTakeContent({
  assessmentId,
  overrideReturnUrl,
  isPreviewMode = false,
  workspaceTitle,
}: AssessmentTakeContentProps) {
  const effectiveId = assessmentId === 'baseline' ? CANONICAL_BASELINE_ID : assessmentId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const pin = searchParams.get('pin');
  const assignmentId = searchParams.get('assignmentId');
  const campaignId = searchParams.get('campaignId');
  const isPreview = isPreviewMode || searchParams.get('preview') === 'true';
  const returnUrlParam = searchParams.get('returnUrl');
  const orgSlugParam = searchParams.get('orgSlug');
  const effectiveReturnUrl =
    overrideReturnUrl ||
    returnUrlParam ||
    (orgSlugParam ? `/org/${orgSlugParam}/assessments/${assessmentId}/edit` : null);

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpgradeRequired, setIsUpgradeRequired] = useState(false);

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
  const [isRoomPaused, setIsRoomPaused] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [lastSaved, setLastSaved] = useState<string>('Vừa xong');
  const [analyzingState, setAnalyzingState] = useState<{
    isAnalyzing: boolean;
    step: number;
    message: string;
  }>({
    isAnalyzing: false,
    step: 1,
    message: '',
  });
  const [chosenFreeDomain, setChosenFreeDomain] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [resultTab, setResultTab] = useState<'OVERVIEW' | 'REVIEW'>('OVERVIEW');
  const [alreadyCompletedInfo, setAlreadyCompletedInfo] = useState<{
    submissionId?: string;
    submittedAt?: string;
    scorePercentage?: number;
  } | null>(null);

  const [candidateUser, setCandidateUser] = useState<{ id?: string; email?: string; fullName?: string }>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCandidateUser({
          id: user.id,
          email: user.email,
          fullName: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email,
        });
      }
    });
  }, []);

  const effectiveSecuritySettings = assessment?.security_settings || DEFAULT_SECURITY_SETTINGS;

  const proctoring = useSmartProctoring({
    settings: effectiveSecuritySettings,
    candidateInfo: {
      userId: candidateUser.id,
      email: candidateUser.email,
      fullName: candidateUser.fullName,
    },
    enabled: Boolean(assessment && !submittedResult),
    onViolation: (event) => {
      // Nếu đang trong phòng thi Live trực tiếp, phát broadcast và ghi nhận sự kiện máy chủ
      if (roomId) {
        try {
          const supabase = createClient();
          supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'TAB_SWITCH_ALERT',
            payload: {
              userId: candidateUser.id,
              fullName: candidateUser.fullName || candidateUser.email || 'Thí sinh',
              eventType: event.type,
              durationSeconds: event.durationSeconds,
              timestamp: event.timestamp,
              details: event.details,
            },
          });
        } catch (e) {
          console.warn('[PROCTORING_BROADCAST_ERR]', e);
        }

        fetch('/api/rooms/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            submissionId: alreadyCompletedInfo?.submissionId || undefined,
            eventType:
              event.type === 'FULLSCREEN_EXIT'
                ? 'FULLSCREEN_EXIT'
                : event.type === 'DEVTOOLS_ATTEMPT'
                ? 'DEVTOOLS_OPENED'
                : 'TAB_HIDDEN',
            severity: event.type === 'DEVTOOLS_ATTEMPT' ? 'HIGH' : 'MEDIUM',
            details: {
              durationSeconds: event.durationSeconds,
              message: event.details,
              violationType: event.type,
            },
          }),
        }).catch((err) => console.warn('[PROCTORING_EVENT_LOG_ERR]', err));
      }
    },
  });

  const toggleFlagQuestion = (qId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleExit = () => {
    if (effectiveReturnUrl) {
      router.push(effectiveReturnUrl);
      return;
    }
    router.push('/personal/dashboard');
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

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
        const qp = new URLSearchParams();
        if (assignmentId) qp.set('assignmentId', assignmentId);
        if (campaignId) qp.set('campaignId', campaignId);
        if (roomId) qp.set('roomId', roomId);
        if (pin) qp.set('pin', pin);
        if (isPreview) qp.set('preview', 'true');
        const qs = qp.toString() ? `?${qp.toString()}` : '';

        const res = await fetch(`/api/assessments/${effectiveId}${qs}`);
        const data = await res.json();

        if (res.status === 401) {
          setError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để làm bài.');
          return;
        }

        if (res.status === 403 && (data.code === 'UPGRADE_REQUIRED' || data.error?.includes('PRO') || data.error?.includes('VIP') || data.error?.includes('nâng cấp'))) {
          setIsUpgradeRequired(true);
          setError(data.error || 'Bài khảo thí này yêu cầu nâng cấp gói tài khoản PRO để tham gia.');
          return;
        }

        if (data.alreadyCompleted) {
          setAlreadyCompletedInfo({
            submissionId: data.submissionId,
            submittedAt: data.submittedAt,
            scorePercentage: data.scorePercentage,
          });
          setLoading(false);
          return;
        }

        const isNewAttempt = searchParams.get('new') === '1';

        if (res.ok && data.assessment && data.items && data.items.length > 0) {
          let loadedItems: Question[] = data.items;

          // Hòa trộn câu hỏi (Shuffle Questions) cho bài khảo thí đầu vào hoặc khi cấu hình shuffle_questions = true
          const isIntakeExam = Boolean(
            effectiveId === CANONICAL_BASELINE_ID ||
            data.assessment.is_system_baseline ||
            data.assessment.title?.toLowerCase().includes('đầu vào')
          );
          const shouldShuffleQuestions = Boolean(
            isIntakeExam ||
            data.assessment.security_settings?.shuffle_questions
          );

          if (shouldShuffleQuestions) {
            const orderStorageKey = `nexa_exam_shuffled_order_${effectiveId}`;
            if (isNewAttempt) {
              localStorage.removeItem(orderStorageKey);
            }
            const savedOrderStr = localStorage.getItem(orderStorageKey);
            if (savedOrderStr && !isNewAttempt) {
              try {
                const savedIds: string[] = JSON.parse(savedOrderStr);
                const itemMap = new Map<string, Question>(data.items.map((it: Question) => [it.id, it]));
                const restoredList: Question[] = [];
                savedIds.forEach((itemId) => {
                  const it = itemMap.get(itemId);
                  if (it) restoredList.push(it);
                });
                data.items.forEach((it: Question) => {
                  if (!savedIds.includes(it.id)) restoredList.push(it);
                });
                if (restoredList.length === data.items.length) {
                  loadedItems = restoredList;
                } else {
                  loadedItems = shuffleArray(data.items);
                  localStorage.setItem(orderStorageKey, JSON.stringify(loadedItems.map((it: Question) => it.id)));
                }
              } catch {
                loadedItems = shuffleArray(data.items);
                localStorage.setItem(orderStorageKey, JSON.stringify(loadedItems.map((it: Question) => it.id)));
              }
            } else {
              loadedItems = shuffleArray(data.items);
              localStorage.setItem(orderStorageKey, JSON.stringify(loadedItems.map((it: Question) => it.id)));
            }
          }

          // Hòa trộn thứ tự đáp án (Shuffle Options) khi cấu hình shuffle_options = true
          const shouldShuffleOptions = Boolean(
            data.assessment.security_settings?.shuffle_options
          );

          if (shouldShuffleOptions) {
            const optionsStorageKey = `nexa_exam_shuffled_options_${effectiveId}`;
            if (isNewAttempt) {
              localStorage.removeItem(optionsStorageKey);
            }
            let savedOptionsMap: Record<string, string[]> = {};
            const savedOptionsStr = localStorage.getItem(optionsStorageKey);
            if (savedOptionsStr && !isNewAttempt) {
              try {
                savedOptionsMap = JSON.parse(savedOptionsStr);
              } catch {
                savedOptionsMap = {};
              }
            }

            const updatedOptionsMap: Record<string, string[]> = {};
            loadedItems = loadedItems.map((item) => {
              if (!item.options || item.options.length <= 1) return item;
              const savedIds = savedOptionsMap[item.id];
              if (savedIds && savedIds.length === item.options.length) {
                const optMap = new Map(item.options.map((o) => [o.id, o]));
                const restoredOpts: Option[] = [];
                savedIds.forEach((id) => {
                  const o = optMap.get(id);
                  if (o) restoredOpts.push(o);
                });
                if (restoredOpts.length === item.options.length) {
                  updatedOptionsMap[item.id] = savedIds;
                  return { ...item, options: restoredOpts };
                }
              }
              const shuffledOpts = shuffleArray(item.options);
              updatedOptionsMap[item.id] = shuffledOpts.map((o) => o.id);
              return { ...item, options: shuffledOpts };
            });
            localStorage.setItem(optionsStorageKey, JSON.stringify(updatedOptionsMap));
          }

          setAssessment(data.assessment);
          setQuestions(loadedItems);
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
          const hasObjective = loadedItems.some(
            (q: Question) => q.type === 'MCQ' || q.type === 'SCENARIO'
          );
          if (!hasObjective) {
            setActiveStage('STAGE_2_PRACTICAL');
            setIsStage1Locked(true);
          }
        } else {
          setError(data.error || 'Bài khảo thí không có câu hỏi hợp lệ hoặc chưa được kích hoạt');
        }

        // Handle fresh attempt vs draft restoration
        if (isNewAttempt) {
          localStorage.removeItem(`nexa_exam_draft_${effectiveId}`);
          localStorage.removeItem(`nexa_exam_draft_text_${effectiveId}`);
          localStorage.removeItem(`nexa_exam_draft_ev_${effectiveId}`);
          localStorage.removeItem(`nexa_exam_draft_live_${effectiveId}`);
          localStorage.removeItem(`nexa_exam_draft_${assessmentId}`);
          setSelectedAnswers({});
          setTextAnswers({});
          setEvidenceUrls({});
          setLiveUrls({});
          setHasStarted(false);
        } else {
          // Restore any local draft
          const cacheKey = `nexa_exam_draft_${effectiveId}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setSelectedAnswers(parsed);
              if (Object.keys(parsed).length > 0) {
                setHasStarted(true);
              }
            } catch {}
          }

          const cacheTextKey = `nexa_exam_draft_text_${effectiveId}`;
          const cachedText = localStorage.getItem(cacheTextKey);
          if (cachedText) {
            try {
              setTextAnswers(JSON.parse(cachedText));
            } catch {}
          }

          const cacheEvKey = `nexa_exam_draft_ev_${effectiveId}`;
          const cachedEv = localStorage.getItem(cacheEvKey);
          if (cachedEv) {
            try {
              setEvidenceUrls(JSON.parse(cachedEv));
            } catch {}
          }

          const cacheLiveKey = `nexa_exam_draft_live_${effectiveId}`;
          const cachedLive = localStorage.getItem(cacheLiveKey);
          if (cachedLive) {
            try {
              setLiveUrls(JSON.parse(cachedLive));
            } catch {}
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối khi tải đề thi');
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [assessmentId, roomId, pin]);

  const isBaseline = Boolean(
    assessmentId === 'baseline' ||
    assessmentId === 'a0000000-0000-0000-0000-000000000001' ||
    assessment?.is_system_baseline ||
    assessment?.title?.toLowerCase().includes('đầu vào') ||
    assessment?.title?.toLowerCase().includes('khảo thí đầu vào')
  );

  // 2. Countdown Timer (Only for Formal Time-Limited Exams, NEVER for Intake Assessment)
  useEffect(() => {
    if (isBaseline || loading || timeRemaining <= 0 || isSubmitting || submittedResult || isRoomPaused) return;

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
  }, [isBaseline, loading, timeRemaining, isSubmitting, submittedResult, isRoomPaused]);

  // 2.1 Live Room Realtime Sync (room:${roomId})
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on('broadcast', { event: 'ROOM_STATE_CHANGE' }, (payload) => {
        const action = payload.payload?.action;
        const subPayload = payload.payload?.payload;

        if (action === 'EXTEND_TIME') {
          const additionalMinutes = Number(subPayload?.additionalMinutes || payload.payload?.additionalMinutes || 5);
          setTimeRemaining((prev) => prev + additionalMinutes * 60);
        } else if (action === 'FORCE_SUBMIT_ALL') {
          handleFinalSubmitRef.current?.();
        } else if (action === 'FORCE_SUBMIT') {
          if (!payload.payload?.targetUserId || payload.payload?.targetUserId === candidateUser.id) {
            handleFinalSubmitRef.current?.();
          }
        } else if (action === 'PAUSE') {
          setIsRoomPaused(true);
        } else if (action === 'RESUME') {
          setIsRoomPaused(false);
        } else if (action === 'END') {
          handleFinalSubmitRef.current?.();
        }
      })
      .on('broadcast', { event: 'PROCTOR_ANNOUNCEMENT' }, (payload) => {
        const targetUserId = payload.payload?.targetUserId;
        const content = payload.payload?.content;
        if (!targetUserId || targetUserId === candidateUser.id) {
          if (content) {
            alert(`[Thông báo từ Giám thị]: ${content}`);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, candidateUser.id]);

  // 2.2 Sync real answers count to live room participants table
  useEffect(() => {
    if (!roomId || !candidateUser.id) return;
    const answeredCount = Object.keys(selectedAnswers).length + Object.keys(textAnswers).filter((k) => textAnswers[k]?.trim()).length;
    const debounceTimer = setTimeout(async () => {
      try {
        const supabase = createClient();
        await supabase
          .from('room_participants')
          .update({
            answers_count: answeredCount,
            total_questions: questions.length,
          })
          .eq('room_id', roomId)
          .eq('user_id', candidateUser.id);
      } catch {}
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [roomId, candidateUser.id, selectedAnswers, textAnswers, questions.length]);

  // 3. Smart Proctoring (Only for Formal Live Exam Rooms with PIN, NEVER for Intake Assessment)
  useEffect(() => {
    // Khảo thí đầu vào hoàn toàn không cần cơ chế giám sát / chống gian lận
    if (isBaseline || !roomId || loading || isSubmitting || submittedResult || isStage1Locked || activeStage !== 'STAGE_1_OBJECTIVE') {
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

        // Send real-time audit event to server if in a live exam room
        if (roomId) {
          fetch('/api/rooms/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId,
              eventType: 'TAB_HIDDEN',
              severity: next >= 3 ? 'HIGH' : next >= 2 ? 'MEDIUM' : 'LOW',
              details: { violationCount: next, stage: activeStage },
            }),
          }).catch(() => {});
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
  }, [isBaseline, roomId, loading, isSubmitting, submittedResult, isStage1Locked, activeStage]);

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

  const answeredCount = Object.keys(selectedAnswers).length;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    activeQuestionsList.forEach((q, idx) => {
      if (selectedAnswers[q.id] || textAnswers[q.id] || evidenceUrls[q.id] || liveUrls[q.id]) {
        set.add(idx);
      }
    });
    return set;
  }, [activeQuestionsList, selectedAnswers, textAnswers, evidenceUrls, liveUrls]);

  const flaggedIndices = useMemo(() => {
    const set = new Set<number>();
    activeQuestionsList.forEach((q, idx) => {
      if (flaggedQuestions[q.id]) {
        set.add(idx);
      }
    });
    return set;
  }, [activeQuestionsList, flaggedQuestions]);

  // Auto-Save Draft every 15s
  useEffect(() => {
    if (questions.length === 0) return;

    const saveTimer = setInterval(() => {
      localStorage.setItem(`nexa_exam_draft_${effectiveId}`, JSON.stringify(selectedAnswers));
      localStorage.setItem(`nexa_exam_draft_text_${effectiveId}`, JSON.stringify(textAnswers));
      localStorage.setItem(`nexa_exam_draft_ev_${effectiveId}`, JSON.stringify(evidenceUrls));
      localStorage.setItem(`nexa_exam_draft_live_${effectiveId}`, JSON.stringify(liveUrls));
      setLastSaved(new Date().toLocaleTimeString('vi-VN'));
    }, 15000);

    return () => clearInterval(saveTimer);
  }, [effectiveId, selectedAnswers, textAnswers, evidenceUrls, liveUrls, questions]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isStage1Locked) return;
    const updated = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(updated);
    localStorage.setItem(`nexa_exam_draft_${effectiveId}`, JSON.stringify(updated));
  };

  const isCurrentAnswered = Boolean(
    currentQ?.type === 'MCQ' || currentQ?.type === 'SCENARIO'
      ? selectedAnswers[currentQ?.id]
      : textAnswers[currentQ?.id] || evidenceUrls[currentQ?.id] || liveUrls[currentQ?.id]
  );

  // Keyboard Shortcuts: ESC (Exit), Enter (Next/Submit when answered)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
        return;
      }

      if (isInput) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (!isCurrentAnswered) return; // Bắt buộc phải chọn đáp án trước khi qua câu tiếp theo
        if (currentIndex < activeQuestionsList.length - 1) {
          setCurrentIndex((prev) => Math.min(activeQuestionsList.length - 1, prev + 1));
        } else {
          setShowConfirmModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeQuestionsList.length, isCurrentAnswered]);

  const handleTextChange = (questionId: string, value: string) => {
    const updated = { ...textAnswers, [questionId]: value };
    setTextAnswers(updated);
    localStorage.setItem(`nexa_exam_draft_text_${effectiveId}`, JSON.stringify(updated));
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

      let submitData: any = null;

      if (isPreview) {
        // Evaluate locally in preview mode (zero-pollution of production submissions)
        const percentage = totalObjectivePoints > 0 ? Math.round((objectiveEarned / totalObjectivePoints) * 100) : 100;
        submitData = {
          totalScore: objectiveEarned,
          maxScore: totalObjectivePoints,
          percentage,
          isPassed: percentage >= (assessment?.passing_score || 70),
          domainScores: { '01': percentage, '02': percentage, '03': percentage, '04': percentage, '05': percentage },
          evaluations: questions.map((q) => {
            const correctOpt = q.options?.find((o: any) => o.is_correct);
            const userOptId = selectedAnswers[q.id];
            const isCorrect = Boolean(correctOpt && correctOpt.id === userOptId);
            return {
              itemId: q.id,
              selectedOptionId: userOptId || null,
              correctOptionId: correctOpt?.id || null,
              isCorrect,
              scoreAwarded: isCorrect ? (q.points || 1) : 0,
              explanation: (q as any).explanation || correctOpt?.explanation || null,
            };
          }),
        };
      } else {
        // Call real backend submit API
        const answersPayload = questions.map((q) => ({
          itemId: q.id,
          selectedOptionId: selectedAnswers[q.id] || null,
          textResponse: textAnswers[q.id] || '',
          evidenceUrl: evidenceUrls[q.id] || null,
          liveUrl: liveUrls[q.id] || null,
        }));

        const totalSec = (assessment?.duration_minutes || 45) * 60;
        const timeSpent = Math.max(0, totalSec - timeRemaining);

        const submitRes = await fetch(`/api/assessments/${effectiveId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classAssignmentId: assignmentId || undefined,
            campaignId: campaignId || undefined,
            timeSpentSeconds: timeSpent,
            answers: answersPayload,
            proctoringEvents: proctoring.events,
          }),
        });

        submitData = await submitRes.json();
        if (!submitRes.ok) {
          if (submitRes.status === 403 && submitData.code === 'UPGRADE_REQUIRED') {
            setIsUpgradeRequired(true);
          }
          throw new Error(submitData.error || 'Nộp bài thất bại');
        }
      }

      if (submitData.unlockedFreeDomain) {
        try {
          localStorage.setItem('nexa_unlocked_domain', submitData.unlockedFreeDomain);
        } catch {}
      }

      const resultPayload = {
        assessmentTitle: assessment?.title || 'Bài Khảo Thí Năng Lực Số',
        objectiveScore: submitData.totalScore ?? submitData.objectiveScore ?? objectiveEarned,
        totalObjectiveScore: submitData.maxScore ?? totalObjectivePoints,
        totalPracticalPoints,
        totalExamPoints: (submitData.maxScore ?? totalObjectivePoints) + totalPracticalPoints,
        hasPractical: stage2Questions.length > 0,
        submissionDate: new Date().toLocaleString('vi-VN'),
        passed: submitData.isPassed ?? ((objectiveEarned / (totalObjectivePoints || 1)) >= ((assessment?.passing_score || 70) / 100)),
        officialScore: submitData.totalScore,
        percentage: submitData.percentage ?? (totalObjectivePoints > 0 ? Math.round(((submitData.totalScore ?? objectiveEarned) / totalObjectivePoints) * 100) : 0),
        pointReward: submitData.pointReward,
        domainScores: submitData.domainScores || null,
        weakestDomainCode: submitData.weakestDomainCode || '01',
        unlockedFreeDomain: submitData.unlockedFreeDomain || '01',
        evaluations: submitData.evaluations || [],
        questionsList: questions,
        userAnswers: { ...selectedAnswers },
        userTextAnswers: { ...textAnswers },
        isBaseline: Boolean(
          assessment?.is_system_baseline ||
          assessment?.title?.toLowerCase().includes('đầu vào') ||
          assessment?.title?.toLowerCase().includes('khảo thí đầu vào')
        ),
      };

      const scores = submitData.domainScores || null;
      const initialUnlocked = submitData.unlockedFreeDomain || submitData.weakestDomainCode || '01';
      setChosenFreeDomain(initialUnlocked);

      // Clean local cache
      localStorage.removeItem(`nexa_exam_draft_${effectiveId}`);
      localStorage.removeItem(`nexa_exam_draft_text_${effectiveId}`);
      localStorage.removeItem(`nexa_exam_draft_ev_${effectiveId}`);
      localStorage.removeItem(`nexa_exam_draft_live_${effectiveId}`);
      localStorage.removeItem(`nexa_exam_draft_${assessmentId}`);
      localStorage.removeItem(`nexa_exam_shuffled_order_${effectiveId}`);
      localStorage.removeItem(`nexa_exam_shuffled_options_${effectiveId}`);

      const isPerfectScore = Boolean(
        scores &&
        Object.values(scores).length >= 5 &&
        Object.values(scores).every((s: any) => typeof s === 'number' && s === 100)
      );

      // Handle Live Room Submission Sync
      if (roomId) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('room_participants')
              .update({
                status: 'SUBMITTED',
                score: objectiveEarned,
                submitted_at: new Date().toISOString(),
                answers_count: Object.keys(selectedAnswers).length,
                total_questions: questions.length,
              })
              .eq('room_id', roomId)
              .eq('user_id', user.id);
          }
        } catch (e) {
          console.warn('Failed to update live room participant record:', e);
        }

        router.push(`/live/submitted?roomId=${roomId}&pin=${pin || ''}`);
        return;
      }

      // Continuous experience: redirect seamlessly to the full-page result view
      if (!isPreview && submitData?.submissionId) {
        router.push(`/personal/assessments/${effectiveId}/result?submissionId=${submitData.submissionId}`);
        return;
      }

      setSubmittedResult(resultPayload);
    } catch (err: any) {
      console.error('[FINAL_SUBMIT_ERROR]:', err);
      alert(err.message || 'Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại.');
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

  // AI Diagnostic Scanner (Transition state)
  if (analyzingState.isAnalyzing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 select-none">
        <div className="max-w-md w-full p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          {/* Animated AI Sonar Pulse */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-blue-500/30 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              {analyzingState.step === 3 ? (
                <Unlock className="w-8 h-8 animate-bounce text-emerald-300" strokeWidth={2} />
              ) : analyzingState.step === 2 ? (
                <Compass className="w-8 h-8 animate-spin" strokeWidth={2} />
              ) : (
                <Sparkles className="w-8 h-8 animate-pulse text-amber-300" strokeWidth={2} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60">
              {isBaseline
                ? (analyzingState.step === 3 ? 'KÍCH HOẠT LỘ TRÌNH' : 'AI CHẨN ĐOÁN NĂNG LỰC')
                : (analyzingState.step === 3 ? 'ĐÃ SẴN SÀNG KẾT QUẢ' : 'ĐANG CHẤM BÀI')}
            </span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isBaseline
                ? (analyzingState.step === 3 ? 'Đã Sẵn Sàng Hồ Sơ Năng Lực' : 'Hệ Thống AI Đang Phân Tích...')
                : (analyzingState.step === 3 ? 'Hoàn Tất Đánh Giá Năng Lực' : 'Hệ Thống Đang Chấm Điểm & Đánh Giá...')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 min-h-[40px] flex items-center justify-center leading-relaxed px-4 transition-all font-sans">
              {analyzingState.message || (isBaseline ? 'Đang phát hiện khoảng trống năng lực...' : 'Tự động phân tích điểm các miền năng lực và đối chiếu chuẩn 70%...')}
            </p>
          </div>

          {/* 3 Step Indicator Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${analyzingState.step >= 1 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-zinc-800'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${analyzingState.step >= 2 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-zinc-800'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${analyzingState.step >= 3 ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200 dark:bg-zinc-800'}`} />
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xl flex flex-col items-center justify-center space-y-3 max-w-sm w-full text-center">
          <div className="w-9 h-9 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-slate-600 dark:text-neutral-400">Đang chuẩn bị câu hỏi khảo thí...</p>
        </div>
      </div>
    );
  }

  // Already Completed Baseline Assessment Screen (Rule: 1 time only per learner)
  if (alreadyCompletedInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" strokeWidth={2} />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-neutral-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              Khảo Thí Đầu Vào Chuẩn 5 Miền
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Bạn Đã Hoàn Thành Khảo Thí Ban Đầu
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
              Mỗi tài khoản người học chỉ thực hiện khảo sát ban đầu duy nhất 1 lần để thiết lập hồ sơ chuẩn 5 miền năng lực số. Điểm số của bạn đã được ghi nhận vào hệ thống.
            </p>
          </div>

          {alreadyCompletedInfo.scorePercentage !== undefined && alreadyCompletedInfo.scorePercentage !== null && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-neutral-400 font-medium">Tỷ lệ đạt chuẩn ban đầu:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm tabular-nums">
                {alreadyCompletedInfo.scorePercentage}%
              </span>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <Link
              href="/personal/learning-path"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Vào Lộ Trình Học Tập (Đã Mở Khóa)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/personal/dashboard"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-neutral-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Bảng Điều Khiển Cá Nhân</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Upgrade Required Screen
  if (isUpgradeRequired) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="max-w-md w-full p-8 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-[#111114] text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100">Yêu Cầu Nâng Cấp Gói PRO</h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            {error || 'Bài khảo thí này thuộc phân hạng PRO nâng cao. Hãy nâng cấp gói tài khoản cá nhân hoặc tham gia qua đợt khảo thí của tổ chức để mở khóa toàn bộ đề thi chuẩn hóa.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/personal/billing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <span>Nâng cấp PRO ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/personal/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-neutral-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Bảng điều khiển</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !assessment || questions.length === 0) {
    const isAuthError = Boolean(error?.toLowerCase().includes('đăng nhập') || error?.toLowerCase().includes('hết hạn'));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="max-w-md w-full p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isAuthError ? 'Phiên Đăng Nhập Đã Hết Hạn' : 'Không Thể Tải Đề Thi'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {isAuthError
                ? 'Phiên làm việc của bạn đã hết hạn bảo mật. Vui lòng đăng nhập lại để tiếp tục làm bài khảo thí.'
                : error || 'Bài thi không tồn tại, chưa có câu hỏi hoặc chưa được phát hành.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {isAuthError ? (
              <Link
                href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : (effectiveReturnUrl || '/personal/dashboard'))}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <span>Đăng Nhập Lại Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={effectiveReturnUrl || "/personal/dashboard"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{effectiveReturnUrl ? 'Quay lại soạn đề' : 'Quay lại Bảng điều khiển'}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Result Screen (After Final Submit)
  if (submittedResult) {
    const domainScores: Record<string, number | null> = submittedResult.domainScores || {
      '01': 80,
      '02': 60,
      '03': 50,
      '04': 75,
      '05': 85,
    };

    const DOMAIN_METADATA: Record<string, { title: string; desc: string }> = {
      '01': {
        title: 'Thông tin & Dữ liệu số',
        desc: 'Duyệt, tìm kiếm, đánh giá độ tin cậy và quản lý dữ liệu số an toàn.',
      },
      '02': {
        title: 'Giao tiếp & Cộng tác số',
        desc: 'Tương tác, chia sẻ, văn hóa số và danh tính số.',
      },
      '03': {
        title: 'Sáng tạo Nội dung số & AI',
        desc: 'Phát triển nội dung đa phương tiện, tích hợp AI, bản quyền số và lập trình.',
      },
      '04': {
        title: 'An toàn & Bảo mật số',
        desc: 'Bảo vệ thiết bị, dữ liệu cá nhân, sức khỏe thể chất/tâm lý và môi trường.',
      },
      '05': {
        title: 'Giải quyết Vấn đề số',
        desc: 'Xử lý sự cố kỹ thuật, ứng dụng công nghệ và tự bồi dưỡng liên tục.',
      },
    };

    const domainList = Object.entries(DOMAIN_METADATA).map(([code, meta]) => {
      const score = domainScores[code] ?? null;
      const isPassed = score !== null && score >= 70;
      return {
        code,
        title: meta.title,
        desc: meta.desc,
        score,
        isPassed,
      };
    });

    const failedDomains = domainList.filter((d) => d.score !== null && !d.isPassed);
    const passedDomains = domainList.filter((d) => d.score !== null && d.isPassed);
    const isAllPassed = failedDomains.length === 0;

    const unlockedCode = chosenFreeDomain || submittedResult.unlockedFreeDomain || submittedResult.weakestDomainCode || '01';
    const unlockedMeta = DOMAIN_METADATA[unlockedCode] || DOMAIN_METADATA['01'];

    const handleSelectFreeDomain = (code: string) => {
      setChosenFreeDomain(code);
      try {
        localStorage.setItem('nexa_unlocked_domain', code);
      } catch {}
    };

    if (!isBaseline) {
      const percentageVal = submittedResult.percentage ?? (submittedResult.maxScore > 0 ? Math.round((submittedResult.totalScore / submittedResult.maxScore) * 100) : 0);
      const isPassedExam = submittedResult.isPassed ?? (percentageVal >= 70);
      const pointsWon = submittedResult.pointsAwarded ?? (isPassedExam ? (assessment?.point_reward || 0) : 0);
      
      const rawQuestions = submittedResult.questionsList || questions;
      const evals = submittedResult.evaluations || [];
      const userAns = submittedResult.userAnswers || selectedAnswers;
      const userTxt = submittedResult.userTextAnswers || textAnswers;

      const reviewItems: QuestionReviewItem[] = rawQuestions.map((q: any, idx: number) => {
        const evalData = evals.find((e: any) => e.itemId === q.id);
        const selectedOptId = evalData?.selectedOptionId || userAns[q.id] || null;
        const correctOptId = evalData?.correctOptionId || q.options?.find((o: any) => o.is_correct)?.id || null;
        const isCorrect = evalData?.isCorrect ?? (selectedOptId && correctOptId ? selectedOptId === correctOptId : false);
        const scoreAwarded = evalData?.scoreAwarded ?? (isCorrect ? (q.points || 1) : 0);
        const explanation = evalData?.explanation || q.explanation || q.options?.find((o: any) => o.id === correctOptId)?.explanation || null;
        const domainCode = evalData?.domainCode || q.competencies?.competency_domains?.code || null;
        const domainTitle = evalData?.domainTitle || q.competencies?.competency_domains?.title || q.competencies?.title || null;

        return {
          index: idx + 1,
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          points: q.points || 1,
          options: q.options || [],
          selectedOptionId: selectedOptId,
          correctOptionId: correctOptId,
          isCorrect: Boolean(isCorrect),
          scoreAwarded,
          explanation,
          domainCode,
          domainTitle,
          textResponse: evalData?.textResponse || userTxt[q.id] || null,
          scenarioContext: q.scenario_context,
        };
      });

      const correctCount = reviewItems.filter(r => r.isCorrect).length;
      const weakestMeta = DOMAIN_METADATA[submittedResult.weakestDomainCode || '01'] || DOMAIN_METADATA['01'];

      return (
        <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 p-4 sm:p-6 md:p-8 flex justify-center items-start animate-in fade-in duration-200">
          <div className="max-w-4xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-sm space-y-6">
            {/* Header Kết Quả Chuẩn Hóa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                    BÁO CÁO ĐÁNH GIÁ NĂNG LỰC SỐ
                  </span>
                  {isPassedExam ? (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ĐẠT CHUẨN NĂNG LỰC (≥ 70%)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>CẦN TIẾP TỤC BỒI DƯỠNG (&lt; 70%)</span>
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {submittedResult.assessmentTitle}
                </h1>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Hoàn thành lúc {submittedResult.submissionDate || new Date().toLocaleTimeString('vi-VN')}
                </p>
              </div>

              {/* View Switcher: Báo Cáo vs Xem Lại Bài Làm */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setResultTab('OVERVIEW')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    resultTab === 'OVERVIEW'
                      ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Báo Cáo Năng Lực</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResultTab('REVIEW')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    resultTab === 'REVIEW'
                      ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xem Lại Bài Làm ({reviewItems.length})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW */}
            {resultTab === 'OVERVIEW' ? (
              <div className="space-y-6">
                {/* 4 Chỉ Số Cốt Lõi */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">Tỷ lệ đạt chuẩn:</span>
                    <div className={`text-2xl font-bold font-mono tabular-nums ${isPassedExam ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {percentageVal}%
                    </div>
                    <span className="text-[10px] text-slate-400">Chuẩn mục tiêu: ≥ 70%</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">Số câu chính xác:</span>
                    <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {correctCount} / {reviewItems.length}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Tự động chấm 0.01s</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">Thời gian làm bài:</span>
                    <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatTime(submittedResult.timeSpentSeconds || 0)}
                    </div>
                    <span className="text-[10px] text-slate-400">Thời lượng: {assessment?.duration_minutes} phút</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">Điểm thưởng tích lũy:</span>
                    <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                      +{pointsWon} PTS
                    </div>
                    <span className="text-[10px] text-slate-400">{isPassedExam ? 'Đã cộng vào hồ sơ' : 'Cần ≥ 70% để nhận'}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: REVIEW MODE */
              <QuestionReviewSection items={reviewItems} />
            )}

            {/* Bottom Actions Footer */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href={effectiveReturnUrl || "/personal/assessments"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-neutral-300 font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{effectiveReturnUrl ? 'Quay lại' : 'Về Danh Sách Đề Thi'}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Khuyến nghị: Bạn nên hoàn thành bài học bồi dưỡng trước khi thi lại để đạt kết quả tốt nhất. Bạn có muốn làm lại đề thi ngay bây giờ?')) {
                      window.location.reload();
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-neutral-300 font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm Lại Đề Thi</span>
                </button>
              </div>

              <Link
                href="/personal/learning-path"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>Vào Lộ Trình Học Tập</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 p-4 sm:p-6 md:p-8 flex justify-center items-start animate-in fade-in duration-200">
        <div className="max-w-4xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-sm space-y-6">
          {/* Header Kết Quả */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-7 h-7" strokeWidth={1.75} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 font-mono">
              HỒ SƠ KHẢO THÍ CHẨN ĐOÁN
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {submittedResult.assessmentTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Nộp bài thành công vào lúc {submittedResult.submissionDate}
            </p>
          </div>

          {/* Biểu đồ Radar 5 Miền & Chỉ Số Tổng Quan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
            {/* Left: CompetencyRadarChart (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-800/80 shadow-xs">
              <div className="w-full flex items-center justify-between px-2 pb-2 text-xs">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Biểu Đồ Radar 5 Miền Năng Lực Số</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">Chuẩn mục tiêu: 70%</span>
              </div>
              <div className="w-full max-w-[340px] py-1 flex items-center justify-center">
                <CompetencyRadarChart
                  data={domainList.map((d) => ({
                    code: d.code,
                    name: d.title.split(',')[0].split('&')[0].trim(),
                    score: d.score,
                    target: 70,
                  }))}
                  showLegend={true}
                  showPercentages={true}
                />
              </div>
            </div>

            {/* Right: Key Stats (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-800 shadow-xs space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">Điểm trắc nghiệm:</span>
                <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {submittedResult.objectiveScore} / {submittedResult.totalObjectiveScore} đ
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Tự động chấm 0.01s</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-800 shadow-xs space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">Tỷ lệ đạt chuẩn:</span>
                <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                  {submittedResult.percentage ?? Math.round((submittedResult.objectiveScore / (submittedResult.totalObjectiveScore || 1)) * 100)}%
                </div>
                <span className="text-[10px] text-slate-500">Mục tiêu chuẩn hóa: 70%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-800 shadow-xs space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">Đánh giá 5 miền:</span>
                <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  {failedDomains.length > 0 ? `${failedDomains.length} miền cần bồi dưỡng` : '5/5 miền đạt chuẩn'}
                </div>
                <span className="text-[10px] text-slate-500">{passedDomains.length}/5 miền vượt ngưỡng 70%</span>
              </div>
            </div>
          </div>

          {/* Khối Mở Khóa: Tự chọn 1 miền nếu đạt 100% (Phương án A) HOẶC Tự động mở miền yếu nhất */}
          {isAllPassed ? (
            <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Xuất sắc! Bạn đã đạt chuẩn tối đa cả 5 miền năng lực số
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                    Hệ thống không phát hiện khoảng trống nào ở cấp độ cơ bản. Bạn được trao quyền tự chọn 1 trong 5 miền dưới đây để <strong>MỞ KHÓA MIỄN PHÍ</strong> và bắt đầu lộ trình bồi dưỡng nâng cao:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {domainList.map((d) => {
                  const isSelected = unlockedCode === d.code;
                  return (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => handleSelectFreeDomain(d.code)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-white dark:bg-[#111114] ring-2 ring-blue-500 shadow-xs'
                          : 'border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 hover:border-slate-300 hover:bg-white dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300">
                          Miền {d.code}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            <Check className="w-3 h-3" /> Đã chọn
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Chọn mở</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                        {d.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-amber-300/80 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">
                    Phát hiện {failedDomains.length} miền năng lực số chưa đạt chuẩn ({failedDomains.map((d) => d.title).join(', ')})
                  </h4>
                  <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                    Để tối ưu hóa quá trình học tập, hệ thống đã tự động kích hoạt lộ trình cá nhân hóa:
                  </p>
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>
                        ĐÃ MỞ KHÓA MIỄN PHÍ: Miền ưu tiên yếu nhất <strong>[{unlockedMeta.title}]</strong> ({domainScores[unlockedCode]}%). Bạn có thể vào học ngay tất cả học phần và bài luyện tập!
                      </span>
                    </div>
                    {failedDomains.length > 1 && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Các miền còn lại đang tạm khóa (yêu cầu gói PRO). Nâng cấp tài khoản để mở khóa toàn bộ 5 lộ trình cùng lúc.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bảng Điểm Chi Tiết 5 Miền Năng Lực Số */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Kết quả chẩn đoán 5 miền năng lực số</span>
              </h3>
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-mono">Hồ sơ năng lực 5 miền</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {domainList.map((d) => (
                <div
                  key={d.code}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    d.isPassed
                      ? 'border-emerald-200/80 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-800/60'
                      : 'border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/60'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{d.title}</span>
                      {d.isPassed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold">
                          <Check className="w-2.5 h-2.5" /> Đạt chuẩn
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 text-[10px] font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Cần bồi dưỡng
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">{d.desc}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-mono text-base font-bold tabular-nums ${d.isPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {d.score !== null ? `${d.score}%` : 'Chưa thi'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Xem Lại Chi Tiết Từng Câu Hỏi & Giải Trình */}
          {(() => {
            const rawQuestions = submittedResult.questionsList || questions;
            const evals = submittedResult.evaluations || [];
            const userAns = submittedResult.userAnswers || selectedAnswers;
            const userTxt = submittedResult.userTextAnswers || textAnswers;

            const reviewItems: QuestionReviewItem[] = rawQuestions.map((q: any, idx: number) => {
              const evalData = evals.find((e: any) => e.itemId === q.id);
              const selectedOptId = evalData?.selectedOptionId || userAns[q.id] || null;
              const correctOptId = evalData?.correctOptionId || q.options?.find((o: any) => o.is_correct)?.id || null;
              const isCorrect = evalData?.isCorrect ?? (selectedOptId && correctOptId ? selectedOptId === correctOptId : false);
              const scoreAwarded = evalData?.scoreAwarded ?? (isCorrect ? (q.points || 1) : 0);
              const explanation = evalData?.explanation || q.explanation || q.options?.find((o: any) => o.id === correctOptId)?.explanation || null;
              const domainCode = evalData?.domainCode || q.competencies?.competency_domains?.code || null;
              const domainTitle = evalData?.domainTitle || q.competencies?.competency_domains?.title || q.competencies?.title || null;

              return {
                index: idx + 1,
                id: q.id,
                prompt: q.prompt,
                type: q.type,
                points: q.points || 1,
                options: q.options || [],
                selectedOptionId: selectedOptId,
                correctOptionId: correctOptId,
                isCorrect: Boolean(isCorrect),
                scoreAwarded,
                explanation,
                domainCode,
                domainTitle,
                textResponse: evalData?.textResponse || userTxt[q.id] || null,
                scenarioContext: q.scenario_context,
              };
            });

            return <QuestionReviewSection items={reviewItems} />;
          })()}

          {/* Nút Điều Hướng CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link
              href={effectiveReturnUrl || "/personal/dashboard"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-neutral-300 font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{effectiveReturnUrl ? 'Quay lại soạn đề' : 'Về Bảng Điều Khiển'}</span>
            </Link>

            <Link
              href={`/personal/learning-path?domain=${unlockedCode}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>Bắt Đầu Học Miền [{unlockedMeta.title}] Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 0. READINESS / CONFIRMATION SCREEN (FOR INTAKE ASSESSMENT)
  if (isBaseline && !hasStarted && answeredCount === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto text-neutral-900 dark:text-neutral-100"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleExit();
        }}
      >
        <div
          className="relative w-full max-w-lg bg-white dark:bg-[#111114] rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6 my-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Khảo Thí Đầu Vào</span>
            </span>
            <button
              type="button"
              onClick={handleExit}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Để sau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Introduction */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans">
              Đánh Giá Năng Lực Số Ban Đầu
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
              Bài khảo thí giúp chẩn đoán khách quan năng lực số theo chuẩn 5 miền, phân tích khoảng trống kỹ năng và tự động mở khóa chặng học bồi dưỡng phù hợp nhất cho bạn. Bài làm không tính giờ áp lực và hệ thống sẽ tự động lưu lại từng đáp án.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={() => setHasStarted(true)}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/25 active:scale-[0.99] cursor-pointer"
            >
              <span>Tôi đã sẵn sàng, Bắt đầu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="w-full sm:w-auto py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium transition-colors cursor-pointer"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderQuestionBody = (q: Question) => {
    if (!q) return null;
    return (
      <div className="space-y-5">
        {/* Scenario Context */}
        {q.scenario_context && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed italic space-y-1">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 not-italic block font-mono text-[11px]">
              Tình huống thực tế:
            </span>
            <p>{q.scenario_context}</p>
          </div>
        )}

        {/* Prompt */}
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug font-sans">
          {q.prompt}
        </h2>

        {/* Options List for MCQ & SCENARIO */}
        {(q.type === 'MCQ' || q.type === 'SCENARIO') && (
          <div className="space-y-3 pt-1">
            {q.options?.map((opt, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const isSelected = selectedAnswers[q.id] === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isStage1Locked}
                  onClick={() => handleSelectOption(q.id, opt.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 sm:gap-4 transition-all duration-150 group cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/25 ring-2 ring-blue-600/20 dark:ring-blue-500/20 shadow-xs'
                      : 'border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-blue-300 dark:hover:border-zinc-700 hover:bg-slate-50/60 dark:hover:bg-zinc-850/60'
                  } ${isStage1Locked ? 'cursor-not-allowed opacity-75' : ''}`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm font-medium flex-1 text-neutral-900 dark:text-neutral-100 leading-snug">
                    {opt.content}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-zinc-700 opacity-40 group-hover:opacity-80'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Practical inputs if any */}
        {(q.type === 'PRACTICAL' ||
          q.type === 'DIGITAL_EVIDENCE' ||
          q.type === 'PRACTICAL_TASK' ||
          q.type === 'PRACTICAL_FILE') && (
          <div className="space-y-4 pt-2 text-xs">
            <div>
              <label className="font-semibold text-neutral-900 dark:text-neutral-100 block mb-1.5">
                Bản tóm tắt giải trình giải pháp / quy trình xử lý
              </label>
              <textarea
                rows={4}
                value={textAnswers[q.id] || ''}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                placeholder="Mô tả công cụ đã dùng, ý tưởng thiết kế hoặc giải pháp kỹ thuật..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2">
                <label className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Tải tệp sản phẩm (PDF, ZIP, Ảnh)</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(q.id, f);
                  }}
                  className="text-[11px] text-slate-500 dark:text-neutral-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-blue-50 dark:file:bg-blue-950 file:text-blue-700 dark:file:text-blue-300"
                />
                {evidenceUrls[q.id] && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    &check; Đã đính kèm tệp tin
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2">
                <label className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Hoặc dán link sản phẩm số</span>
                </label>
                <input
                  type="url"
                  value={liveUrls[q.id] || ''}
                  onChange={(e) => handleLiveUrlChange(q.id, e.target.value)}
                  placeholder="https://canva.com/..., https://figma.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSharedModals = () => (
    <>
      {/* 1. MODAL: ONE-WAY LOCK CONFIRMATION */}
      {showLockConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                <Lock className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Khóa Chặng 1 &amp; Sang Thực Hành?</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">Quy tắc khảo thí khóa một chiều (One-way Lock)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Sau khi chuyển sang Chặng 2 (Thực hành), toàn bộ câu trả lời trắc nghiệm Chặng 1 sẽ được <strong>lưu cứng vào hệ thống và KHÔNG thể sửa đổi</strong>. Bạn có chắc chắn muốn chuyển sang chặng tiếp theo?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLockConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={handleExecuteLockStage1}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Xác Nhận Khóa &amp; Làm Thực Hành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL: ANTI-CHEAT WARNING */}
      {!isBaseline && warningModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-rose-300 dark:border-rose-900 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">{warningModal.title}</h3>
                <span className="text-[11px] font-mono font-semibold text-rose-700 dark:text-rose-400">
                  Vi phạm: {violationCount} / 3 lần
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">{warningModal.message}</p>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setWarningModal({ ...warningModal, open: false })}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Tôi Đã Hiểu &amp; Tiếp Tục Làm Bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: FINAL SUBMIT CONFIRMATION */}
      {showConfirmModal && (() => {
        const uncompletedCount = Math.max(0, questions.length - answeredCount);
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  uncompletedCount > 0
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                }`}>
                  {uncompletedCount > 0 ? (
                    <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {uncompletedCount > 0 ? 'Chưa Hoàn Thành Bài Khảo Thí' : 'Xác Nhận Nộp Bài Khảo Thí?'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {uncompletedCount > 0
                      ? `Bạn còn ${uncompletedCount} câu hỏi chưa có câu trả lời`
                      : 'Hệ thống sẽ chấm điểm và cập nhật năng lực ngay'}
                  </p>
                </div>
              </div>

              {/* Warning when uncompleted */}
              {uncompletedCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Lưu ý quan trọng trước khi nộp bài</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90 pl-5">
                    Các câu chưa trả lời sẽ được tính <strong>0 điểm</strong>. Nếu còn thời gian, bạn nên quay lại để hoàn thành tối đa số câu hỏi.
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-neutral-400 space-y-1.5 font-mono">
                {!isBaseline && (
                  <div className="flex justify-between">
                    <span>Thời gian còn lại:</span>
                    <strong className="text-neutral-900 dark:text-neutral-100">{formatTime(timeRemaining)}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tiến độ hoàn thành:</span>
                  <strong className={uncompletedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-neutral-100'}>
                    {answeredCount}/{questions.length} câu {uncompletedCount > 0 ? `(thiếu ${uncompletedCount} câu)` : '✓'}
                  </strong>
                </div>
                {flaggedCount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Đang gắn cờ xem lại:</span>
                    <strong>{flaggedCount} câu</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {uncompletedCount > 0 ? `Kiểm tra lại (${uncompletedCount} câu)` : 'Kiểm tra lại'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    uncompletedCount > 0
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Đang chấm điểm...' : uncompletedCount > 0 ? 'Vẫn xác nhận nộp bài' : 'Xác nhận nộp bài'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );

  // KHÔNG GIAN KHẢO THÍ TOÀN MÀN HÌNH (FULL-SCREEN EXAM CANVAS CHO TOÀN BỘ ĐỀ THI & ĐẦU VÀO)
  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#000000] flex flex-col text-neutral-900 dark:text-neutral-100 select-none overflow-hidden animate-in fade-in duration-200">
      {/* 1. TOP HEADER (Transparent & Distraction-free) */}
      <header className="h-14 shrink-0 bg-transparent px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
        {/* Left: Exit button & Autosave */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleExit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold cursor-pointer shrink-0"
            title={effectiveReturnUrl ? 'Quay lại trình soạn đề' : 'Thoát về Bảng điều khiển (Esc)'}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{effectiveReturnUrl ? 'Quay lại soạn đề' : 'Rời khỏi'}</span>
          </button>

          {isPreview && (
            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider shrink-0 border border-amber-200/60 dark:border-amber-900/40">
              {workspaceTitle ? `Xem trước • ${workspaceTitle}` : 'Xem trước đề thi'}
            </span>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-mono text-[11px] ml-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tự động lưu: {lastSaved}</span>
          </div>
        </div>

        {/* Center: Stage if multi-stage */}
        {stage2Questions.length > 0 && (
          <div className="hidden md:flex items-center text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300 font-mono text-[11px]">
              {activeStage === 'STAGE_1_OBJECTIVE' ? 'Chặng 1: Trắc nghiệm' : 'Chặng 2: Thực hành'}
            </span>
          </div>
        )}

        {/* Right: Fullscreen + Countdown Timer + Mobile Palette Toggle + Submit Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={proctoring.isFullscreen ? proctoring.exitFullscreen : proctoring.requestFullscreen}
            className="hidden sm:inline-flex p-2 rounded-xl text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={proctoring.isFullscreen ? 'Thu nhỏ màn hình' : 'Mở toàn màn hình'}
          >
            {proctoring.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold tabular-nums transition-colors ${
              timeRemaining < 300
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 animate-pulse'
                : 'bg-slate-100 dark:bg-zinc-800 border-slate-200/80 dark:border-zinc-700 text-slate-800 dark:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Mobile Palette Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobilePalette(!showMobilePalette)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
            title="Mở ma trận câu hỏi"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Nộp bài
          </button>
        </div>
      </header>

      {/* 2. BODY SPLIT: Left Question Area + Right Question Palette Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Main Question Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 flex flex-col justify-between">
          <div className="max-w-3xl w-full mx-auto space-y-6">
            {/* Question Top Subheader */}
            <div className="flex items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Câu {currentIndex + 1} / {activeQuestionsList.length}
                </span>
              </div>

              {/* Bookmark / Flag Button */}
              <button
                type="button"
                onClick={() => toggleFlagQuestion(currentQ.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  flaggedQuestions[currentQ.id]
                    ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title="Đánh dấu câu hỏi cần xem lại trước khi nộp bài"
              >
                <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQ.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{flaggedQuestions[currentQ.id] ? 'Đã gắn cờ xem lại' : 'Đánh dấu xem lại'}</span>
              </button>
            </div>

            {/* Question Body */}
            {renderQuestionBody(currentQ)}
          </div>

          {/* Bottom Navigation Buttons */}
          <footer className="max-w-3xl w-full mx-auto pt-6 flex items-center justify-between text-xs mt-6">
            <button
              type="button"
              disabled={currentIndex === 0 || Boolean(effectiveSecuritySettings?.linear_progression)}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:pointer-events-none font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Câu trước</span>
            </button>

            <button
              type="button"
              onClick={() => toggleFlagQuestion(currentQ.id)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 text-xs font-medium cursor-pointer"
            >
              <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQ.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{flaggedQuestions[currentQ.id] ? 'Bỏ cờ' : 'Gắn cờ xem lại'}</span>
            </button>

            {currentIndex === activeQuestionsList.length - 1 ? (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <span>Nộp bài &amp; Xem kết quả</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(activeQuestionsList.length - 1, prev + 1))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </footer>
        </main>

        {/* Right Edge: Floating Chevron Toggle Button (Only when collapsed on desktop) */}
        {isPaletteCollapsed && (
          <button
            type="button"
            onClick={() => setIsPaletteCollapsed(false)}
            className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 w-7 h-14 bg-white dark:bg-[#111114] border border-r-0 border-slate-200 dark:border-zinc-800 rounded-l-xl shadow-md text-slate-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/80 items-center justify-center transition-all cursor-pointer"
            title="Mở bảng ma trận câu hỏi"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
        )}

        {/* Right: Question Palette Matrix Sidebar (When Open) */}
        {!isPaletteCollapsed && (
          <aside className="w-72 lg:w-80 shrink-0 border-l border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0E0E11] flex flex-col p-5 overflow-y-auto hidden lg:flex space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                  <span>Bảng Ma Trận Câu Hỏi</span>
                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 ml-2">
                    {answeredCount}/{activeQuestionsList.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Click vào số câu để di chuyển nhanh
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaletteCollapsed(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Thu gọn bảng ma trận câu hỏi"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{
                  width: `${activeQuestionsList.length > 0 ? Math.round((answeredCount / activeQuestionsList.length) * 100) : 0}%`,
                }}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-neutral-400 pt-1 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 shrink-0" />
                <span>Đã làm ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-zinc-800 shrink-0 border border-slate-300 dark:border-zinc-700" />
                <span>Chưa làm ({activeQuestionsList.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400 shrink-0" />
                <span>Cờ xem lại ({flaggedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border-2 border-blue-600 shrink-0" />
                <span>Đang chọn</span>
              </div>
            </div>

            {/* Question Number Matrix */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {activeQuestionsList.map((q, qIdx) => {
                  const isCurrent = currentIndex === qIdx;
                  const isAnswered = Boolean(selectedAnswers[q.id] || textAnswers[q.id]);
                  const isFlagged = Boolean(flaggedQuestions[q.id]);

                  let btnStyle = 'border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-850';

                  if (isCurrent) {
                    btnStyle = 'border-2 border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-bold';
                  } else if (isFlagged) {
                    btnStyle = 'border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold';
                  } else if (isAnswered) {
                    btnStyle = 'border-transparent bg-blue-600 text-white font-semibold';
                  }

                  const isLinearDisabled = Boolean(effectiveSecuritySettings?.linear_progression && qIdx < currentIndex);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      disabled={isLinearDisabled}
                      onClick={() => {
                        if (!isLinearDisabled) setCurrentIndex(qIdx);
                      }}
                      className={`relative h-9 rounded-xl text-xs font-mono flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${btnStyle}`}
                    >
                      <span>{qIdx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white dark:ring-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer Progress Summary (Đã loại bỏ nút Nộp bài thi trùng lặp) */}
            <div className="pt-2 text-[11px] text-slate-500 dark:text-neutral-400 text-center font-mono">
              Đã hoàn thành {answeredCount}/{activeQuestionsList.length} câu ({activeQuestionsList.length > 0 ? Math.round((answeredCount / activeQuestionsList.length) * 100) : 0}%)
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Question Palette Drawer */}
      <QuestionPaletteDrawer
        isOpen={showMobilePalette}
        onClose={() => setShowMobilePalette(false)}
        totalQuestions={activeQuestionsList.length}
        currentIndex={currentIndex}
        answeredIndices={answeredIndices}
        flaggedIndices={flaggedIndices}
        onSelectQuestion={(idx) => {
          if (effectiveSecuritySettings?.linear_progression && idx < currentIndex) {
            return;
          }
          setCurrentIndex(idx);
          setShowMobilePalette(false);
        }}
        isLinear={Boolean(effectiveSecuritySettings?.linear_progression)}
      />

      {/* Dynamic Watermark (T6) - Chỉ bật trong phòng thi trực tiếp B2B có giám thị */}
      <DynamicWatermark
        candidateEmail={candidateUser.email}
        candidateId={candidateUser.id}
        assessmentCode={assessment?.title}
        enabled={Boolean(effectiveSecuritySettings?.dynamic_watermark && roomId)}
      />

      {/* Active Warning Modal (T4: Active Warning Mode) */}
      {proctoring.activeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#111114] border border-amber-300 dark:border-amber-700/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Cảnh báo giám sát thi ({proctoring.activeWarning.violationCount})
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400">Hệ thống phát hiện bất thường</p>
              </div>
            </div>
            <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
              {proctoring.activeWarning.message}
            </p>
            <div className="text-xs text-slate-500 dark:text-neutral-400">
              Lưu ý: Mọi vi phạm đều được hệ thống ghi nhận vào bản đánh giá độ tin cậy. Bạn vẫn có thể tiếp tục làm bài bình thường.
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={proctoring.dismissWarning}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                Đã hiểu & Tiếp tục làm bài
              </button>
            </div>
          </div>
        </div>
      )}

      {renderSharedModals()}
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
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">Đang chuẩn bị câu hỏi khảo thí...</p>
        </div>
      }
    >
      <AssessmentTakeContent assessmentId={resolvedParams.id} />
    </Suspense>
  );
}

