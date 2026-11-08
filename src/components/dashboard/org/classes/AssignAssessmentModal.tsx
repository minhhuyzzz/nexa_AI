'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  FileSpreadsheet,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Shuffle,
  Eye,
  Paperclip,
  RotateCw,
  Loader2,
  AlertCircle,
  Coins,
  Send,
  Info,
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
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(assessmentsList[0]?.id || '');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(2);

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

  // Exam Switches
  const [aiGradingEnabled, setAiGradingEnabled] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [immediateResults, setImmediateResults] = useState(false);
  const [requireEvidence, setRequireEvidence] = useState(true);

  // Evidence format checks
  const [allowedPdf, setAllowedPdf] = useState(true);
  const [allowedImg, setAllowedImg] = useState(true);
  const [allowedVideo, setAllowedVideo] = useState(true);
  const [allowedUrl, setAllowedUrl] = useState(true);
  const [maxEvidenceMb, setMaxEvidenceMb] = useState(50);
  const [securitySettings, setSecuritySettings] = useState<AssessmentSecuritySettings>(
    SECURITY_PRESETS.STANDARD.settings
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAssessment =
    assessmentsList.find((a) => a.id === selectedAssessmentId) || assessmentsList[0];

  const estimatedAiCredits = aiGradingEnabled ? memberCount * 1 : 0;

  const handleSubmit = async () => {
    if (!currentAssessment) {
      setError('Vui lòng chọn một đề đánh giá hợp lệ.');
      return;
    }
    setLoading(true);
    setError(null);

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString();

    if (new Date(startDateTime) >= new Date(deadlineDateTime)) {
      setError('Thời gian mở bài phải trước thời gian hạn nộp bài');
      setLoading(false);
      return;
    }

    const allowedTypes: string[] = [];
    if (allowedPdf) allowedTypes.push('PDF', 'DOCX', 'PPTX', 'XLSX');
    if (allowedImg) allowedTypes.push('JPG', 'PNG');
    if (allowedVideo) allowedTypes.push('MP4', 'MOV');
    if (allowedUrl) allowedTypes.push('URL');

    try {
      const payload = {
        assessmentId: currentAssessment.id,
        startTime: startDateTime,
        deadline: deadlineDateTime,
        timezone: 'Asia/Ho_Chi_Minh',
        allowLateSubmission,
        reminderBeforeHours,
        aiGradingEnabled,
        shuffleQuestions,
        immediateResults,
        requireEvidence,
        allowedEvidenceTypes: allowedTypes,
        maxEvidenceMb,
        estimatedAiCredits,
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
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Giao đề đánh giá
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Chọn đề, thời gian, cách làm bài và thông báo cho lớp {className}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Steps Progress */}
        <div className="grid grid-cols-4 text-xs bg-slate-50/50 dark:bg-zinc-900/50">
          {[
            { num: 1, label: 'Chọn đề' },
            { num: 2, label: 'Thiết lập thời gian' },
            { num: 3, label: 'Cấu hình làm bài' },
            { num: 4, label: 'Xác nhận' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`py-1.5 px-3 rounded-lg text-center font-semibold flex items-center justify-center gap-1.5 transition-all ${
                step === s.num
                  ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 shadow-2xs'
                  : step > s.num
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-zinc-600'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                  step === s.num
                    ? 'bg-blue-600 text-white'
                    : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                }`}
              >
                {step > s.num ? <Check className="w-2.5 h-2.5" /> : s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
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
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
          {/* Left Config Panel (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {error && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Đề đã chọn */}
            <div className="space-y-2">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-mono">
                  1
                </span>
                Đề đã chọn
              </h3>

              <div className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {currentAssessment?.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Đánh giá mức độ nắm vững các kỹ năng số nền tảng: sử dụng công cụ, xử lý thông tin, làm việc số.
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap font-mono tabular-nums text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Thời lượng: {currentAssessment?.durationMinutes} phút
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Số câu: {currentAssessment?.questionCount}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {currentAssessment?.rubricTitle || 'Rubric 100 điểm'}
                    </span>
                  </div>
                </div>

                <select
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-xs shrink-0"
                >
                  {assessmentsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      Đổi: {a.title.slice(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Thiết lập thời gian */}
            <div className="space-y-3">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-mono">
                  2
                </span>
                Thiết lập thời gian
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Ngày & giờ mở bài <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    Hạn nộp bài <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[11px] pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowLateSubmission}
                    onChange={(e) => setAllowLateSubmission(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Cho phép nộp muộn (gắn nhãn &quot;Nộp muộn&quot;)</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Gửi nhắc nhở:</span>
                  <select
                    value={reminderBeforeHours}
                    onChange={(e) => setReminderBeforeHours(Number(e.target.value))}
                    className="px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-xs"
                  >
                    <option value={24}>Trước 24 giờ</option>
                    <option value={12}>Trước 12 giờ</option>
                    <option value={2}>Trước 2 giờ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Cấu hình làm bài */}
            <div className="space-y-3">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-mono">
                  3
                </span>
                Cấu hình làm bài
              </h3>

              <div className="space-y-2.5">
                {/* Switch 1: AI */}
                <div className="flex items-center justify-between p-2.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        Chấm AI hỗ trợ
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Sử dụng AI để hỗ trợ chấm và gợi ý nhận xét theo rubric tiêu chuẩn.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiGradingEnabled}
                    onChange={(e) => setAiGradingEnabled(e.target.checked)}
                    className="toggle rounded text-blue-600 h-5 w-5"
                  />
                </div>

                {/* Switch 2: Shuffle */}
                <div className="flex items-center justify-between p-2.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-2.5">
                    <Shuffle className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        Xáo trộn câu hỏi
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Tự động thay đổi thứ tự câu hỏi cho mỗi sinh viên để chống sao chép.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="toggle rounded text-blue-600 h-5 w-5"
                  />
                </div>

                {/* Switch 3: Immediate results */}
                <div className="flex items-center justify-between p-2.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        Hiển thị kết quả ngay
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Cho phép sinh viên xem điểm và phản hồi ngay sau khi nộp bài.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={immediateResults}
                    onChange={(e) => setImmediateResults(e.target.checked)}
                    className="toggle rounded text-blue-600 h-5 w-5"
                  />
                </div>

                {/* Switch 4: Require Evidence */}
                <div className="p-2.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                          Yêu cầu minh chứng
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Yêu cầu sinh viên đính kèm tệp minh chứng (file, ảnh, video, liên kết).
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireEvidence}
                      onChange={(e) => setRequireEvidence(e.target.checked)}
                      className="toggle rounded text-blue-600 h-5 w-5"
                    />
                  </div>

                  {requireEvidence && (
                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowedPdf}
                            onChange={(e) => setAllowedPdf(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Tệp (PDF/DOC)</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowedImg}
                            onChange={(e) => setAllowedImg(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Ảnh (JPG/PNG)</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowedVideo}
                            onChange={(e) => setAllowedVideo(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Video</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-1">
                        <span>Tối đa:</span>
                        <select
                          value={maxEvidenceMb}
                          onChange={(e) => setMaxEvidenceMb(Number(e.target.value))}
                          className="px-2 py-0.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-xs font-mono"
                        >
                          <option value={20}>20 MB</option>
                          <option value={50}>50 MB</option>
                          <option value={100}>100 MB</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Cấu hình giám sát & Bảo mật phòng thi */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-mono">
                  4
                </span>
                Giám sát &amp; Bảo mật phòng thi
              </h3>
              <SecuritySettingsCard
                value={securitySettings}
                onChange={setSecuritySettings}
                disabled={loading}
              />
            </div>
          </div>

          {/* Right Summary Panel (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3.5">
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 pb-1">
              Tóm tắt giao đề
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Lớp nhận đề:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{className}</span>
              </div>

              <div className="flex items-center justify-between py-1 font-mono">
                <span className="text-slate-500 font-sans">Số thành viên:</span>
                <span className="font-bold tabular-nums text-blue-600">{memberCount} sinh viên</span>
              </div>

              <div className="flex items-center justify-between py-1 font-mono">
                <span className="text-slate-500 font-sans">Lịch mở:</span>
                <span className="text-neutral-800 dark:text-neutral-200">
                  {startDate} {startTime}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 font-mono">
                <span className="text-slate-500 font-sans">Hạn nộp:</span>
                <span className="text-neutral-800 dark:text-neutral-200">
                  {deadlineDate} {deadlineTime}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 font-mono">
                <span className="text-slate-500 font-sans">Thời lượng:</span>
                <span className="text-neutral-800 dark:text-neutral-200">
                  {currentAssessment?.durationMinutes} phút
                </span>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-blue-600" /> AI credits ước tính:
                  </span>
                  <span className="font-mono tabular-nums">≈ {estimatedAiCredits} credits</span>
                </div>
                <p className="text-[10px] text-blue-700 dark:text-blue-300">
                  {aiGradingEnabled
                    ? `Dựa trên ${memberCount} bài x hỗ trợ chấm AI theo rubric.`
                    : 'Không tiêu tốn AI credits (đã tắt chấm AI).'}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-100 dark:bg-zinc-800 text-[11px] text-slate-600 dark:text-neutral-400 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
              <span>Sau khi giao đề, toàn bộ sinh viên trong lớp sẽ nhận được thông báo làm bài.</span>
            </div>
          </div>
        </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-neutral-900 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={loading || assessmentsList.length === 0}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition shadow-xs"
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
      </div>
    </div>
  );
}
