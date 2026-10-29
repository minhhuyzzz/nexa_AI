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
  HelpCircle,
  Sparkles,
  AlertCircle,
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
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
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
    const finalPrompt = prompt.trim() || 'Nội dung chi tiết được mô tả trong các tệp đính kèm đính kèm.';
    if (finalPrompt.length < 10) {
      setSubmitError('Nội dung đề bài tối thiểu 10 ký tự');
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
        setSubmitError(data.error || 'Lỗi khi gửi đề xuất lên máy chủ');
      }
    } catch (err) {
      setSubmitError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <Table className="w-4 h-4 text-emerald-600" />;
    }
    if (['zip', 'rar', '7z'].includes(ext || '')) {
      return <FileArchive className="w-4 h-4 text-amber-600" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-sky-600" strokeWidth={1.75} />;
    }
    return <FileText className="w-4 h-4 text-sky-600" />;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/personal/contribute"
          className="hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quản lý đóng góp</span>
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-semibold">Tạo đề xuất mới</span>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            COMMUNITY SUBMISSION
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Đóng Góp Tình Huống &amp; Đề Bài Khảo Thí Mới
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Đề xuất tình huống thực tế hoặc gửi tệp đề bài khảo thí năng lực số cho Ban Thẩm định NEXA. Nhận ngay <span className="font-semibold text-emerald-700">+100 điểm thưởng</span> khi đề xuất được duyệt!
        </p>
      </div>

      {submitted ? (
        <div className="p-8 rounded-md border border-emerald-200 bg-emerald-50/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded border border-emerald-200">
              Mã đề xuất CSDL: {submissionCode}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              Đề xuất của bạn đã được lưu trữ bền vững trên máy chủ!
            </h2>
          </div>

          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Hội đồng Thẩm định Học thuật NEXA đã nhận được hồ sơ của bạn và sẽ xét duyệt trong vòng 24-48 giờ. Bạn có thể theo dõi tiến độ duyệt bất kỳ lúc nào trên tài khoản của mình.
          </p>

          {attachedFiles.length > 0 && (
            <div className="max-w-md mx-auto p-3.5 rounded-md bg-white border border-slate-200 text-left space-y-2 text-xs">
              <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider font-mono">
                Tệp đính kèm đã gửi ({attachedFiles.length}):
              </div>
              <div className="space-y-1.5">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200/80"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(file.name)}
                      <span className="truncate font-medium text-slate-800">{file.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                      {file.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setTitle('');
                setPrompt('');
                setSolutionNotes('');
                setAttachedFiles([]);
              }}
              className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Gửi thêm đề bài khác
            </button>
            <Link
              href="/personal/contribute"
              className="px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              Về danh sách quản lý đóng góp
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-md border border-slate-200 bg-white space-y-5 text-xs shadow-xs">
          {submitError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Tiêu đề bài khảo thí / Tình huống đề xuất: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Đánh giá kỹ năng lập mô hình tài chính và phân tích kịch bản bằng Excel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Domain & Type & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Miền năng lực số:
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:outline-none"
              >
                <option value="D1: Thông tin & Dữ liệu">D1: Thông tin &amp; Dữ liệu</option>
                <option value="D2: Giao tiếp & Hợp tác">D2: Giao tiếp &amp; Hợp tác</option>
                <option value="D3: Sáng tạo Nội dung số">D3: Sáng tạo Nội dung số</option>
                <option value="D4: An toàn & Bảo mật">D4: An toàn &amp; Bảo mật</option>
                <option value="D5: Giải quyết Vấn đề">D5: Giải quyết Vấn đề</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Định dạng đề xuất:
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:outline-none"
              >
                <option value="PRACTICAL_FILE">Thực hành nộp tệp tin (Excel, Word, PDF)</option>
                <option value="SCENARIO">Xử lý tình huống thực tế (Scenario)</option>
                <option value="MCQ">Trắc nghiệm kiến thức (MCQ)</option>
                <option value="DIGITAL_LINK">Thực hành nộp liên kết số (GitHub, Figma, Notion)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Độ khó dự kiến:
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:outline-none"
              >
                <option value="FOUNDATION">Foundation</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>

          {/* FILE UPLOAD SECTION */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 block">
                Tệp đề thi hoặc minh chứng đính kèm (Khuyến nghị):
              </label>
              <span className="text-[11px] text-slate-400">
                Hỗ trợ Word (.docx), Excel (.xlsx), PDF, ZIP
              </span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`p-6 rounded-md border-2 border-dashed transition-all text-center cursor-pointer ${
                isDragging
                  ? 'border-sky-500 bg-sky-50/50'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
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
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-600">
                <UploadCloud className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-semibold text-slate-700">
                Kéo thả tệp đề bài vào đây hoặc <span className="text-sky-600 underline">chọn tệp từ máy tính</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Bạn có thể nộp đề thi có sẵn ở định dạng Word, file mẫu Excel hoặc đề cương PDF
              </p>
            </div>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-semibold text-slate-600">
                  Danh sách tệp chuẩn bị gửi ({attachedFiles.length}):
                </div>
                <div className="space-y-1.5">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-md border border-slate-200 bg-white flex items-center justify-between text-xs transition-colors hover:border-slate-300"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-md">
                        {getFileIcon(file.name)}
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">
                            {file.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {file.size} &bull; Sẵn sàng thẩm định
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Đã đính kèm
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Gỡ bỏ tệp"
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-800 block">
                Nội dung mô tả tình huống / Đề bài tóm tắt:
              </label>
              {attachedFiles.length > 0 && (
                <span className="text-[11px] text-emerald-700 font-medium">
                  (Có thể để trống nếu nội dung đã có trong tệp đính kèm)
                </span>
              )}
            </div>
            <textarea
              rows={4}
              placeholder="Mô tả bối cảnh tình huống thực tế, dữ liệu đầu vào hoặc vấn đề cần người học giải quyết (hoặc ghi chú: Xem nội dung chi tiết trong tệp đính kèm)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs leading-relaxed"
            />
          </div>

          {/* Solution & Rubric */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Gợi ý đáp án chuẩn hoặc Tiêu chí Rubric đánh giá:
            </label>
            <textarea
              rows={3}
              placeholder="Các tiêu chuẩn để xác định người học đạt hay không đạt (hoặc đáp án tham khảo)..."
              value={solutionNotes}
              onChange={(e) => setSolutionNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link
              href="/personal/contribute"
              className="text-slate-500 hover:text-slate-800 font-medium self-center sm:self-auto"
            >
              Hủy bỏ
            </Link>

            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang lưu vào CSDL...' : 'Gửi đề xuất & tệp đính kèm (+100đ)'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
