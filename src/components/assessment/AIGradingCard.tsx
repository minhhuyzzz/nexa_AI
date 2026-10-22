'use client';

import { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Quote,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { CriterionScore } from '@/features/ai-gateway/types/grading.types';

export interface AIEvaluationView {
  id?: string;
  totalScore: number;
  maxScore: number;
  confidenceScore: number;
  confidenceFlag: 'GREEN' | 'AMBER' | 'RED';
  evidenceQuote?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  feedback: string;
  criterionScores: CriterionScore[];
  modelName?: string;
}

interface AIGradingCardProps {
  submissionId: string;
  itemId: string;
  hasTextResponse: boolean;
  initialEvaluation?: AIEvaluationView | null;
  userRole?: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
  onGraded?: (evaluation: AIEvaluationView) => void;
}

export function AIGradingCard({
  submissionId,
  itemId,
  hasTextResponse,
  initialEvaluation,
  userRole = 'LEARNER',
  onGraded,
}: AIGradingCardProps) {
  const [evaluation, setEvaluation] = useState<AIEvaluationView | null>(initialEvaluation || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGradeWithAI = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, itemId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Chấm điểm bằng AI không thành công');
      }

      setEvaluation(data.evaluation);
      if (onGraded) {
        onGraded(data.evaluation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  if (!hasTextResponse) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      {!evaluation ? (
        <div className="p-4 rounded-md bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span className="text-xs font-bold text-slate-900">
                Chấm bài tự luận theo Rubric bằng AI
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Hệ thống thẩm định 3 tiêu chí (Pháp lý NĐ 13, Giao tiếp minh bạch, Kỹ thuật cô lập), trích dẫn bằng chứng thực tế từ bài làm và tính độ tin cậy.
            </p>
            {error && (
              <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                {error}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleGradeWithAI}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            {loading ? 'AI đang thẩm định...' : 'Chấm bài thực hành bằng AI'}
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-4">
          {/* Header & Confidence Flag */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  evaluation.confidenceFlag === 'GREEN'
                    ? 'bg-emerald-600'
                    : evaluation.confidenceFlag === 'AMBER'
                    ? 'bg-amber-500'
                    : 'bg-rose-600'
                }`}
              />
              <span className="text-xs font-bold text-slate-700 uppercase">
                {evaluation.confidenceFlag === 'GREEN'
                  ? `ĐỘ TIN CẬY CAO (${evaluation.confidenceScore}%)`
                  : evaluation.confidenceFlag === 'AMBER'
                  ? `ĐỘ TIN CẬY TRUNG BÌNH (${evaluation.confidenceScore}%)`
                  : `ĐỘ TIN CẬY THẤP (${evaluation.confidenceScore}%) — CẦN CHUYÊN GIA THẨM ĐỊNH LẠI`}
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-[11px] text-slate-500">
                Mô hình: {evaluation.modelName || 'gemini-2.5-flash'}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500">ĐIỂM RUBRIC:</span>
              <span className="text-base font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {evaluation.totalScore} / {evaluation.maxScore} pts
              </span>
            </div>
          </div>

          {/* Evidence Quote */}
          {evaluation.evidenceQuote && (
            <div className="p-3 rounded-md bg-white border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                <Quote className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                <span>MINH CHỨNG TRÍCH DẪN TỪ BÀI LÀM:</span>
              </div>
              <p className="text-slate-800 italic leading-relaxed pl-5 border-l-2 border-sky-600">
                &ldquo;{evaluation.evidenceQuote}&rdquo;
              </p>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {evaluation.strengths && (
              <div className="p-3 rounded-md bg-white border border-slate-200">
                <div className="font-semibold text-emerald-800 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Điểm mạnh nổi bật
                </div>
                <p className="text-slate-600 leading-relaxed">{evaluation.strengths}</p>
              </div>
            )}

            {evaluation.weaknesses && (
              <div className="p-3 rounded-md bg-white border border-slate-200">
                <div className="font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Khoảng trống cần bổ sung
                </div>
                <p className="text-slate-600 leading-relaxed">{evaluation.weaknesses}</p>
              </div>
            )}
          </div>

          {/* General Feedback */}
          <div className="p-3 rounded-md bg-white border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Nhận xét &amp; Định hướng bồi dưỡng: </span>
            <span>{evaluation.feedback}</span>
          </div>

          {/* Criteria Breakdown */}
          {evaluation.criterionScores && evaluation.criterionScores.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                CHI TIẾT ĐIỂM THEO TIÊU CHÍ RUBRIC:
              </h4>
              <div className="space-y-2">
                {evaluation.criterionScores.map((crit, cIdx) => (
                  <div
                    key={crit.criterionId || cIdx}
                    className="p-3 rounded-md bg-white border border-slate-200 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{crit.criterionName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {crit.selectedLevel}
                        </span>
                        <span className="font-bold text-sky-700">
                          {crit.score} / {crit.maxPoints} pts
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {crit.justification}
                    </p>
                    {crit.evidenceQuote && (
                      <p className="text-slate-500 italic text-[11px] pl-3 border-l-2 border-slate-300">
                        &ldquo;{crit.evidenceQuote}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
