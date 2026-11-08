'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  CalendarPlus,
  Search,
  Clock,
  Award,
  ArrowRight,
  Edit3,
  Layers,
  FileText,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Copy,
  Radio,
  MoreVertical,
  Trash2,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

export interface AssessmentItemData {
  id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  passing_score: number;
  is_published: boolean;
  organization_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  assessment_items?: { id: string }[];
}

interface Props {
  slug: string;
  orgName: string;
  isManager: boolean;
  assessments: AssessmentItemData[];
}

export function OrgAssessmentsListView({
  slug,
  orgName,
  isManager,
  assessments,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'published' | 'draft' | 'all'>('published');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Dropdown 3 chấm state (Position Fixed để không bao giờ bị overflow-x/y của table che khuất)
  const [dropdownMenu, setDropdownMenu] = useState<{
    id: string;
    top: number;
    right: number;
    placement: 'top' | 'bottom';
    assessment: AssessmentItemData;
  } | null>(null);

  // Clone & Delete states
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deletingAssessment, setDeletingAssessment] = useState<AssessmentItemData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Đóng dropdown khi click ra ngoài hoặc khi scroll màn hình
  useEffect(() => {
    const handleClose = () => setDropdownMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, []);

  const handleToggleDropdown = (e: React.MouseEvent, item: AssessmentItemData) => {
    e.stopPropagation();
    if (dropdownMenu?.id === item.id) {
      setDropdownMenu(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = 170;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && rect.top > menuHeight ? 'top' : 'bottom';

    setDropdownMenu({
      id: item.id,
      top: placement === 'bottom' ? rect.bottom + 4 : rect.top - 4,
      right: window.innerWidth - rect.right,
      placement,
      assessment: item,
    });
  };

  // Tự ẩn toast sau 4 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const publishedCount = assessments.filter((a) => a.is_published).length;
  const draftCount = assessments.filter((a) => !a.is_published).length;

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (activeTab === 'published' && !a.is_published) return false;
      if (activeTab === 'draft' && a.is_published) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const titleMatch = a.title?.toLowerCase().includes(q);
        const descMatch = a.description?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }

      return true;
    });
  }, [assessments, activeTab, search]);

  // Xử lý sao chép đề khảo thí
  const handleClone = async (assessment: AssessmentItemData) => {
    setDropdownMenu(null);
    setCloningId(assessment.id);
    setToastMessage(null);
    try {
      const res = await fetch(`/api/org/${slug}/assessments/${assessment.id}/clone`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sao chép đề khảo thí thất bại');
      }
      setToastMessage({
        type: 'success',
        text: `Đã sao chép "${assessment.title}" thành công! Đề mới được lưu ở mục Bản nháp.`,
      });
      router.refresh();
    } catch (err: unknown) {
      setToastMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi hệ thống khi sao chép đề thi',
      });
    } finally {
      setCloningId(null);
    }
  };

  // Xử lý phát hành đề thi hoặc chuyển về bản nháp
  const handleTogglePublish = async (assessment: AssessmentItemData, publish: boolean) => {
    setDropdownMenu(null);
    setToastMessage(null);
    try {
      const res = await fetch(`/api/personal/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: publish }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật trạng thái đề thi thất bại');
      }
      setToastMessage({
        type: 'success',
        text: publish
          ? `Đã phát hành đề "${assessment.title}" thành công! Đề đã chuyển sang danh mục Đề thi sẵn sàng.`
          : `Đã chuyển đề "${assessment.title}" về bản nháp.`,
      });
      if (publish) {
        setActiveTab('published');
      }
      router.refresh();
    } catch (err: unknown) {
      setToastMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi hệ thống khi cập nhật trạng thái đề thi',
      });
    }
  };

  // Xử lý xóa đề khảo thí
  const handleDelete = async () => {
    if (!deletingAssessment) return;
    setIsDeleting(true);
    setToastMessage(null);
    try {
      const res = await fetch(`/api/personal/assessments/${deletingAssessment.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xóa đề khảo thí thất bại');
      }
      setToastMessage({
        type: 'success',
        text: data.message || `Đã xóa đề "${deletingAssessment.title}" thành công.`,
      });
      setDeletingAssessment(null);
      router.refresh();
    } catch (err: unknown) {
      setToastMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi hệ thống khi xóa đề thi',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. SaaS Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản lý Đề khảo thí
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Ngân hàng đề đánh giá năng lực số chuẩn 5 miền và các bài khảo thí nội bộ của {orgName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isManager && (
            <Link
              href={`/org/${slug}/assessments/new`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Soạn đề nội bộ mới</span>
            </Link>
          )}

          <Link
            href={`/org/${slug}/campaigns/new`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold shadow-2xs transition-colors"
          >
            <CalendarPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <span>Khởi tạo đợt khảo thí</span>
          </Link>
        </div>
      </div>

      {/* 2. Tabs Bar & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-800 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('published')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'published'
                ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                : 'text-slate-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Đề thi ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'draft'
                ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                : 'text-slate-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Bản nháp ({draftCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                : 'text-slate-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({assessments.length})
          </button>
        </div>

        {/* Search & View Mode */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên đề khảo thí..."
              className="w-full h-8.5 pl-8.5 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded cursor-pointer transition ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-neutral-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Xem dạng Bảng"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded cursor-pointer transition ${
                viewMode === 'grid'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-neutral-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Xem dạng Lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Data View */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-visible">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-zinc-900/40 text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Tên đề khảo thí</th>
                  <th className="py-3 px-4">Số câu</th>
                  <th className="py-3 px-4">Thời lượng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Cập nhật</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400">
                          <FileText className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            Chưa có đề khảo thí nào trong danh mục này
                          </p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                            {search
                              ? 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm. Vui lòng thử lại.'
                              : `Khởi tạo đề khảo thí mới để tổ chức các đợt đánh giá năng lực số cho ${orgName}.`}
                          </p>
                        </div>
                        {isManager && !search && (
                          <div className="pt-2">
                            <Link
                              href={`/org/${slug}/assessments/new`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Soạn đề thi mới ngay</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((a, idx) => {
                    const isCustom = Boolean(a.organization_id);
                    const qCount = a.assessment_items?.length || 0;

                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition group"
                      >
                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                              {a.title}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-neutral-500 line-clamp-1">
                              {a.description || 'Đề đánh giá năng lực số toàn diện.'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 dark:text-neutral-300">
                          {qCount} câu
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 dark:text-neutral-300">
                          {a.duration_minutes || 45} phút
                        </td>
                        <td className="py-3.5 px-4">
                          {a.is_published ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>Sẵn sàng</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Bản nháp</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 tabular-nums">
                          {new Date(a.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút hành động chính */}
                            {a.is_published ? (
                              <Link
                                href={`/org/${slug}/campaigns/new?assessmentId=${a.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs"
                                title="Giao bài theo đợt khảo thí"
                              >
                                <span>Giao bài</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <Link
                                href={`/org/${slug}/assessments/${a.id}/edit`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold transition"
                                title="Chỉnh sửa và biên soạn câu hỏi"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Chỉnh sửa</span>
                              </Link>
                            )}

                            {/* Nút 3 chấm (...) */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleDropdown(e, a)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                dropdownMenu?.id === a.id
                                  ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-400'
                                  : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                              }`}
                              title="Tùy chọn khác"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Chưa có đề khảo thí nào trong danh mục này
              </p>
            </div>
          ) : (
            filteredAssessments.map((a) => {
              const isCustom = Boolean(a.organization_id);
              const qCount = a.assessment_items?.length || 0;

              return (
                <div
                  key={a.id}
                  className="p-5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group relative overflow-visible"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {a.is_published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Sẵn sàng</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Bản nháp</span>
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {new Date(a.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {a.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {a.description || 'Đề đánh giá năng lực số toàn diện.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="tabular-nums">{a.duration_minutes || 45} phút</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span className="tabular-nums">Đạt: {a.passing_score || 70}/100</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative">
                      {/* Nút hành động chính */}
                      {a.is_published ? (
                        <Link
                          href={`/org/${slug}/campaigns/new?assessmentId=${a.id}`}
                          className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition shadow-2xs"
                        >
                          <span>Giao bài</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href={`/org/${slug}/assessments/${a.id}/edit`}
                          className="flex-1 h-8 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Chỉnh sửa</span>
                        </Link>
                      )}

                      {/* Nút 3 chấm */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleDropdown(e, a)}
                        className={`h-8 px-2 rounded-lg border transition flex items-center justify-center cursor-pointer ${
                          dropdownMenu?.id === a.id
                            ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-400'
                            : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                        title="Tùy chọn khác"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Fixed Dropdown (đảm bảo không bao giờ bị overflow-x/y của table hay card che khuất) */}
      {dropdownMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            ...(dropdownMenu.placement === 'bottom'
              ? { top: `${dropdownMenu.top}px` }
              : { bottom: `${window.innerHeight - dropdownMenu.top}px` }),
            right: `${dropdownMenu.right}px`,
          }}
          className="w-44 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xl py-1 z-[9999] text-xs text-left animate-in fade-in zoom-in-95 duration-100"
        >
          {/* 1. Phát hành đề thi (nếu đang là bản nháp) hoặc Thi Live (nếu đã sẵn sàng) */}
          {!dropdownMenu.assessment.is_published ? (
            <button
              type="button"
              onClick={() => handleTogglePublish(dropdownMenu.assessment, true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold transition text-left cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Phát hành đề thi</span>
            </button>
          ) : (
            <Link
              href={`/org/${slug}/live-room/new?assessmentId=${dropdownMenu.assessment.id}`}
              onClick={() => setDropdownMenu(null)}
              className="flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition"
            >
              <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Thi Live</span>
            </Link>
          )}

          {/* 2. Sao chép */}
          <button
            type="button"
            onClick={() => {
              const item = dropdownMenu.assessment;
              setDropdownMenu(null);
              handleClone(item);
            }}
            disabled={cloningId === dropdownMenu.assessment.id}
            className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition text-left cursor-pointer"
          >
            {cloningId === dropdownMenu.assessment.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Sao chép</span>
          </button>

          {/* 3. Điều chỉnh */}
          <Link
            href={`/org/${slug}/assessments/${dropdownMenu.assessment.id}/edit`}
            onClick={() => setDropdownMenu(null)}
            className="flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900 transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Điều chỉnh</span>
          </Link>

          {dropdownMenu.assessment.is_published && (
            <button
              type="button"
              onClick={() => handleTogglePublish(dropdownMenu.assessment, false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition text-left cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Chuyển về bản nháp</span>
            </button>
          )}

          {/* 4. Xóa đề thi */}
          <div className="my-1" />
          <button
            type="button"
            onClick={() => {
              const item = dropdownMenu.assessment;
              setDropdownMenu(null);
              setDeletingAssessment(item);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa đề thi</span>
          </button>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      {deletingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Xóa đề khảo thí
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn xóa đề khảo thí{' '}
                  <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                    &ldquo;{deletingAssessment.title}&rdquo;
                  </span>
                  ?
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-2">
                  Lưu ý: Nếu đề thi đã có học viên làm bài, hệ thống sẽ tự động chuyển sang lưu trữ ẩn để bảo vệ lịch sử đánh giá của học viên.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setDeletingAssessment(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
