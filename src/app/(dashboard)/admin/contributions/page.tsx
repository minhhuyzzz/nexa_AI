'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  FileText,
  Table,
  FileArchive,
  Image as ImageIcon,
  ChevronRight,
  Download,
  Send,
  X,
  User,
  ShieldAlert,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useEffect } from 'react';
import type { ContributionItem } from '@/types/contributions';

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'needs_revision'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContributionItem | null>(null);

  // Review action modal state
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexa_contributions');
      if (stored) {
        setContributions(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Filter items
  const filteredList = contributions.filter((item) => {
    const matchesTab = activeTab === 'all' || item.status === activeTab;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const countPending = contributions.filter((c) => c.status === 'pending').length;
  const countApproved = contributions.filter((c) => c.status === 'approved').length;
  const countNeedsRevision = contributions.filter((c) => c.status === 'needs_revision').length;

  const handleOpenReview = (item: ContributionItem) => {
    setSelectedItem(item);
    setReviewFeedback(item.adminFeedback || '');
    setActionSuccessMsg('');
  };

  const handleApprove = () => {
    if (!selectedItem) return;

    const updated: ContributionItem = {
      ...selectedItem,
      status: 'approved',
      reviewedAt: new Date().toLocaleDateString('vi-VN'),
      pointsRewarded: 100,
      adminFeedback:
        reviewFeedback.trim() ||
        'Đề xuất tình huống đạt chuẩn Khung năng lực số NEXA. Đã được phê duyệt và cộng +100 điểm thưởng.',
    };

    setContributions((prev) => {
      const next = prev.map((c) => (c.id === selectedItem.id ? updated : c));
      localStorage.setItem('nexa_contributions', JSON.stringify(next));
      return next;
    });
    setSelectedItem(updated);
    setActionSuccessMsg('Đã phê duyệt đề thi thành công! Học viên được cộng +100 điểm thưởng.');
  };

  const handleRequestRevision = () => {
    if (!selectedItem || !reviewFeedback.trim()) return;

    const updated: ContributionItem = {
      ...selectedItem,
      status: 'needs_revision',
      reviewedAt: new Date().toLocaleDateString('vi-VN'),
      adminFeedback: reviewFeedback.trim(),
    };

    setContributions((prev) =>
      prev.map((c) => (c.id === selectedItem.id ? updated : c))
    );
    setSelectedItem(updated);
    setActionSuccessMsg('Đã gửi yêu cầu bổ sung đến học viên thành công.');
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
      return <ImageIcon className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />;
    }
    return <FileText className="w-4 h-4 text-sky-600 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              QUẢN TRỊ HỌC THUẬT
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Thẩm Định Đề Thi Đóng Góp Từ Cộng Đồng
            </h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Chờ thẩm định: <strong className="font-semibold text-amber-900">{countPending}</strong> đề bài
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rà soát đề bài và tệp minh chứng do người học đề xuất. Phê duyệt để tự động đưa vào Ngân hàng đề thi và cộng +100 điểm thưởng cho học viên.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'pending' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>Chờ duyệt ({countPending})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({contributions.length})
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'approved' ? 'bg-white' : 'bg-emerald-600'}`} />
            <span>Đã duyệt ({countApproved})</span>
          </button>

          <button
            onClick={() => setActiveTab('needs_revision')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'needs_revision'
                ? 'bg-rose-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'needs_revision' ? 'bg-white' : 'bg-rose-600'}`} />
            <span>Cần bổ sung ({countNeedsRevision})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative text-xs min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc từ khóa đề bài..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* Contributions List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-md border border-slate-200/80 p-8">
            Không có đề xuất nào trong danh mục này.
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenReview(item)}
              className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs cursor-pointer"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {item.code}
                  </span>
                  <span className="text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {item.domain}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    &bull; Người gửi: <strong>Trần Minh Huy</strong> (Học viên)
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug hover:text-sky-600 transition-colors">
                  {item.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                  <span>Gửi vào: {item.submittedAt}</span>
                  <span>&bull;</span>
                  <span>
                    Hình thức:{' '}
                    {item.questionType === 'SCENARIO'
                      ? 'Tình huống'
                      : item.questionType === 'PRACTICAL_FILE'
                      ? 'Nộp tệp tin'
                      : item.questionType === 'MCQ'
                      ? 'Trắc nghiệm'
                      : 'Liên kết'}
                  </span>
                  {item.attachedFiles.length > 0 && (
                    <>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <FileText className="w-3.5 h-3.5 text-sky-600" />
                        {item.attachedFiles.length} tệp đính kèm
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status and Action button */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {item.status === 'approved' ? (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Đã duyệt (+100đ)</span>
                  </span>
                ) : item.status === 'pending' ? (
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Cần thẩm định</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 font-semibold text-[11px] border border-rose-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>Đã yêu cầu bổ sung</span>
                  </span>
                )}

                <button
                  type="button"
                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
                >
                  Thẩm định
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADMIN REVIEW DRAWER / MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-2xl w-full shadow-sm space-y-5 text-slate-900 text-xs max-h-[90vh] overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 text-xs"
              >
                &larr; Đóng bảng thẩm định
              </button>

              <div className="font-mono tabular-nums text-[11px] text-slate-500">
                Mã: {selectedItem.code}
              </div>
            </div>

            {/* Notification message after action */}
            {actionSuccessMsg && (
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* Title & Metadata */}
            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">{selectedItem.domain}</span>
                <span>&bull;</span>
                <span>Người gửi: <strong>Trần Minh Huy</strong> (Học viên)</span>
                <span>&bull;</span>
                <span>Ngày gửi: {selectedItem.submittedAt}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {selectedItem.title}
              </h2>
            </div>

            {/* Prompt Description */}
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-800 text-xs">
                Mô tả nội dung đề bài / Tình huống do người học gửi:
              </div>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                {selectedItem.prompt}
              </p>
            </div>

            {/* Rubric Notes */}
            {selectedItem.solutionNotes && (
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="font-bold text-slate-800 text-xs">
                  Gợi ý đáp án chuẩn / Tiêu chí Rubric:
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                  {selectedItem.solutionNotes}
                </p>
              </div>
            )}

            {/* Attached Files with Download Action */}
            {selectedItem.attachedFiles && selectedItem.attachedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-xs">
                  Tệp đính kèm cần thẩm định ({selectedItem.attachedFiles.length}):
                </div>
                <div className="space-y-1.5">
                  {selectedItem.attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-md border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-md">
                        {getFileIcon(file.name)}
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">
                            {file.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {file.size}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 cursor-pointer underline flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>Mở / Tải tệp</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Decision Feedback Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-800 block text-xs">
                Ý kiến thẩm định &amp; Phản hồi cho người học:
              </label>
              <textarea
                rows={3}
                placeholder="Nhập nhận xét về chất lượng câu hỏi, góp ý bổ sung hoặc lý do phê duyệt/từ chối..."
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestRevision}
                  className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Yêu cầu bổ sung</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phê duyệt (+100đ)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
