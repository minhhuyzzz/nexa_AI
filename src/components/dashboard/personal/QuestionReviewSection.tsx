'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Check,
  X,
  FileText,
  Filter,
  Compass,
} from 'lucide-react';

export interface QuestionReviewItem {
  index: number;
  id: string;
  prompt: string;
  type?: string;
  points: number;
  options?: Array<{
    id: string;
    content: string;
    order_index?: number;
    explanation?: string;
    is_correct?: boolean;
  }>;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
  scoreAwarded: number;
  explanation: string | null;
  domainCode?: string;
  domainTitle?: string;
  textResponse?: string | null;
  scenarioContext?: string;
}

interface QuestionReviewSectionProps {
  items: QuestionReviewItem[];
}

export function QuestionReviewSection({ items }: QuestionReviewSectionProps) {
  const [filter, setFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT'>('ALL');

  if (!items || items.length === 0) return null;

  const totalQuestions = items.length;
  const correctCount = items.filter((it) => it.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;

  const filteredItems = items.filter((it) => {
    if (filter === 'CORRECT') return it.isCorrect;
    if (filter === 'INCORRECT') return !it.isCorrect;
    return true;
  });

  return (
    <div className="space-y-4 pt-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Xem lại chi tiết câu hỏi &amp; Giải trình kiến thức</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Đối chiếu câu trả lời của bạn với đáp án đúng và phân tích sư phạm từng câu
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Tất cả ({totalQuestions})
          </button>
          <button
            type="button"
            onClick={() => setFilter('CORRECT')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'CORRECT'
                ? 'bg-white dark:bg-[#111114] text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Đúng ({correctCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('INCORRECT')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'INCORRECT'
                ? 'bg-white dark:bg-[#111114] text-rose-700 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Cần cải thiện ({incorrectCount})</span>
          </button>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-3.5">
        {filteredItems.map((item) => {
          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                item.isCorrect
                  ? 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114]'
                  : 'border-rose-200/70 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10'
              }`}
            >
              {/* Card Header: Question index, Domain chip, Result status */}
              <div className="flex items-center justify-between gap-3 pb-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-[11px]">
                    Câu {item.index}
                  </span>
                  {item.domainTitle && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                      <Compass className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>
                        Miền {item.domainCode || ''} • {item.domainTitle}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-neutral-400 tabular-nums">
                    {item.scoreAwarded} / {item.points} đ
                  </span>
                  {item.isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Chính xác</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[11px]">
                      <XCircle className="w-3 h-3" />
                      <span>Chưa chính xác</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Scenario Context (if available) */}
              {item.scenarioContext && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-600 dark:text-neutral-300 italic leading-relaxed">
                  {item.scenarioContext}
                </div>
              )}

              {/* Question Prompt */}
              <div className="pt-3">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                  {item.prompt}
                </h4>
              </div>

              {/* Options List */}
              {item.options && item.options.length > 0 && (
                <div className="space-y-2 pt-3">
                  {item.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isCandidateChoice = item.selectedOptionId === opt.id;
                    const isCorrectChoice =
                      item.correctOptionId === opt.id || opt.is_correct === true;

                    let containerStyle =
                      'border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20 text-slate-600 dark:text-zinc-400 opacity-70';
                    let letterStyle =
                      'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400';

                    if (isCandidateChoice && isCorrectChoice) {
                      containerStyle =
                        'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500 font-medium opacity-100';
                      letterStyle = 'bg-emerald-600 text-white';
                    } else if (isCandidateChoice && !isCorrectChoice) {
                      containerStyle =
                        'border-rose-400 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400 font-medium opacity-100';
                      letterStyle = 'bg-rose-600 text-white';
                    } else if (!isCandidateChoice && isCorrectChoice) {
                      containerStyle =
                        'border-emerald-500 border-dashed bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-medium opacity-100';
                      letterStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-colors ${containerStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${letterStyle}`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1 leading-snug">{opt.content}</span>

                        {/* Status Label on Option */}
                        <div className="shrink-0 text-[10px] font-bold">
                          {isCandidateChoice && isCorrectChoice && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              <span>Bạn đã chọn (Đúng)</span>
                            </span>
                          )}
                          {isCandidateChoice && !isCorrectChoice && (
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                              <X className="w-3.5 h-3.5" />
                              <span>Bạn đã chọn (Chưa đúng)</span>
                            </span>
                          )}
                          {!isCandidateChoice && isCorrectChoice && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đáp án đúng chuẩn</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text Response (Practical) */}
              {item.textResponse && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs space-y-1">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Bài giải trình của thí sinh:
                  </span>
                  <p className="text-slate-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {item.textResponse}
                  </p>
                </div>
              )}

              {/* Pedagogical Explanation Block */}
              {item.explanation && (
                <div className="mt-3.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Giải trình sư phạm &amp; Cơ sở năng lực</span>
                  </div>
                  <p className="text-slate-700 dark:text-neutral-300 leading-relaxed text-[11px] sm:text-xs">
                    {item.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
