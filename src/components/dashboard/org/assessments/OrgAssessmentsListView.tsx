'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'standard' | 'draft'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const customCount = assessments.filter((a) => Boolean(a.organization_id)).length;
  const standardCount = assessments.filter((a) => !a.organization_id).length;
  const draftCount = assessments.filter((a) => !a.is_published).length;

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      const isCustom = Boolean(a.organization_id);

      if (activeTab === 'custom' && !isCustom) return false;
      if (activeTab === 'standard' && isCustom) return false;
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

  return (
    <div className="space-y-5">
      {/* 1. SaaS Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản lý Đề khảo thí
          </h1>
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
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                : 'text-slate-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({assessments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 shadow-2xs'
                : 'text-slate-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Nội bộ tổ chức ({customCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'standard'
                ? 'bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-300 shadow-2xs'
                : 'text-slate-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Chuẩn hóa hệ thống ({standardCount})
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

      {/* 3. Data View (Always renders the structural frame!) */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Tên đề khảo thí</th>
                  <th className="py-3 px-4">Phạm vi</th>
                  <th className="py-3 px-4">Số câu</th>
                  <th className="py-3 px-4">Thời lượng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Cập nhật</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                {filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
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
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isCustom
                                ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {isCustom ? 'Nội bộ' : 'Chuẩn hóa'}
                          </span>
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Bản nháp</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 tabular-nums">
                          {new Date(a.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isCustom && isManager && (
                              <Link
                                href={`/org/${slug}/assessments/${a.id}/edit`}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-blue-600 transition"
                                title="Biên soạn câu hỏi"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                            )}

                            {isManager && (
                              <Link
                                href={`/org/${slug}/campaigns/new?assessmentId=${a.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-xs font-semibold transition"
                                title="Tạo đợt từ đề này"
                              >
                                <span>Tạo đợt</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
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
                  className="p-5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isCustom
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {isCustom ? 'Nội bộ tổ chức' : 'Chuẩn hóa hệ thống'}
                      </span>
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

                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-800 space-y-3">
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

                    <div className="flex items-center gap-2">
                      {isCustom && isManager && (
                        <Link
                          href={`/org/${slug}/assessments/${a.id}/edit`}
                          className="flex-1 h-8 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa đề</span>
                        </Link>
                      )}

                      {isManager && (
                        <Link
                          href={`/org/${slug}/campaigns/new?assessmentId=${a.id}`}
                          className="flex-1 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1 transition border border-blue-200/80 dark:border-blue-900"
                        >
                          <span>Tạo đợt</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
