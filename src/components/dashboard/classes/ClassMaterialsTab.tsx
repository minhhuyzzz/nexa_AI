'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function ClassMaterialsTab({ classId, role, currentUserId }: ClassMaterialsTabProps) {
  const [files, setFiles] = useState<ClassFileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'FILE' | 'LINK'>('FILE');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err: unknown) {
      console.error('Error fetching class files:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'FILE' && !selectedFile) return;
    if (modalMode === 'LINK' && (!linkTitle.trim() || !linkUrl.trim())) return;

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
          fetchFiles();
        } else {
          const err = await res.json();
          alert(err.error || 'Tải tệp lên thất bại');
        }
      } else {
        // Link mode
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
          const err = await res.json();
          alert(err.error || 'Thêm liên kết thất bại');
        }
      }
    } catch {
      alert('Đã xảy ra lỗi khi tải lên');
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
        return <FileText className="w-5 h-5 text-sky-600" strokeWidth={1.75} />;
      case 'XLSX':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />;
      case 'IMG':
        return <ImageIcon className="w-5 h-5 text-amber-600" strokeWidth={1.75} />;
      default:
        return <LinkIcon className="w-5 h-5 text-slate-500" strokeWidth={1.75} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Kho Tài Liệu &amp; Tham Khảo</h3>
          <p className="text-xs text-slate-500">
            {role === 'EVALUATOR'
              ? 'Tải lên giáo trình, hướng dẫn khảo thí và các liên kết học tập cho lớp.'
              : 'Tài liệu học tập và tham khảo được Người đánh giá chia sẻ.'}
          </p>
        </div>

        {role === 'EVALUATOR' && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Thêm tài liệu / Link</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" strokeWidth={1.75} />
          <span>Đang nạp danh sách tài liệu...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-md bg-white space-y-2">
          <Paperclip className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.75} />
          <p className="text-xs text-slate-500">Chưa có tài liệu hoặc liên kết nào được chia sẻ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {files.map((file) => {
            const canDelete = role === 'EVALUATOR' || file.uploader_id === currentUserId;

            return (
              <div
                key={file.id}
                className="p-3.5 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100 shrink-0">
                    {renderFileIcon(file.file_type)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={file.file_name}>
                      {file.file_name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>{formatFileSize(file.file_size_bytes)}</span>
                      <span>·</span>
                      <span>{new Date(file.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded text-slate-500 hover:text-sky-700 hover:bg-slate-100 transition-colors"
                    title={file.file_type === 'LINK' ? 'Mở liên kết' : 'Tải xuống'}
                  >
                    {file.file_type === 'LINK' ? (
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                    ) : (
                      <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                    )}
                  </a>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUploadFile}
            className="bg-white border border-slate-200 rounded-md shadow-md max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                <span>Thêm Tài Liệu Vào Nhóm</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalMode('FILE')}
                className={`flex-1 py-1 rounded transition-colors ${
                  modalMode === 'FILE' ? 'bg-white shadow-xs text-sky-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tải lên tệp đính kèm
              </button>
              <button
                type="button"
                onClick={() => setModalMode('LINK')}
                className={`flex-1 py-1 rounded transition-colors ${
                  modalMode === 'LINK' ? 'bg-white shadow-xs text-sky-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chia sẻ liên kết ngoài
              </button>
            </div>

            {modalMode === 'FILE' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Chọn tệp tài liệu (PDF, Word, Excel, Ảnh) *
                  </label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Tiêu đề tài liệu / liên kết *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Hướng dẫn Khung Năng Lực Số DigComp 3.0"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Địa chỉ URL (https://...) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/tai-lieu.pdf"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? 'Đang tải lên...' : 'Lưu tài liệu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
