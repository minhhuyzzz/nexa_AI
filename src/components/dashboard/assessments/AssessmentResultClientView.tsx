'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  Filter,
  FileText,
  Paperclip,
  Sparkles,
  Trophy,
  AlertCircle,
  Award,
} from 'lucide-react';
import { AIGradingCard, type AIEvaluationView } from '@/components/assessment/AIGradingCard';

export interface ResultAnswerItem {
  id: string;
  itemId: string;
  scoreAwarded: number;
  isCorrect: boolean;
  selectedOptionId: string | null;
  textResponse: string | null;
  evidenceUrl: string | null;
  prompt: string;
  points: number;
  orderIndex: number;
  competencyCode?: string;
  competencyTitle?: string;
  options: {
    id: string;
    content: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

interface AssessmentResultClientViewProps {
  assessmentId: string;
  assessmentTitle: string;
  isPassed: boolean;
  scoreOn10: number;
  percentage: number;
  pointsAwarded: number;
  timeSpentSeconds: number;
  submittedAt: string;
  answers: ResultAnswerItem[];
  evalMap?: Record<string, AIEvaluationView>;
  submissionId: string;
}

export function AssessmentResultClientView({
  assessmentId,
  assessmentTitle,
  isPassed,
  scoreOn10,
  percentage,
  pointsAwarded,
  timeSpentSeconds,
  submittedAt,
  answers,
  evalMap = {},
  submissionId,
}: AssessmentResultClientViewProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'INCORRECT' | 'CORRECT'>('ALL');

  const correctAnswers = useMemo(() => answers.filter((a) => a.isCorrect), [answers]);
  const incorrectAnswers = useMemo(() => answers.filter((a) => !a.isCorrect), [answers]);

  const filteredAnswers = useMemo(() => {
    if (filterMode === 'INCORRECT') return incorrectAnswers;
    if (filterMode === 'CORRECT') return correctAnswers;
    return answers;
  }, [filterMode, answers, incorrectAnswers, correctAnswers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} giây`;
    return `${mins} phút ${secs} giây`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8FAFC] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 flex flex-col select-auto animate-in fade-in duration-200">
      {/* 1. Immersive Fullscreen Top Navigation Bar */}
      <header className="h-14 sm:h-16 shrink-0 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/personal/assessments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>Thoát về Thư viện đề</span>
          </Link>
          <span className="text-xs text-slate-400 dark:text-neutral-500 font-mono hidden sm:inline">
            | Báo Cáo Kết Quả Khảo Thí
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/personal/take/${assessmentId}`}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Thi lại</span>
          </Link>
          <Link
            href="/personal/learning-path"
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Lộ trình học tập</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Fullscreen Content Canvas */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-20">
        {/* Hero Result Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border ${
                  isPassed
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}
              >
                {isPassed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>ĐẠT CHUẨN NĂNG LỰC SỐ (≥ 70%)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>CẦN TIẾP TỤC BỒI DƯỠNG (&lt; 70%)</span>
                  </>
                )}
              </span>

              {pointsAwarded > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold font-mono border border-blue-200 dark:border-blue-900 inline-flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>+{pointsAwarded} PTS tích lũy</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {assessmentTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Hoàn thành lúc {submittedAt ? new Date(submittedAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')}
            </p>
          </div>

          {/* Big Score Badges */}
          <div className="flex items-center gap-5 sm:gap-6 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shrink-0">
            <div className="text-center sm:text-right">
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 block uppercase font-mono tracking-wider">
                ĐIỂM SỐ
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                {scoreOn10.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 10</span>
              </div>
            </div>

            <div className="w-px h-10 bg-slate-200 dark:bg-zinc-800" />

            <div className="text-center sm:text-right">
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 block uppercase font-mono tracking-wider">
                TỶ LỆ ĐẠT
              </span>
              <div
                className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                  isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">Số câu chính xác:</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
              {correctAnswers.length} / {answers.length}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
              {answers.length > 0 ? `${Math.round((correctAnswers.length / answers.length) * 100)}% độ chính xác` : 'Chưa có câu hỏi'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">Thời gian làm bài:</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
              {formatTime(timeSpentSeconds)}
            </div>
            <span className="text-[10px] text-slate-400 block">Thời lượng làm bài thực tế</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">Tốc độ chấm bài:</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              0.01s
            </div>
            <span className="text-[10px] text-slate-400 block">Khách quan, tự động tức thì</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block">Điểm thưởng PTS:</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              +{pointsAwarded} PTS
            </div>
            <span className="text-[10px] text-slate-400 block">
              {isPassed ? 'Đã ghi nhận vào hồ sơ' : 'Cần ≥ 70% để nhận'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Detailed Review Section with Interactive Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Xem Lại Chi Tiết Bài Làm</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Đối chiếu câu trả lời của bạn với đáp án chuẩn và lời giải thích từ hội đồng khảo thí
            </p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Tất cả ({answers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('INCORRECT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterMode === 'INCORRECT'
                  ? 'bg-white dark:bg-[#111114] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400'
              }`}
            >
              <span>Chỉ câu sai</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                {incorrectAnswers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('CORRECT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterMode === 'CORRECT'
                  ? 'bg-white dark:bg-[#111114] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400'
              }`}
            >
              <span>Chỉ câu đúng</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {correctAnswers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Empty Filter State */}
        {filteredAnswers.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 text-xs text-slate-500">
            {filterMode === 'INCORRECT' ? 'Tuyệt vời! Bạn không làm sai câu nào.' : 'Không có câu hỏi phù hợp với bộ lọc.'}
          </div>
        )}

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredAnswers.map((ans, idx) => {
            const isCorrect = ans.isCorrect;
            const chosenOption = ans.options.find((o) => o.id === ans.selectedOptionId);
            const correctOption = ans.options.find((o) => o.isCorrect);

            return (
              <div
                key={ans.id}
                className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111114] border shadow-xs transition-colors ${
                  isCorrect
                    ? 'border-slate-200 dark:border-zinc-800'
                    : 'border-rose-200 dark:border-rose-900/50'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-wider ${
                        isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      CÂU {ans.orderIndex + 1}
                    </span>
                    {ans.competencyTitle && (
                      <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium hidden sm:inline">
                        {ans.competencyTitle}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-bold font-mono tabular-nums ${
                      isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {ans.scoreAwarded} / {ans.points} điểm
                  </span>
                </div>

                {/* Prompt */}
                <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 leading-relaxed">
                  {ans.prompt}
                </h3>

                {/* Options List */}
                <div className="space-y-2 mb-4">
                  {ans.options.map((opt) => {
                    const isCandidateChoice = opt.id === ans.selectedOptionId;
                    const isRightAnswer = opt.isCorrect;

                    let optionStyle =
                      'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300';
                    if (isRightAnswer) {
                      optionStyle =
                        'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-medium';
                    } else if (isCandidateChoice && !isRightAnswer) {
                      optionStyle =
                        'border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 font-medium';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isRightAnswer ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
                          ) : isCandidateChoice ? (
                            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" strokeWidth={2} />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-zinc-700 inline-block shrink-0" />
                          )}
                          <span className="break-words">{opt.content}</span>
                        </div>

                        {isCandidateChoice && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-neutral-700 dark:text-neutral-200 shrink-0">
                            Bạn đã chọn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Academic Explanation */}
                {correctOption?.explanation && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Giải thích đáp án:
                    </span>{' '}
                    {correctOption.explanation}
                  </div>
                )}

                {/* Evidence File Attachment */}
                {ans.evidenceUrl && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-medium">
                      <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
                      <span>Tệp minh chứng đã nộp</span>
                    </div>
                    <a
                      href={ans.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-900 transition-colors font-semibold text-xs"
                    >
                      Mở xem tệp
                    </a>
                  </div>
                )}

                {/* Essay / Practical text response */}
                {ans.textResponse && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span>Bài tự luận của bạn:</span>
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                      {ans.textResponse}
                    </p>
                  </div>
                )}

                {/* On-Demand AI Rubric Grading Card if practical */}
                {ans.textResponse && (
                  <div className="mt-3">
                    <AIGradingCard
                      submissionId={submissionId}
                      itemId={ans.itemId}
                      hasTextResponse={Boolean(ans.textResponse)}
                      initialEvaluation={evalMap[ans.itemId] || null}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </main>
    </div>
  );
}
