'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface Option {
  id?: string;
  content: string;
  is_correct: boolean;
  explanation?: string;
  order_index?: number;
}

interface Item {
  id: string;
  prompt: string;
  type: string;
  points: number;
  order_index: number;
  competency_id?: string;
  competencies?: any;
  item_options?: Option[];
}

interface BaselinePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  assessmentTitle: string;
}

export function BaselinePreviewModal({
  isOpen,
  onClose,
  items,
  assessmentTitle,
}: BaselinePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const comp = Array.isArray(currentItem?.competencies)
    ? currentItem.competencies[0]
    : currentItem?.competencies;
  const dom = Array.isArray(comp?.competency_domains)
    ? comp?.competency_domains[0]
    : comp?.competency_domains;

  const options = (currentItem?.item_options || []).sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  const selectedOptId = selectedAnswers[currentItem?.id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* 1. Header Tinh Gọn */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  Xem trước khảo sát đầu vào
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                  Mô phỏng người học
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                {assessmentTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle hiện đáp án chuẩn */}
            <button
              type="button"
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                showAnswerKey
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400'
              }`}
              title="Bật/tắt hiển thị đáp án đúng"
            >
              {showAnswerKey ? 'Đáp án: BẬT' : 'Đáp án: TẮT'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Thanh tiến độ */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
              Câu {currentIndex + 1} / {items.length}
            </span>
            {dom?.code && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                {dom.code}: {dom.title}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {Math.round(((currentIndex + 1) / items.length) * 100)}%
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-200"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>

        {/* 3. Nội dung câu hỏi và 4 đáp án */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
            {currentItem?.prompt}
          </h3>

          {/* Danh sách đáp án */}
          <div className="space-y-2 pt-1">
            {options.map((opt, oIdx) => {
              const isSelected = selectedOptId === (opt.id || String(oIdx));
              const isCorrectAnswer = opt.is_correct;

              let cardStyle =
                'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/70 text-neutral-800 dark:text-zinc-200';

              if (showAnswerKey && isCorrectAnswer) {
                cardStyle =
                  'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 font-semibold';
              } else if (isSelected) {
                cardStyle =
                  'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 text-blue-950 dark:text-blue-200 font-medium';
              }

              return (
                <div
                  key={opt.id || oIdx}
                  onClick={() =>
                    setSelectedAnswers((prev) => ({
                      ...prev,
                      [currentItem.id]: opt.id || String(oIdx),
                    }))
                  }
                  className={`p-3 rounded-xl border text-xs sm:text-sm flex flex-col gap-1 transition-all cursor-pointer ${cardStyle}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        showAnswerKey && isCorrectAnswer
                          ? 'bg-emerald-600 text-white'
                          : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="flex-1">{opt.content}</span>
                    {showAnswerKey && isCorrectAnswer && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        (Đáp án đúng)
                      </span>
                    )}
                  </div>
                  {showAnswerKey && opt.explanation && (
                    <p className="pl-8 text-xs text-slate-500 dark:text-neutral-400 italic">
                      {opt.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Footer Điều hướng Câu trước / Câu sau */}
        <div className="p-4 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-zinc-900/60">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Câu trước</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
          >
            Đóng xem trước
          </button>

          <button
            type="button"
            disabled={currentIndex === items.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Câu sau</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
