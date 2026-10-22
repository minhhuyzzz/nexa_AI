'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Table,
  FileArchive,
  Image as ImageIcon,
  ChevronRight,
  ExternalLink,
  Award,
  Sparkles,
  Layers,
  ArrowRight,
  Download,
} from 'lucide-react';
import { ContributionItem } from '@/types/contributions';

export default function LearnerContributeOverviewPage() {
  const [contributions, setContributions] = useState<ContributionItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexa_community_contributions');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'needs_revision'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContributionItem | null>(null);

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
              SÁNG KIẾN CỘNG ĐỒNG
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản Lý Đề Thi &amp; Sáng Kiến Đóng Góp
            </h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Tổng đề đã đóng góp: <strong className="font-semibold text-slate-900">{contributions.length}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến độ thẩm định các đề bài khảo thí do bạn đề xuất, xem phản hồi từ Hội đồng Học thuật NEXA và quản lý điểm thưởng.
          </p>
        </div>

        {/* Primary CTA */}
        <Link
          href="/learner/contribute/new"
          className="px-4 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Đóng góp đề bài mới</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
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
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'approved' ? 'bg-white' : 'bg-emerald-600'}`} />
            <span>Đã phê duyệt ({countApproved})</span>
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

        {/* Search Box */}
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
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-md border border-slate-200/80 p-8 space-y-3">
            <p>Không tìm thấy đề bài nào trong danh mục này.</p>
            <Link
              href="/learner/contribute/new"
              className="inline-flex items-center gap-1 text-sky-600 font-semibold hover:underline"
            >
              <span>+ Đóng góp tình huống hoặc đề bài mới ngay</span>
            </Link>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs cursor-pointer"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.code}
                  </span>
                  <span className="text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {item.domain}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    &bull; Hình thức:{' '}
                    {item.questionType === 'SCENARIO'
                      ? 'Tình huống thực tế'
                      : item.questionType === 'PRACTICAL_FILE'
                      ? 'Thực hành nộp tệp'
                      : item.questionType === 'MCQ'
                      ? 'Trắc nghiệm kiến thức'
                      : 'Liên kết số'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug hover:text-sky-600 transition-colors">
                  {item.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                  <span>Ngày gửi: {item.submittedAt}</span>
                  {item.attachedFiles.length > 0 && (
                    <>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-slate-600">
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
                    <span>Đang thẩm định</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 font-semibold text-[11px] border border-rose-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>Cần bổ sung</span>
                  </span>
                )}

                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-2xl w-full shadow-sm space-y-5 text-slate-900 text-xs max-h-[90vh] overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 text-xs"
              >
                &larr; Quay lại danh sách
              </button>

              <div className="font-mono tabular-nums text-[11px] text-slate-500">
                {selectedItem.code}
              </div>
            </div>

            {/* Status Alert Banner */}
            {selectedItem.status === 'approved' ? (
              <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ĐÃ ĐƯỢC HỘI ĐỒNG THẨM ĐỊNH PHÊ DUYỆT</span>
                  </div>
                  <span className="text-emerald-700 font-bold text-[11px]">
                    +100 ĐIỂM THƯỞNG
                  </span>
                </div>
                <p className="text-emerald-900 leading-relaxed text-[11px]">
                  {selectedItem.adminFeedback}
                </p>
                {selectedItem.reviewedAt && (
                  <div className="text-[10px] text-emerald-700 font-mono">
                    Ngày phê duyệt: {selectedItem.reviewedAt}
                  </div>
                )}
              </div>
            ) : selectedItem.status === 'pending' ? (
              <div className="p-3.5 rounded-md bg-amber-50 border border-amber-200 space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>HỒ SƠ ĐANG CHỜ THẨM ĐỊNH HỌC THUẬT</span>
                </div>
                <p className="text-amber-900 leading-relaxed text-[11px]">
                  {selectedItem.adminFeedback ||
                    'Ban Thẩm định NEXA đang rà soát nội dung câu hỏi, barem đáp án và tính ứng dụng thực tế. Kết quả sẽ được phản hồi trong vòng 24-48 giờ.'}
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>CẦN BỔ SUNG &amp; HOÀN THIỆN ĐỀ XUẤT</span>
                </div>
                <p className="text-rose-900 leading-relaxed text-[11px]">
                  <span className="font-semibold">Ý kiến phản hồi từ Ban Thẩm định:</span> &ldquo;
                  {selectedItem.adminFeedback}&rdquo;
                </p>
                <div className="pt-1">
                  <Link
                    href="/learner/contribute/new"
                    className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-800 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Cập nhật &amp; gửi lại đề bài</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Title & Metadata */}
            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">{selectedItem.domain}</span>
                <span>&bull;</span>
                <span>Độ khó: {selectedItem.difficulty}</span>
                <span>&bull;</span>
                <span>Ngày gửi: {selectedItem.submittedAt}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {selectedItem.title}
              </h2>
            </div>

            {/* Prompt Content */}
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-800 text-xs">
                Mô tả nội dung đề bài / Tình huống:
              </div>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                {selectedItem.prompt}
              </p>
            </div>

            {/* Rubric Notes */}
            {selectedItem.solutionNotes && (
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="font-bold text-slate-800 text-xs">
                  Tiêu chí Rubric / Đáp án tham khảo:
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                  {selectedItem.solutionNotes}
                </p>
              </div>
            )}

            {/* Attached Files List */}
            {selectedItem.attachedFiles && selectedItem.attachedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-xs">
                  Tệp đính kèm ({selectedItem.attachedFiles.length}):
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
                        <span>Xem tệp</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Đóng
              </button>

              <Link
                href="/learner/contribute/new"
                className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Đóng góp thêm đề bài khác</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
