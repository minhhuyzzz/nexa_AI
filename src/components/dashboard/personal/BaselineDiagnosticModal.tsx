'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Compass,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  Trophy,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { CompetencyRadarChart, DomainScore } from '@/components/dashboard/personal/CompetencyRadarChart';

interface QuestionOption {
  id: string;
  content: string;
  order_index?: number;
}

interface QuestionItem {
  id: string;
  prompt: string;
  points?: number;
  type?: string;
  scenario_context?: string | null;
  competency_id?: string;
  competencies?: {
    skill_code?: string;
    title?: string;
    competency_domains?: {
      code?: string;
      title?: string;
    };
  };
  options?: QuestionOption[];
}

interface QuestionEvaluation {
  itemId: string;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean | null;
  scoreAwarded: number | null;
  maxPoints: number;
  explanation: string | null;
  domainCode: string;
  domainTitle: string;
}

interface SubmitResultData {
  totalScore: number;
  maxScore: number;
  percentage: number;
  domainScores: Record<string, number | null>;
  weakestDomainCode: string;
  unlockedFreeDomain: string;
  evaluations: QuestionEvaluation[];
  submissionDate: string;
}

interface BaselineDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: (result: { unlockedFreeDomain: string; domainScores: Record<string, number | null> }) => void;
}

type ModalStep = 'INTRO' | 'EXAM' | 'ANALYZING' | 'RESULT';

const DOMAIN_CATALOG = [
  { code: '01', title: 'Thông tin & Dữ liệu số' },
  { code: '02', title: 'Giao tiếp & Cộng tác số' },
  { code: '03', title: 'Sáng tạo Nội dung số & AI' },
  { code: '04', title: 'An toàn & Bảo mật số' },
  { code: '05', title: 'Giải quyết Vấn đề số' },
];

export function BaselineDiagnosticModal({ isOpen, onClose, onCompleted }: BaselineDiagnosticModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<ModalStep>('INTRO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assessmentMeta, setAssessmentMeta] = useState<{
    id: string;
    title: string;
    passing_score: number;
  } | null>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analyzing state (simulated AI scanner)
  const [analyzingStage, setAnalyzingStage] = useState(1);
  const [analyzingProgress, setAnalyzingProgress] = useState(15);
  const [analyzingMsg, setAnalyzingMsg] = useState('AI đang phân tích các câu trả lời và đối chiếu 5 miền năng lực số...');

  // Unlocking lock animation state
  const [isLockPopped, setIsLockPopped] = useState(false);

  // Result state
  const [submitResult, setSubmitResult] = useState<SubmitResultData | null>(null);
  const [chosenFreeDomain, setChosenFreeDomain] = useState<string>('01');
  const [showReviewAnswers, setShowReviewAnswers] = useState(false);

  // Prevent double fetch
  const hasLoadedRef = useRef(false);

  // Fetch baseline questions dynamically when modal opens
  useEffect(() => {
    if (!isOpen) {
      setStep('INTRO');
      setCurrentIndex(0);
      setSelectedAnswers({});
      setSubmitResult(null);
      setError(null);
      setIsLockPopped(false);
      hasLoadedRef.current = false;
      return;
    }

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    async function loadBaselineData() {
      setLoading(true);
      setError(null);
      try {
        const metaRes = await fetch('/api/assessments/baseline', { cache: 'no-store' });
        const metaJson = await metaRes.json();
        const base = metaJson?.baselineAssessment;

        const effectiveId = base?.id || 'a0000000-0000-0000-0000-000000000001';

        const examRes = await fetch(`/api/assessments/${effectiveId}`, { cache: 'no-store' });
        const examJson = await examRes.json();

        if (examJson.alreadyCompleted) {
          setError('Bạn đã hoàn thành bài khảo sát ban đầu. Hãy vào Lộ trình học tập để tiếp tục rèn luyện!');
          setAssessmentMeta({
            id: effectiveId,
            title: base?.title || 'Khảo Sát Năng Lực Số Chuẩn 5 Miền',
            passing_score: base?.passing_score || 70,
          });
          setLoading(false);
          return;
        }

        if (!examRes.ok || !examJson.items || examJson.items.length === 0) {
          throw new Error(examJson.error || 'Bài khảo sát chưa có câu hỏi');
        }

        setAssessmentMeta({
          id: examJson.assessment?.id || effectiveId,
          title: examJson.assessment?.title || base?.title || 'Khảo Sát Năng Lực Số Chuẩn 5 Miền',
          passing_score: examJson.assessment?.passing_score || 70,
        });

        // Dynamic questions count set from Admin DB
        setQuestions(examJson.items);
      } catch (err: any) {
        console.error('Lỗi nạp bài khảo sát đầu vào:', err);
        setError(err.message || 'Không thể tải câu hỏi khảo sát');
      } finally {
        setLoading(false);
      }
    }

    loadBaselineData();
  }, [isOpen]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitExam = async () => {
    if (!assessmentMeta) return;

    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${totalQuestions} câu hỏi. Bạn có chắc chắn muốn gửi kết quả khảo sát không?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    setStep('ANALYZING');
    setAnalyzingStage(1);
    setAnalyzingProgress(20);
    setAnalyzingMsg('AI đang phân tích câu trả lời và đối chiếu hồ sơ 5 miền năng lực số...');

    try {
      const payload = {
        timeSpentSeconds: 0,
        answers: questions.map((q) => ({
          itemId: q.id,
          selectedOptionId: selectedAnswers[q.id] || null,
        })),
      };

      const res = await fetch(`/api/assessments/${assessmentMeta.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi gửi kết quả khảo sát');
      }

      const unlockedDomain = data.unlockedFreeDomain || data.weakestDomainCode || '01';
      setChosenFreeDomain(unlockedDomain);

      try {
        localStorage.setItem('nexa_unlocked_domain', unlockedDomain);
      } catch {}

      const resultData: SubmitResultData = {
        totalScore: data.totalScore ?? answeredCount,
        maxScore: data.maxScore ?? totalQuestions,
        percentage: data.percentage ?? 0,
        domainScores: data.domainScores || { '01': 50, '02': 50, '03': 50, '04': 50, '05': 50 },
        weakestDomainCode: data.weakestDomainCode || '01',
        unlockedFreeDomain: unlockedDomain,
        evaluations: data.evaluations || [],
        submissionDate: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setSubmitResult(resultData);

      // Smooth progress & AI text transitions over 3.2s
      setTimeout(() => {
        setAnalyzingStage(2);
        setAnalyzingProgress(65);
        setAnalyzingMsg('Đang nhận diện khoảng trống năng lực & tối ưu hóa lộ trình...');
      }, 1100);

      setTimeout(() => {
        setAnalyzingStage(3);
        setAnalyzingProgress(95);
        setAnalyzingMsg('Kích hoạt quyền mở khóa lộ trình học tập miễn phí...');
      }, 2100);

      setTimeout(() => {
        setStep('RESULT');
        setIsSubmitting(false);

        // Trigger unlock animation sequence
        setTimeout(() => {
          setIsLockPopped(true);
        }, 400);

        if (onCompleted) {
          onCompleted({
            unlockedFreeDomain: unlockedDomain,
            domainScores: resultData.domainScores,
          });
        }
      }, 3100);
    } catch (err: any) {
      console.error('Lỗi khi nộp bài khảo sát đầu vào:', err);
      alert(err.message || 'Đã có lỗi xảy ra khi nộp bài khảo sát.');
      setStep('EXAM');
      setIsSubmitting(false);
    }
  };

  const handleGoToLearningPath = () => {
    const targetCode = chosenFreeDomain || submitResult?.unlockedFreeDomain || '01';
    onClose();
    router.push(`/personal/learning-path?domain=${targetCode}`);
  };

  const radarScores: DomainScore[] = useMemo(() => {
    if (!submitResult?.domainScores) return [];
    return DOMAIN_CATALOG.map((dom) => ({
      code: dom.code,
      name: dom.title.split('&')[0].trim(),
      score: submitResult.domainScores[dom.code] ?? 0,
      target: 70,
    }));
  }, [submitResult]);

  const isPerfectScore = useMemo(() => {
    if (!submitResult?.domainScores) return false;
    const scores = Object.values(submitResult.domainScores).filter((s) => s !== null) as number[];
    return scores.length >= 5 && scores.every((s) => s >= 90);
  }, [submitResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#111114] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* BƯỚC 1: GIỚI THIỆU KHẢO SÁT (INTRO)                       */}
        {/* Đã xóa card quy mô & thay bằng Animation Radar AI nhẹ mượt */}
        {/* ========================================================= */}
        {step === 'INTRO' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                Thiết lập Hồ sơ Năng lực Số
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                Khảo sát nhanh để hệ thống nhận diện điểm mạnh và khoảng trống kỹ năng, từ đó tự động mở khóa miễn phí lộ trình học tập tối ưu cho bạn.
              </p>
            </div>

            {loading ? (
              <div className="py-14 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-medium">Đang chuẩn bị câu hỏi khảo sát...</p>
              </div>
            ) : error ? (
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Thông báo</span>
                </div>
                <p>{error}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push('/personal/learning-path');
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Vào Lộ Trình Học Tập Ngay
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* SVG AI Radar Scanner Animation — Nhẹ nhàng, sinh động, không gây nặng máy */}
                <div className="relative py-6 px-4 rounded-2xl bg-gradient-to-b from-blue-50/70 via-slate-50/50 to-transparent dark:from-blue-950/20 dark:via-zinc-900/40 dark:to-transparent border border-blue-100/70 dark:border-zinc-800 flex flex-col items-center justify-center overflow-hidden">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    {/* Concentric radar rings */}
                    <div className="absolute inset-0 rounded-full border border-blue-200/60 dark:border-blue-900/40 animate-ping opacity-40 duration-1000" />
                    <div className="absolute inset-4 rounded-full border border-dashed border-blue-300/70 dark:border-blue-800/60 animate-spin [animation-duration:16s]" />
                    <div className="absolute inset-10 rounded-full border border-blue-200/80 dark:border-blue-900/60" />

                    {/* 5 Satellite Domain Nodes */}
                    {[0, 72, 144, 216, 288].map((deg, i) => {
                      const rad = (deg * Math.PI) / 180;
                      const x = 70 * Math.cos(rad);
                      const y = 70 * Math.sin(rad);
                      return (
                        <div
                          key={i}
                          style={{ transform: `translate(${x}px, ${y}px)` }}
                          className="absolute w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 font-mono font-bold text-[10px] flex items-center justify-center shadow-xs transition-transform duration-500 hover:scale-125"
                        >
                          D{i + 1}
                        </div>
                      );
                    })}

                    {/* Central AI Core */}
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 mt-2 text-center">
                    Khảo sát đa chiều 5 miền năng lực số &bull; Tự động hóa lộ trình cá nhân
                  </p>
                </div>

                {/* 5 Miền năng lực số: 5 Thẻ ngang gọn gàng */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  {DOMAIN_CATALOG.map((dom, i) => (
                    <div
                      key={dom.code}
                      className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/70 dark:border-zinc-800 flex flex-col justify-between gap-1"
                    >
                      <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                        0{i + 1}
                      </span>
                      <span className="text-neutral-800 dark:text-zinc-200 font-semibold text-[11px] leading-tight">
                        {dom.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Thẻ quyền lợi mở khóa */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Quyền lợi sau khi hoàn thành:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
                    Hệ thống chẩn đoán điểm số 5 miền. Miền năng lực có điểm thấp nhất sẽ được <strong>TỰ ĐỘNG MỞ KHÓA MIỄN PHÍ</strong> để bạn bắt đầu bồi dưỡng kiến thức ngay lập tức.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold text-center transition-colors cursor-pointer"
                  >
                    Để sau, về Bảng điều khiển
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('EXAM')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center inline-flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer shadow-blue-500/20"
                  >
                    <span>Bắt đầu làm bài khảo sát ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 2: KHÔNG GIAN LÀM BÀI KHẢO SÁT (EXAM)                */}
        {/* Đã loại bỏ hoàn toàn các ô câu 1,2,3 và chữ 'CÂU HỎI 1'  */}
        {/* Giao diện tinh tế, tập trung, chuẩn Typeform/Linear      */}
        {/* ========================================================= */}
        {step === 'EXAM' && currentQuestion && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Thanh tiến trình siêu mượt trên cùng */}
            <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 w-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Header tinh giản tối đa: Chỉ hiển thị tiến độ thanh thoát */}
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/30">
              <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                {currentQuestion.competencies?.competency_domains?.title || 'Khảo sát năng lực số'}
              </span>

              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-neutral-400">
                Tiến độ: <strong className="text-blue-600 dark:text-blue-400 font-bold">{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</strong>
              </span>
            </div>

            {/* Body: Tập trung trọn vẹn vào câu hỏi và 4 lựa chọn */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
              {/* Nội dung câu hỏi (Không còn chữ CÂU HỎI 1) */}
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug tracking-tight">
                  {currentQuestion.prompt}
                </h3>

                {currentQuestion.scenario_context && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-neutral-300 italic">
                    {currentQuestion.scenario_context}
                  </div>
                )}
              </div>

              {/* 4 Phương án trả lời thiết kế cao cấp, dễ bấm */}
              <div className="space-y-3">
                {(currentQuestion.options || []).map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3.5 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-neutral-800 dark:text-zinc-200 hover:border-slate-300 hover:bg-slate-50/70 dark:hover:bg-zinc-850'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300'
                        }`}
                      >
                        {letter}
                      </div>

                      <span className="flex-1 leading-relaxed font-medium">
                        {opt.content}
                      </span>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation tinh gọn */}
            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2.5 rounded-xl text-neutral-600 dark:text-zinc-400 font-semibold disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-slate-200/60 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>

              <div className="flex items-center gap-2.5">
                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-2 transition-colors shadow-xs cursor-pointer shadow-blue-500/20"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitExam}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-2 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý kết quả...</span>
                      </>
                    ) : (
                      <>
                        <span>Nộp kết quả khảo sát</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 3: MÔ PHỎNG AI PHÂN TÍCH RADAR SIÊU MƯỢT (ANALYZING) */}
        {/* ========================================================= */}
        {step === 'ANALYZING' && (
          <div className="p-10 sm:p-14 text-center space-y-6 flex flex-col items-center justify-center">
            {/* Vòng quay Radar Quét Đa Chiều Mượt Mà */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-xl animate-pulse" />
              <div className="absolute inset-1 rounded-full border-2 border-blue-500/20 animate-ping [animation-duration:2.5s]" />
              <div className="absolute inset-2 rounded-full border border-dashed border-blue-400/50 animate-spin [animation-duration:8s]" />

              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-300">
                {analyzingStage === 3 ? (
                  <Unlock className="w-8 h-8 text-emerald-300 animate-bounce" strokeWidth={2} />
                ) : analyzingStage === 2 ? (
                  <Compass className="w-8 h-8 animate-spin [animation-duration:3s]" strokeWidth={2} />
                ) : (
                  <Sparkles className="w-8 h-8 animate-pulse text-amber-300" strokeWidth={2} />
                )}
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60">
                {analyzingStage === 3 ? 'KÍCH HOẠT LỘ TRÌNH' : 'AI CHẨN ĐOÁN NĂNG LỰC'}
              </span>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 transition-all duration-300">
                {analyzingStage === 3
                  ? 'Đã Sẵn Sàng Hồ Sơ Năng Lực'
                  : 'Hệ Thống AI Đang Phân Tích...'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 min-h-[36px] flex items-center justify-center leading-relaxed transition-all duration-300">
                {analyzingMsg}
              </p>
            </div>

            {/* Thanh tiến trình phân tích mượt mà */}
            <div className="w-56 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${analyzingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BƯỚC 4: KẾT QUẢ & HIỆU ỨNG MỞ KHÓA + ĐỐI SOÁT ĐÁP ÁN (RESULT) */}
        {/* ========================================================= */}
        {step === 'RESULT' && submitResult && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            {/* Header Kết Quả */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                <Trophy className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                HỒ SƠ KHẢO THÍ CHẨN ĐOÁN HOÀN TẤT
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Bản Đồ Năng Lực Số 5 Miền Của Bạn
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Nộp bài thành công vào lúc {submitResult.submissionDate}
              </p>
            </div>

            {/* Radar Chart & Key Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
              {/* Radar Chart (7 cols) */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-800/80 shadow-xs">
                <div className="w-full flex items-center justify-between px-2 pb-2 text-xs">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Biểu Đồ Radar 5 Miền Năng Lực Số</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Chuẩn mục tiêu: 70%</span>
                </div>
                <div className="w-full max-w-[320px] py-1 flex items-center justify-center">
                  <CompetencyRadarChart
                    data={radarScores}
                    showLegend={true}
                    showPercentages={true}
                  />
                </div>
              </div>

              {/* Stats (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-800 shadow-xs space-y-1">
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
                    Số câu đúng &amp; Điểm số:
                  </span>
                  <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {submitResult.totalScore} / {submitResult.maxScore} đ
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Tự động chấm 0.01s</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-800 shadow-xs space-y-1">
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
                    Chuẩn hóa 5 miền năng lực:
                  </span>
                  <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                    {submitResult.percentage}%
                  </div>
                  <span className="text-[10px] text-slate-500">Bình quân 20% mỗi miền</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-800 shadow-xs space-y-1">
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block">
                    Miền cần ưu tiên bồi dưỡng:
                  </span>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400 line-clamp-1">
                    {DOMAIN_CATALOG.find((d) => d.code === submitResult.weakestDomainCode)?.title || 'Miền 01'}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Điểm miền: {submitResult.domainScores[submitResult.weakestDomainCode] ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* HIỆU ỨNG MỞ Ổ KHÓA SINH ĐỘNG */}
            {isPerfectScore ? (
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
                      Hệ thống không phát hiện khoảng trống nào. Bạn được trao quyền tự chọn 1 trong 5 miền dưới đây để <strong>MỞ KHÓA MIỄN PHÍ</strong> và bắt đầu lộ trình bồi dưỡng nâng cao:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {DOMAIN_CATALOG.map((d) => {
                    const isSelected = chosenFreeDomain === d.code;
                    return (
                      <button
                        key={d.code}
                        type="button"
                        onClick={() => {
                          setChosenFreeDomain(d.code);
                          try {
                            localStorage.setItem('nexa_unlocked_domain', d.code);
                          } catch {}
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-white dark:bg-[#111114] ring-2 ring-blue-500 shadow-xs'
                            : 'border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300">
                            Miền {d.code}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">
                              <Check className="w-3 h-3" /> Đã chọn
                            </span>
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
              <div className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-700 space-y-3 text-xs ${
                isLockPopped
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40'
              }`}>
                {/* Hiệu ứng tia sáng phát quang khi mở khóa */}
                {isLockPopped && (
                  <div className="absolute -right-6 -top-6 w-28 h-28 bg-emerald-400/20 rounded-full blur-xl pointer-events-none animate-pulse" />
                )}

                <div className="flex items-start gap-4">
                  {/* Biểu tượng Ổ Khóa Mở với hiệu ứng bung chốt, sóng xung kích (Pulse Shockwave) & Ngôi sao lấp lánh */}
                  <div className="relative shrink-0">
                    {isLockPopped && (
                      <span className="absolute inset-0 rounded-2xl bg-emerald-500/30 animate-ping [animation-duration:1.5s]" />
                    )}
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all duration-700 ${
                      isLockPopped
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white scale-105 shadow-emerald-500/40'
                        : 'bg-amber-500 text-white scale-95'
                    }`}>
                      {isLockPopped ? (
                        <div className="relative flex items-center justify-center animate-in zoom-in-75 duration-500">
                          <Unlock className="w-6 h-6 text-white" strokeWidth={2.4} />
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-spin [animation-duration:4s]" />
                        </div>
                      ) : (
                        <Lock className="w-5 h-5 text-white" strokeWidth={2} />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase tracking-wide inline-flex items-center gap-1 transition-colors duration-500 ${
                        isLockPopped
                          ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200'
                          : 'bg-slate-200 dark:bg-zinc-800 text-slate-600'
                      }`}>
                        {isLockPopped && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>ĐÃ MỞ KHÓA MIỄN PHÍ</span>
                      </span>
                      {isLockPopped && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-500">
                          (Sẵn sàng vào học)
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 flex-wrap">
                      <span>Miền ưu tiên bồi dưỡng:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        [{DOMAIN_CATALOG.find((d) => d.code === submitResult.weakestDomainCode)?.title}]
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        ({submitResult.domainScores[submitResult.weakestDomainCode] ?? 0}%)
                      </span>
                    </h4>

                    <p className="text-slate-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                      Ổ khóa học phần của miền này đã được mở! Bạn có thể vào học ngay toàn bộ bài giảng và bài tập thực hành hoàn toàn miễn phí.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ACCORDION: ĐỐI SOÁT ĐÁP ÁN (HIỆN RÕ ĐÁP ÁN CỦA BẠN VÀ ĐÁP ÁN ĐÚNG) */}
            {submitResult.evaluations && submitResult.evaluations.length > 0 && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowReviewAnswers((prev) => !prev)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 text-xs font-bold text-neutral-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Xem lại đáp án &amp; giải thích chi tiết ({submitResult.evaluations.length} câu)</span>
                  </span>
                  {showReviewAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showReviewAnswers && (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {submitResult.evaluations.map((ev, i) => {
                      const matchedQ = questions.find((q) => q.id === ev.itemId);
                      const isCorrect = Boolean(ev.isCorrect);

                      const userOption = matchedQ?.options?.find((o) => o.id === ev.selectedOptionId);
                      const correctOption = matchedQ?.options?.find((o) => o.id === ev.correctOptionId);

                      return (
                        <div
                          key={ev.itemId}
                          className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                            isCorrect
                              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                              : 'border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-500">Câu {i + 1}</span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 ${
                                isCorrect
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              }`}
                            >
                              {isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đúng</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  <span>Chưa đúng</span>
                                </>
                              )}
                            </span>
                          </div>

                          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-[13px]">
                            {matchedQ?.prompt || `Câu hỏi số ${i + 1}`}
                          </p>

                          {/* Hiển thị rõ lựa chọn của bạn và đáp án chính xác */}
                          <div className="space-y-1.5 pt-1">
                            {/* Đáp án bạn chọn */}
                            <div className={`p-2.5 rounded-lg flex items-center justify-between ${
                              isCorrect
                                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                                : 'bg-red-100/70 dark:bg-red-950/60 text-red-900 dark:text-red-200'
                            }`}>
                              <span className="font-medium">
                                <strong>Lựa chọn của bạn:</strong> {userOption ? userOption.content : '(Chưa chọn câu trả lời)'}
                              </span>
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                              )}
                            </div>

                            {/* Nếu làm sai thì hiện rõ đáp án đúng */}
                            {!isCorrect && correctOption && (
                              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                                <span className="font-semibold">
                                  <strong>Đáp án chính xác:</strong> {correctOption.content}
                                </span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              </div>
                            )}
                          </div>

                          {/* Giải thích sư phạm */}
                          {ev.explanation && (
                            <p className="text-[11px] text-slate-600 dark:text-neutral-300 bg-white/70 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 leading-relaxed">
                              <strong>Giải thích:</strong> {ev.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons dẫn vào lộ trình */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.refresh();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-neutral-300 font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-center"
              >
                Về Bảng Điều Khiển
              </button>

              <button
                type="button"
                onClick={handleGoToLearningPath}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer text-center"
              >
                <span>Vào Lộ Trình Học Tập (Miền Đã Mở Khóa)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
