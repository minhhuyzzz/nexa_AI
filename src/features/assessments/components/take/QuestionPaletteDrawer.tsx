'use client';

import React from 'react';
import { X, Flag, CheckCircle2, Circle } from 'lucide-react';

interface QuestionPaletteDrawerProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  flaggedIndices: Set<number>;
  onSelectQuestion: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
  isLinear?: boolean;
}

export function QuestionPaletteDrawer({
  totalQuestions,
  currentIndex,
  answeredIndices,
  flaggedIndices,
  onSelectQuestion,
  isOpen,
  onClose,
  isLinear = false,
}: QuestionPaletteDrawerProps) {
  if (!isOpen) return null;

  const answeredCount = answeredIndices.size;
  const flaggedCount = flaggedIndices.size;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <aside className="relative w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-[#111114] border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Bảng danh sách câu hỏi</span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                {answeredCount}/{totalQuestions}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Chọn câu hỏi bất kỳ để chuyển đến nhanh.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Đóng bảng câu hỏi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend / Trú giải 3 màu chuẩn */}
        <div className="p-3 sm:px-5 bg-slate-50/70 dark:bg-zinc-900/40 grid grid-cols-3 gap-2 text-[11px] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-blue-600 shrink-0" />
            <span className="text-neutral-800 dark:text-zinc-200 font-medium truncate">
              Đã làm ({answeredCount})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0 flex items-center justify-center text-white text-[9px] font-bold">
              🚩
            </span>
            <span className="text-amber-800 dark:text-amber-400 font-semibold truncate">
              Xem lại ({flaggedCount})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-zinc-700 shrink-0" />
            <span className="text-slate-600 dark:text-zinc-400 font-medium truncate">
              Chưa làm ({unansweredCount})
            </span>
          </div>
        </div>

        {/* Question Grid Matrix */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = answeredIndices.has(i);
              const isFlagged = flaggedIndices.has(i);
              const isLocked = isLinear && i < currentIndex;

              let btnStyle = 'bg-slate-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700';

              if (isFlagged) {
                btnStyle = 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs';
              } else if (isAnswered) {
                btnStyle = 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs';
              }

              if (isCurrent) {
                btnStyle += ' ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#111114] scale-105';
              }

              if (isLocked) {
                btnStyle += ' opacity-50 cursor-not-allowed';
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    onSelectQuestion(i);
                    onClose();
                  }}
                  className={`h-10 rounded-xl text-xs font-mono transition-all flex flex-col items-center justify-center relative cursor-pointer ${btnStyle}`}
                  title={`Câu ${i + 1}${isFlagged ? ' (Đã cắm cờ xem lại)' : isAnswered ? ' (Đã trả lời)' : ' (Chưa làm)'}`}
                >
                  <span>{i + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 text-[9px] drop-shadow-xs">
                      🚩
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/50 text-[11px] text-slate-500 dark:text-neutral-400 shrink-0 flex items-center justify-between">
          <span>Tiến độ hoàn thành:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
            {totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0}%
          </span>
        </div>
      </aside>
    </div>
  );
}
