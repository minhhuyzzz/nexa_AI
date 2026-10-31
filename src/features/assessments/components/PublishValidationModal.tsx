'use client';

import { useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Loader2,
  Layers,
  Clock,
  Award,
} from 'lucide-react';
import { ParsedItemRow } from '../utils/csv-helper';
import {
  AssessmentValidator,
  AssessmentMetadata,
} from '../services/assessment-validator.service';

interface PublishValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
  isPublishing?: boolean;
  metadata: AssessmentMetadata;
  questions: ParsedItemRow[];
  onSelectQuestionToFix?: (index: number) => void;
}

export function PublishValidationModal({
  isOpen,
  onClose,
  onConfirmPublish,
  isPublishing = false,
  metadata,
  questions,
  onSelectQuestionToFix,
}: PublishValidationModalProps) {
  const result = useMemo(() => {
    return AssessmentValidator.validate(metadata, questions);
  }, [metadata, questions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-md shadow-sm flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-slate-900">
              Kiểm Định Đề Thi Trước Khi Phát Hành
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Đóng modal"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Status Banner */}
          {result.isValid ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-xs font-semibold text-emerald-900">
                  Đề thi vượt qua kiểm định khảo thí và sẵn sàng phát hành
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  100% câu hỏi có cấu trúc hợp lệ, điểm số và đáp án chuẩn hóa.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-xs font-semibold text-rose-900">
                  Phát hiện {result.errors.length} lỗi khảo thí cần khắc phục
                </p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Hệ thống tạm khóa tính năng phát hành nhằm bảo vệ tính toàn vẹn đề thi và trải nghiệm của thí sinh.
                </p>
              </div>
            </div>
          )}

          {/* Exam Summary Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-[10px] text-slate-500 font-medium">Số câu hỏi</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {result.stats.totalQuestions}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-[10px] text-slate-500 font-medium">Tổng điểm</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {result.stats.totalPoints}đ
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-[10px] text-slate-500 font-medium">Chuẩn đạt</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {metadata.passingScore}%
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-[10px] text-slate-500 font-medium">Thời lượng</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {metadata.durationMinutes}p
              </div>
            </div>
          </div>

          {/* DigComp Domains coverage */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
              Miền năng lực DigComp bao phủ:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.stats.coveredDomains.length > 0 ? (
                result.stats.coveredDomains.map((dom) => (
                  <span
                    key={dom}
                    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded text-[11px] font-mono"
                  >
                    {dom}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Chưa xác định miền năng lực cụ thể
                </span>
              )}
            </div>
          </div>

          {/* Errors Section */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-rose-800 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" strokeWidth={2} />
                Lỗi bắt buộc phải sửa ({result.errors.length}):
              </div>
              <div className="space-y-1.5">
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-white border border-rose-200 rounded text-xs text-slate-800 flex items-start justify-between gap-2"
                  >
                    <span className="leading-relaxed">{err.message}</span>
                    {err.questionIndex !== undefined && onSelectQuestionToFix && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectQuestionToFix(err.questionIndex! - 1);
                          onClose();
                        }}
                        className="text-[11px] font-medium text-sky-600 hover:text-sky-700 shrink-0 underline"
                      >
                        Sửa câu {err.questionIndex}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings Section */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" strokeWidth={2} />
                Khuyến nghị khảo thí ({result.warnings.length}):
              </div>
              <div className="space-y-1.5">
                {result.warnings.map((warn, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-amber-50/50 border border-amber-200 rounded text-xs text-slate-700 leading-relaxed"
                  >
                    {warn.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
          >
            Quay lại chỉnh sửa
          </button>

          <button
            type="button"
            disabled={!result.isValid || isPublishing}
            onClick={onConfirmPublish}
            className="px-4 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                Đang phát hành...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" strokeWidth={2} />
                Xác nhận phát hành đề thi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
