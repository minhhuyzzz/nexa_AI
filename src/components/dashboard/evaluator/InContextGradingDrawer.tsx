'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Send,
  User,
  Paperclip,
} from 'lucide-react';

export interface RubricLevelOption {
  id: string;
  levelName: string;
  scorePercent: number;
  description: string;
}

export interface RubricCriterionItem {
  id: string;
  name: string;
  maxPoints: number;
  levels: RubricLevelOption[];
}

export interface InContextGradingSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentTitle: string;
  groupName: string;
  groupCode: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'EVALUATED';
  prompt: string;
  textResponse: string;
  evidenceUrl?: string | null;
  score?: number;
  maxScore: number;
  feedback?: string;
  rubricCriteria: RubricCriterionItem[];
}

interface InContextGradingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  submission: InContextGradingSubmission | null;
  onSaveGrade: (submissionId: string, totalScore: number, feedback: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalSubmissions?: number;
}

export function InContextGradingDrawer({
  isOpen,
  onClose,
  submission,
  onSaveGrade,
  onNext,
  onPrev,
  currentIndex = 0,
  totalSubmissions = 1,
}: InContextGradingDrawerProps) {
  const [selectedLevels, setSelectedLevels] = useState<Record<string, RubricLevelOption>>({});
  const [evaluatorFeedback, setEvaluatorFeedback] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    confidenceScore: number;
    evidenceQuote: string;
    strengths: string;
    weaknesses: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when submission changes
  useEffect(() => {
    if (!submission) return;
    setSaveSuccess(false);
    setAiResult(null);
    setEvaluatorFeedback(submission.feedback || '');

    // Initialize with default or passed levels
    const initialLevels: Record<string, RubricLevelOption> = {};
    submission.rubricCriteria.forEach((crit) => {
      // Pick first level (or matching score)
      if (crit.levels.length > 0) {
        initialLevels[crit.id] = crit.levels[0];
      }
    });
    setSelectedLevels(initialLevels);
  }, [submission]);

  if (!isOpen || !submission) return null;

  // Calculate current score based on selected rubric levels
  const currentTotalScore = submission.rubricCriteria.reduce((acc, crit) => {
    const selected = selectedLevels[crit.id];
    if (!selected) return acc;
    const pts = (crit.maxPoints * selected.scorePercent) / 100;
    return acc + Math.round(pts * 10) / 10;
  }, 0);

  const handleSelectLevel = (critId: string, level: RubricLevelOption) => {
    setSelectedLevels((prev) => ({
      ...prev,
      [critId]: level,
    }));
  };

  const handleTriggerAiGrading = () => {
    setIsAiLoading(true);
    // Simulate On-Demand AI Rubric Grading with 100% rubrics mapping
    setTimeout(() => {
      setIsAiLoading(false);
      setAiResult({
        confidenceScore: 0.94,
        evidenceQuote: submission.textResponse.slice(0, 95) + '...',
        strengths: 'Phân tích logic, bố cục minh bạch và có đề xuất phương án giải quyết cụ thể.',
        weaknesses: 'Cần chú trọng thêm khâu dự trù giải pháp dự phòng khi có rủi ro kỹ thuật.',
      });
      // Set high scoring levels
      const aiSelected: Record<string, RubricLevelOption> = {};
      submission.rubricCriteria.forEach((crit) => {
        aiSelected[crit.id] = crit.levels[0];
      });
      setSelectedLevels(aiSelected);
      setEvaluatorFeedback(
        'Học viên nắm vững bản chất vấn đề, lập luận có căn cứ dữ liệu số rõ ràng. Đạt yêu cầu chuẩn hóa.'
      );
    }, 800);
  };

  const handleSave = () => {
    onSaveGrade(submission.id, currentTotalScore, evaluatorFeedback);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onNext && currentIndex + 1 < totalSubmissions) {
        onNext();
      } else {
        onClose();
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        {/* Drawer Header with Full Context */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">
              {submission.groupCode}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Chấm bài: {submission.studentName}
                </h2>
                <span className="text-xs text-slate-500">({submission.studentEmail})</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Bài thi: <span className="font-semibold text-slate-800">{submission.assignmentTitle}</span> &bull; Nhóm: {submission.groupName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Next / Prev navigation */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={onPrev}
                disabled={!onPrev || currentIndex === 0}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Bài trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-600 font-semibold tabular-nums">
                {currentIndex + 1} / {totalSubmissions}
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={!onNext || currentIndex + 1 >= totalSubmissions}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Bài tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Global queue link */}
            <Link
              href="/evaluator/grading"
              className="text-xs text-sky-600 hover:text-sky-700 font-medium hidden sm:inline-flex items-center gap-1 hover:underline"
              title="Mở toàn bộ hàng đợi chấm bài"
            >
              <span>Hàng đợi toàn cục</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Close button */}
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Đóng bảng chấm bài"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Drawer Body - Split Left / Right */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
          {/* Left Column: Candidate Work (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Prompt Card */}
            <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Yêu cầu đề bài thực hành
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {submission.prompt}
              </p>
            </div>

            {/* Submission Text Content */}
            <div className="p-4 rounded-md border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Bài làm của người học
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Nộp: {new Date(submission.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(submission.submittedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                {submission.textResponse}
              </div>
            </div>

            {/* Evidence attachment */}
            {submission.evidenceUrl && (
              <div className="p-3 rounded-md border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 truncate">
                      {submission.evidenceUrl.split('/').pop()}
                    </div>
                    <div className="text-[10px] text-slate-400">Tệp minh chứng đính kèm</div>
                  </div>
                </div>
                <a
                  href={submission.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>Mở xem</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Rubric & Scoring Workbench (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* AI Rubric Trigger */}
            <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Trợ lý AI chấm Rubric</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Phân tích minh chứng, trích dẫn bằng chứng và gợi ý điểm theo Rubric.
                </div>
              </div>
              <button
                type="button"
                onClick={handleTriggerAiGrading}
                disabled={isAiLoading}
                className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang chấm...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI chấm gợi ý</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Result Card if triggered */}
            {aiResult && (
              <div className="p-3.5 rounded-md border border-sky-200 bg-sky-50/40 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span className="font-bold text-sky-950">
                      Độ tin cậy: {Math.round(aiResult.confidenceScore * 100)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-sky-800 font-mono">AI Rubric v3.0</span>
                </div>
                <div className="text-[11px] text-slate-700 italic border-l-2 border-sky-400 pl-2">
                  &ldquo;{aiResult.evidenceQuote}&rdquo;
                </div>
                <div className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">Điểm mạnh:</strong> {aiResult.strengths}
                </div>
              </div>
            )}

            {/* Rubric Criteria List */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tiêu chí đánh giá Rubric ({submission.rubricCriteria.length})
              </div>

              {submission.rubricCriteria.map((crit) => {
                const currentLevel = selectedLevels[crit.id];
                const earnedPts = currentLevel
                  ? (crit.maxPoints * currentLevel.scorePercent) / 100
                  : 0;

                return (
                  <div key={crit.id} className="p-3.5 rounded-md border border-slate-200 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{crit.name}</span>
                      <span className="text-xs font-mono font-bold text-sky-700">
                        {Math.round(earnedPts * 10) / 10} / {crit.maxPoints}đ
                      </span>
                    </div>

                    {/* Level selector buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {crit.levels.map((lvl) => {
                        const isSelected = currentLevel?.id === lvl.id;
                        return (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => handleSelectLevel(crit.id, lvl)}
                            className={`p-2 rounded text-left border transition-colors ${
                              isSelected
                                ? 'bg-sky-50 border-sky-600 text-sky-950 ring-1 ring-sky-600'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span>{lvl.levelName}</span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {lvl.scorePercent}%
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                              {lvl.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Evaluator Feedback */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Nhận xét sư phạm từ Người đánh giá
              </label>
              <textarea
                rows={3}
                value={evaluatorFeedback}
                onChange={(e) => setEvaluatorFeedback(e.target.value)}
                placeholder="Nhập phản hồi, hướng dẫn khắc phục hoặc lời khuyên cho học viên..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Drawer Footer with Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tổng điểm quy đổi:</span>
            <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
              {currentTotalScore} / {submission.maxScore} điểm
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                currentTotalScore >= submission.maxScore * 0.7
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {currentTotalScore >= submission.maxScore * 0.7 ? 'Đạt chuẩn' : 'Cần bồi dưỡng'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Đã lưu!' : 'Lưu kết quả & Tiếp tục'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
