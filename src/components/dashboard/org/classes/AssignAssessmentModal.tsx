'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Send,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SecuritySettingsCard } from '@/features/assessments/components/SecuritySettingsCard';
import {
  AssessmentSecuritySettings,
  SECURITY_PRESETS,
} from '@/features/assessments/types/security.types';

interface AvailableAssessment {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  rubricTitle?: string;
}

interface AssignAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationSlug?: string;
  classId: string;
  className: string;
  memberCount: number;
  availableAssessments?: AvailableAssessment[];
  onSuccess: () => void;
}

export function AssignAssessmentModal({
  isOpen,
  onClose,
  organizationId,
  organizationSlug,
  classId,
  className,
  memberCount,
  availableAssessments = [],
  onSuccess,
}: AssignAssessmentModalProps) {
  const assessmentsList = availableAssessments;
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessmentsList[0]?.id || ''
  );

  useEffect(() => {
    if (!selectedAssessmentId && assessmentsList.length > 0) {
      setSelectedAssessmentId(assessmentsList[0].id);
    }
  }, [assessmentsList, selectedAssessmentId]);

  // Time configs
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [deadlineDate, setDeadlineDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);
  const [reminderBeforeHours, setReminderBeforeHours] = useState(24);

  // Exam Options
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [immediateResults, setImmediateResults] = useState(false);

  // Advanced Security Settings
  const [showSecurity, setShowSecurity] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<AssessmentSecuritySettings>(
    SECURITY_PRESETS.STANDARD.settings
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAssessment =
    assessmentsList.find((a) => a.id === selectedAssessmentId) || assessmentsList[0];

  const handleSubmit = async () => {
    if (!currentAssessment) {
      setError('Vui lòng chọn một đề khảo thí hợp lệ từ kho.');
      return;
    }
    setLoading(true);
    setError(null);

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString();

    if (new Date(startDateTime) >= new Date(deadlineDateTime)) {
      setError('Thời gian mở đề phải diễn ra trước thời hạn nộp bài.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        assessmentId: currentAssessment.id,
        startTime: startDateTime,
        deadline: deadlineDateTime,
        timezone: 'Asia/Ho_Chi_Minh',
        allowLateSubmission,
        reminderBeforeHours,
        aiGradingEnabled: false,
        shuffleQuestions,
        immediateResults,
        requireEvidence: false,
        allowedEvidenceTypes: [],
        maxEvidenceMb: 10,
        estimatedAiCredits: 0,
        securitySettings,
      };

      const res = await fetch(
        `/api/organizations/${organizationId}/classes/${classId}/assignments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Giao đề thất bại');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi giao đề');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Giao đề khảo thí cho lớp
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Lớp: <span className="font-medium text-neutral-800 dark:text-neutral-200">{className}</span> ({memberCount} thành viên)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {assessmentsList.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Chưa có đề đánh giá sẵn sàng
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Tổ chức chưa có bài đánh giá nào khả dụng để giao cho lớp này. Hãy tạo đề mới hoặc phát hành một đề từ Thư viện đề.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href={organizationSlug ? `/org/${organizationSlug}/assessments/new` : '/org'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition"
              >
                Tạo đề đánh giá mới
              </Link>
              <Link
                href={organizationSlug ? `/org/${organizationSlug}/assessments` : '/org'}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium rounded-md transition"
              >
                Đến thư viện đề
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium transition"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Chọn đề */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Đề khảo thí nội bộ <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {assessmentsList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.durationMinutes} phút - {a.questionCount} câu)
                  </option>
                ))}
              </select>

              {currentAssessment && (
                <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {currentAssessment.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Thời lượng: <span className="font-mono tabular-nums">{currentAssessment.durationMinutes}</span> phút • Quy mô: <span className="font-mono tabular-nums">{currentAssessment.questionCount}</span> câu hỏi
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Thiết lập thời gian */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Thời gian làm bài
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-300 mb-1">
                    Thời gian mở đề <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-neutral-300 mb-1">
                    Hạn chót nộp bài <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="text-slate-500 dark:text-neutral-400">Gửi nhắc nhở thành viên:</span>
                <select
                  value={reminderBeforeHours}
                  onChange={(e) => setReminderBeforeHours(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value={24}>Trước 24 giờ</option>
                  <option value={12}>Trước 12 giờ</option>
                  <option value={2}>Trước 2 giờ</option>
                  <option value={0}>Không gửi nhắc nhở</option>
                </select>
              </div>
            </div>

            {/* 3. Tùy chọn thi */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Tùy chọn thi
              </div>
              <div className="space-y-2 rounded-md border border-slate-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                      Xáo trộn thứ tự câu hỏi
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Tự động thay đổi thứ tự câu hỏi ngẫu nhiên cho từng sinh viên
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-zinc-700"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                      Hiển thị kết quả ngay sau khi nộp
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Cho phép sinh viên xem điểm số và báo cáo ngay khi hoàn thành bài
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={immediateResults}
                    onChange={(e) => setImmediateResults(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-zinc-700"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                      Cho phép nộp muộn
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Chấp nhận bài nộp sau hạn chót (hệ thống sẽ tự động gắn nhãn &quot;Nộp muộn&quot;)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowLateSubmission}
                    onChange={(e) => setAllowLateSubmission(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-zinc-700"
                  />
                </label>
              </div>
            </div>

            {/* 4. Tùy chọn nâng cao: Bảo mật & Giám sát */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSecurity(!showSecurity)}
                className="flex items-center justify-between w-full py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  Cấu hình bảo mật & Chống gian lận (Nâng cao)
                </span>
                {showSecurity ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {showSecurity && (
                <div className="pt-1">
                  <SecuritySettingsCard
                    value={securitySettings}
                    onChange={setSecuritySettings}
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        {assessmentsList.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={loading || !selectedAssessmentId}
              onClick={handleSubmit}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang giao đề...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Giao đề cho lớp ngay</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
