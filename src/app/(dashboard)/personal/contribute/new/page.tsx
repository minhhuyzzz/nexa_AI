'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle2,
  Send,
  UploadCloud,
  Trash2,
  Check,
  Table,
  FileArchive,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  progress: number;
}

export default function NewContributionPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('D3: Sáng tạo Nội dung số');
  const [questionType, setQuestionType] = useState('PRACTICAL_FILE');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [prompt, setPrompt] = useState('');
  const [solutionNotes, setSolutionNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionCode, setSubmissionCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: AttachedFile[] = Array.from(files).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || file.name.split('.').pop() || 'file',
      progress: 100,
    }));

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const finalPrompt = prompt.trim() || 'Nội dung chi tiết được mô tả trong tệp đính kèm.';
    if (finalPrompt.length < 5) {
      setSubmitError('Nội dung đề bài tối thiểu 5 ký tự');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          domain,
          questionType,
          difficulty,
          prompt: finalPrompt,
          solutionNotes: solutionNotes.trim(),
          attachedFiles,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissionCode(data.contribution?.code || 'CB-OK');
        setSubmitted(true);
      } else {
        setSubmitError(data.error || 'Lỗi khi gửi đề xuất lên hệ thống');
      }
    } catch {
      setSubmitError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <Table className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (['zip', 'rar', '7z'].includes(ext || '')) {
      return <FileArchive className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={1.75} />;
    }
    return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
        <Link
          href="/personal/contribute"
          className="hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quản lý đóng góp</span>
        </Link>
        <span>/</span>
        <span className="text-neutral-800 dark:text-neutral-200 font-semibold">Tạo đề xuất mới</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Đóng góp đề bài mới
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
          Đóng góp câu hỏi và bài thực hành vào ngân hàng chung. Nhận ngay 100 điểm tích lũy khi đề được thẩm định đạt chuẩn.
        </p>
      </div>

      {submitted ? (
        <div className="p-8 sm:p-9 rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-8 h-8" strokeWidth={2} />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Mã đề xuất: {submissionCode}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-3">
              Đề xuất của bạn đã được gửi thành công!
            </h2>
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-300 max-w-md mx-auto leading-relaxed">
            Hội đồng Thẩm định Học thuật NEXA đã nhận được hồ sơ của bạn và sẽ xét duyệt trong vòng 24-48 giờ. Bạn có thể theo dõi tiến độ duyệt bất kỳ lúc nào.
          </p>

          {attachedFiles.length > 0 && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 text-left space-y-2 text-xs">
              <div className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px] uppercase tracking-wider font-mono">
                Tệp đính kèm ({attachedFiles.length}):
              </div>
              <div className="space-y-1.5">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(file.name)}
                      <span className="truncate font-medium text-neutral-800 dark:text-zinc-200">{file.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {file.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setTitle('');
                setPrompt('');
                setSolutionNotes('');
                setAttachedFiles([]);
              }}
              className="px-5 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            >
              Gửi thêm đề bài khác
            </button>
            <Link
              href="/personal/contribute"
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              Xem danh sách đóng góp
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-5 text-xs shadow-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-900 dark:text-neutral-100 block">
              Tiêu đề bài khảo thí / Tình huống đề xuất: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Đánh giá kỹ năng lập mô hình tài chính và phân tích kịch bản bằng Excel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:bg-white dark:focus:bg-[#111114] focus:border-blue-600 focus:outline-none text-xs transition-colors"
            />
          </div>

          {/* Domain & Type & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block">
                Miền năng lực số:
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:bg-white focus:outline-none"
              >
                <option value="D1: Thông tin & Dữ liệu">D1: Thông tin &amp; Dữ liệu</option>
                <option value="D2: Giao tiếp & Hợp tác">D2: Giao tiếp &amp; Hợp tác</option>
                <option value="D3: Sáng tạo Nội dung số">D3: Sáng tạo Nội dung số</option>
                <option value="D4: An toàn & Bảo mật">D4: An toàn &amp; Bảo mật</option>
                <option value="D5: Giải quyết Vấn đề">D5: Giải quyết Vấn đề</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block">
                Định dạng đề xuất:
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:bg-white focus:outline-none"
              >
                <option value="PRACTICAL_FILE">Thực hành nộp tệp (Excel, Word, PDF)</option>
                <option value="SCENARIO">Xử lý tình huống thực tế</option>
                <option value="MCQ">Trắc nghiệm kiến thức (MCQ)</option>
                <option value="DIGITAL_LINK">Thực hành nộp liên kết số (GitHub, Figma)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-800 dark:text-zinc-200 block">
                Độ khó dự kiến:
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:bg-white focus:outline-none"
              >
                <option value="FOUNDATION">Foundation</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                Tệp đề thi hoặc minh chứng đính kèm (Khuyến nghị):
              </label>
              <span className="text-[11px] text-slate-400">
                Word, Excel, PDF, ZIP
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".docx,.doc,.xlsx,.xls,.csv,.pdf,.zip,.rar,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-100 dark:border-blue-900">
                <UploadCloud className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Kéo thả tệp đề bài vào đây hoặc <span className="text-blue-600 underline">chọn tệp từ máy tính</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Có thể nộp file đề Word, bảng tính Excel mẫu hoặc đề cương PDF
              </p>
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
                  Tệp đã chọn ({attachedFiles.length}):
                </div>
                <div className="space-y-1.5">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-md">
                        {getFileIcon(file.name)}
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {file.size}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Đã chọn
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Xóa tệp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prompt Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                Nội dung mô tả đề bài / tình huống:
              </label>
              {attachedFiles.length > 0 && (
                <span className="text-[11px] text-emerald-600 font-medium">
                  (Có thể để trống nếu đã có trong tệp đính kèm)
                </span>
              )}
            </div>
            <textarea
              rows={4}
              placeholder="Mô tả bối cảnh tình huống thực tế, dữ liệu đầu vào hoặc yêu cầu người học cần giải quyết..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:bg-white dark:focus:bg-[#111114] focus:border-blue-600 focus:outline-none text-xs leading-relaxed"
            />
          </div>

          {/* Solution & Rubric */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-900 dark:text-neutral-100 block">
              Gợi ý đáp án chuẩn hoặc Tiêu chí Rubric đánh giá:
            </label>
            <textarea
              rows={3}
              placeholder="Các tiêu chí để xác định người học đạt chuẩn hoặc hướng dẫn chấm điểm tham khảo..."
              value={solutionNotes}
              onChange={(e) => setSolutionNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:bg-white dark:focus:bg-[#111114] focus:border-blue-600 focus:outline-none text-xs leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link
              href="/personal/contribute"
              className="text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 font-semibold self-center sm:self-auto"
            >
              Hủy bỏ
            </Link>

            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gửi đề xuất...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi đề xuất &amp; nhận 100 điểm</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
