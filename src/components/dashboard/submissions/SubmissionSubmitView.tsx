import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  UploadCloud,
  FileText,
  X,
  Upload,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Table,
} from 'lucide-react';
import {
  PersonalSubmissionItem,
  SubmissionViewMode,
} from '@/features/classes/types/personal-submissions.types';

interface SubmissionSubmitViewProps {
  item: PersonalSubmissionItem;
  onBack: () => void;
  onSuccessSubmitted: () => void;
}

export function SubmissionSubmitView({
  item,
  onBack,
  onSuccessSubmitted,
}: SubmissionSubmitViewProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{
    name: string;
    size: string;
    storagePath?: string;
  } | null>(item.submittedFile || null);

  const [studentNote, setStudentNote] = useState<string>(item.studentNote || '');
  const [isHonestChecked, setIsHonestChecked] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1048576) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 52428800) {
      // 50 MB
      setErrorMessage('Dung lượng tệp vượt quá giới hạn cho phép (tối đa 50MB)');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setFilePreview({
      name: file.name,
      size: formatFileSize(file.size),
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 1. Lưu bản nháp (Local storage / Draft record)
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setDraftSavedMessage(null);
    setErrorMessage(null);

    try {
      // Save draft state to localStorage
      const draftKey = `nexa_submission_draft_${item.id}`;
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          note: studentNote,
          fileName: filePreview?.name || null,
          savedAt: new Date().toISOString(),
        })
      );

      setDraftSavedMessage('Đã lưu bản nháp thành công vào hệ thống.');
      setTimeout(() => setDraftSavedMessage(null), 3000);
    } catch {
      setErrorMessage('Không thể lưu bản nháp');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 2. Nộp bài chính thức
  const handleSubmitFinal = async () => {
    if (!filePreview && !studentNote.trim()) {
      setErrorMessage('Vui lòng tải lên tệp bài làm hoặc nhập nội dung minh chứng');
      return;
    }

    if (!isHonestChecked) {
      setErrorMessage('Vui lòng xác nhận cam kết tự thực hiện bài làm trước khi nộp');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let evidenceStoragePath: string | null = filePreview?.storagePath || null;

      // Upload file to server storage if fresh file chosen
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('itemId', item.itemId || 'item');
        formData.append('submissionId', item.id);

        const uploadRes = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'Tải tệp minh chứng lên máy chủ thất bại');
        }

        const uploadData = await uploadRes.json();
        evidenceStoragePath = uploadData.storagePath;
      }

      // Call API submit
      const submitRes = await fetch(`/api/assessments/${item.assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classAssignmentId: item.id,
          timeSpentSeconds: 60,
          answers: [
            {
              itemId: item.itemId || '00000000-0000-0000-0000-000000000000',
              textResponse: studentNote.trim(),
              evidenceUrl: evidenceStoragePath,
            },
          ],
        }),
      });

      if (!submitRes.ok) {
        const errJson = await submitRes.json();
        throw new Error(errJson.error || 'Nộp bài thất bại');
      }

      // Clear draft
      localStorage.removeItem(`nexa_submission_draft_${item.id}`);

      // Notify parent to refresh and open tracking
      onSuccessSubmitted();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi hệ thống khi nộp bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Breadcrumb navigation */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại chi tiết nhiệm vụ</span>
        </button>
      </div>

      {/* 2. Page Header */}
      <div className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            THỰC HIỆN NHIỆM VỤ
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Nộp bài làm
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              {item.title} • {item.className}
            </p>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Bản nháp
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {draftSavedMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{draftSavedMessage}</span>
        </div>
      )}

      {/* 3. Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: File Upload + Note + Commitment (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Tệp bài làm &amp; Minh chứng
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Tải các tệp đáp ứng yêu cầu nhiệm vụ. Bạn có thể lưu bản nháp và quay lại hoàn thiện trước hạn nộp.
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.xlsx,.xls,.zip,.rar"
            className="hidden"
          />

          {/* Drag & Drop Area */}
          {!filePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900/50 hover:border-blue-400 dark:hover:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20 text-center cursor-pointer transition-all space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                Kéo thả tệp vào đây hoặc <span className="text-blue-600 dark:text-blue-400 underline">chọn từ máy tính</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                Định dạng hỗ trợ: PDF, DOCX, XLSX hoặc ZIP • Tối đa 50 MB/tệp
              </p>
            </div>
          ) : (
            /* Selected File Preview Box */
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {filePreview.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400">
                    {filePreview.size} • Sẵn sàng nộp
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Gỡ tệp"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Student Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200">
              Ghi chú cho người chấm <span className="font-normal text-slate-400">(không bắt buộc)</span>
            </label>
            <textarea
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              rows={3}
              placeholder="Giải thích ngắn gọn về bài làm, phương pháp thực hiện hoặc liên kết minh chứng trực tuyến nếu có..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
            />
          </div>

          {/* Honesty Commitment Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="honest"
              checked={isHonestChecked}
              onChange={(e) => setIsHonestChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="honest" className="text-xs text-slate-600 dark:text-neutral-300 cursor-pointer select-none">
              Tôi xác nhận đây là bài làm do chính mình hoàn thành và chịu trách nhiệm về nội dung, dữ liệu đã nộp.
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              disabled={isSubmitting || isSavingDraft}
              onClick={handleSubmitFinal}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang ghi nhận bài nộp...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Nộp bài</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting || isSavingDraft}
              onClick={handleSaveDraft}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 font-semibold text-xs text-neutral-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              {isSavingDraft ? 'Đang lưu...' : 'Lưu bản nháp'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Quay lại
            </button>
          </div>
        </div>

        {/* Right Info: Submission requirements & Callout (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Trước khi nộp bài
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-neutral-400">Hạn chót</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {item.deadlineFormatted || 'Không giới hạn'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Định dạng</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                  PDF, DOCX, XLSX, ZIP
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Dung lượng tối đa</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">50 MB / tệp</span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500 dark:text-neutral-400">Số tệp dự kiến</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200">1 tệp minh chứng</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              Sau khi nộp, hệ thống ghi nhận thời gian và phiên bản bài làm; bạn chỉ có thể sửa hoặc nộp lại nếu người giao cho phép.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
