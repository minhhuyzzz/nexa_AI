'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Paperclip,
  Plus,
  ExternalLink,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Loader2,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ClassFileItem {
  id: string;
  class_id: string;
  uploader_id: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  file_type: 'PDF' | 'DOCX' | 'XLSX' | 'IMG' | 'LINK';
  created_at: string;
  uploader?: {
    id: string;
    nickname?: string;
    email?: string;
  };
}

interface ClassMaterialsTabProps {
  classId: string;
  role: 'EVALUATOR' | 'LEARNER';
  currentUserId: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function ClassMaterialsTab({ classId, role, currentUserId }: ClassMaterialsTabProps) {
  const [files, setFiles] = useState<ClassFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Upload Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'FILE' | 'LINK'>('FILE');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch(`/api/classes/${classId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        const err = await res.json().catch(() => ({}));
        setFetchError(err.error || 'Không thể tải danh sách tài liệu');
      }
    } catch (err: unknown) {
      console.error('Error fetching class files:', err);
      setFetchError('Lỗi kết nối khi tải tài liệu');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelect = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('Dung lượng tệp vượt quá giới hạn 10 MB. Vui lòng chọn tệp nhỏ hơn.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (modalMode === 'FILE') {
      if (!selectedFile) {
        setFileError('Vui lòng chọn tệp tài liệu trước khi lưu.');
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setFileError('Dung lượng tệp vượt quá giới hạn 10 MB.');
        return;
      }
    } else {
      if (!linkTitle.trim() || !linkUrl.trim()) {
        setFileError('Vui lòng nhập đầy đủ tiêu đề và địa chỉ liên kết.');
        return;
      }
    }

    try {
      setIsUploading(true);

      if (modalMode === 'FILE' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('fileName', selectedFile.name);

        const res = await fetch(`/api/classes/${classId}/files`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          setShowModal(false);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          fetchFiles();
        } else {
          const err = await res.json().catch(() => ({}));
          setFileError(err.error || 'Tải tệp lên thất bại');
        }
      } else {
        const res = await fetch(`/api/classes/${classId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: linkTitle.trim(),
            fileUrl: linkUrl.trim(),
            fileType: 'LINK',
            fileSizeBytes: 0,
          }),
        });

        if (res.ok) {
          setShowModal(false);
          setLinkTitle('');
          setLinkUrl('');
          fetchFiles();
        } else {
          const err = await res.json().catch(() => ({}));
          setFileError(err.error || 'Thêm liên kết thất bại');
        }
      }
    } catch {
      setFileError('Đã xảy ra lỗi khi tải lên máy chủ.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;

    try {
      const res = await fetch(`/api/classes/${classId}/files/${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return 'Liên kết ngoài';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
      case 'DOCX':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />;
      case 'XLSX':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />;
      case 'IMG':
        return <ImageIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />;
      default:
        return <LinkIcon className="w-5 h-5 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Kho Tài Liệu và Tham Khảo</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            {role === 'EVALUATOR'
              ? 'Tải lên tài liệu hướng dẫn, học liệu (tối đa 10 MB) hoặc chia sẻ liên kết cho nhóm.'
              : 'Tài liệu và liên kết học tập được Quản trị viên chia sẻ cho nhóm.'}
          </p>
        </div>

        {role === 'EVALUATOR' && (
          <button
            type="button"
            onClick={() => {
              setFileError(null);
              setSelectedFile(null);
              setShowModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Thêm tài liệu / Link</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 dark:text-neutral-500 flex items-center justify-center gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Đang nạp danh sách tài liệu...</span>
        </div>
      ) : fetchError ? (
        <div className="p-8 text-center border border-dashed border-rose-200 dark:border-rose-900/60 rounded-2xl bg-rose-50/30 dark:bg-rose-950/20 space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" strokeWidth={1.75} />
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{fetchError}</p>
          <button
            type="button"
            onClick={fetchFiles}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Thử tải lại
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#111114] space-y-2">
          <Paperclip className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" strokeWidth={1.75} />
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Chưa có tài liệu hoặc liên kết nào được chia sẻ.</p>
          <span className="text-[11px] text-slate-400 dark:text-neutral-500 block">
            Hỗ trợ các tệp PDF, DOCX, XLSX, hình ảnh (tối đa 10 MB) hoặc liên kết ngoài.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {files.map((file) => {
            const canDelete = role === 'EVALUATOR' || file.uploader_id === currentUserId;

            return (
              <div
                key={file.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shrink-0">
                    {renderFileIcon(file.file_type)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate" title={file.file_name}>
                      {file.file_name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 font-mono mt-1">
                      <span>{formatFileSize(file.file_size_bytes)}</span>
                      <span>&bull;</span>
                      <span>{new Date(file.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                    title={file.file_type === 'LINK' ? 'Mở liên kết ngoài' : 'Tải xuống tệp'}
                  >
                    {file.file_type === 'LINK' ? (
                      <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
                    ) : (
                      <Download className="w-4 h-4" strokeWidth={1.75} />
                    )}
                  </a>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload / Add Link Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Thêm Tài Liệu Vào Nhóm</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-neutral-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-900 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setModalMode('FILE');
                  setFileError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modalMode === 'FILE'
                    ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Tải lên tệp (Tối đa 10 MB)
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode('LINK');
                  setFileError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  modalMode === 'LINK'
                    ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Chia sẻ liên kết ngoài
              </button>
            </div>

            {fileError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{fileError}</span>
              </div>
            )}

            <form onSubmit={handleUploadFile} className="space-y-4 text-xs">
              {modalMode === 'FILE' ? (
                <div className="space-y-2">
                  <label className="font-semibold text-neutral-800 dark:text-zinc-200 block">
                    Tệp đính kèm *
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                        : selectedFile
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/40 dark:bg-zinc-900/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    />

                    {selectedFile ? (
                      <div className="space-y-1.5">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-xs mx-auto">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                          {formatFileSize(selectedFile.size)} &bull; Nhấp để đổi tệp khác
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
                        <p className="font-semibold text-neutral-800 dark:text-zinc-200">
                          Kéo thả tệp vào đây hoặc <span className="text-blue-600 dark:text-blue-400 underline underline-offset-2">chọn từ thiết bị</span>
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                          PDF, Word, Excel, Ảnh &bull; Dung lượng tối đa: <strong>10 MB</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                      Tiêu đề tài liệu / liên kết *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Hướng dẫn Khung năng lực số hoặc Slide bài giảng"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600 font-sans"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                      Địa chỉ URL liên kết (https://...) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/tai-lieu.pdf"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (modalMode === 'FILE' && !selectedFile)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu tài liệu</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
