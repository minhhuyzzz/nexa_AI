'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthoringListHeader } from '@/components/dashboard/authoring/AuthoringListHeader';
import { AuthoringTabs, AuthoringTabKey } from '@/components/dashboard/authoring/AuthoringTabs';
import { AuthoringCard, AuthoringCardItem } from '@/components/dashboard/authoring/AuthoringCard';
import {
  Search,
  Layers,
  ChevronDown,
  Loader2,
  FileCheck,
  Plus,
  AlertCircle,
  CheckCircle2,
  FileText,
  Edit3,
  Send,
  Calendar,
  Archive,
  Clock,
  Play,
  Copy,
  MoreHorizontal,
  LayoutList,
  LayoutGrid,
  Trash2,
  Eye,
  TrendingUp,
} from 'lucide-react';

export default function PersonalAuthoringListPage() {
  const router = useRouter();
  const supabase = createClient();

  const [assessments, setAssessments] = useState<AuthoringCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'table' (default, matches UX design) vs 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters
  const [activeTab, setActiveTab] = useState<AuthoringTabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'questions'>('recent');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Row dropdown menus
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchMyAssessments = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/personal/assessments');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tải danh sách đề');
      }

      if (data.assessments) {
        const mapped: AuthoringCardItem[] = data.assessments.map((a: any) => {
          const items = Array.isArray(a.assessment_items) ? a.assessment_items : [];
          const mcqCount = items.filter((i: any) => i.type === 'MCQ').length;
          const scenarioCount = items.filter((i: any) => i.type === 'SCENARIO').length;
          const practicalCount = items.filter(
            (i: any) =>
              i.type === 'PRACTICAL' ||
              i.type === 'DIGITAL_EVIDENCE' ||
              i.type === 'PRACTICAL_TASK' ||
              i.type === 'PRACTICAL_FILE'
          ).length;

          const domainCodes = [
            ...new Set(
              items
                .map((i: any) => {
                  const comp = Array.isArray(i.competencies) ? i.competencies[0] : i.competencies;
                  const dom = Array.isArray(comp?.competency_domains)
                    ? comp?.competency_domains[0]
                    : comp?.competency_domains;
                  return dom?.code;
                })
                .filter(Boolean)
            ),
          ];

          let domainLabel = 'Tổng hợp (5 miền)';
          if (domainCodes.length === 1) {
            const c = Number(domainCodes[0]);
            if (c === 1) domainLabel = 'Thông tin & Dữ liệu';
            else if (c === 2) domainLabel = 'Giao tiếp & Hợp tác';
            else if (c === 3) domainLabel = 'Sáng tạo Nội dung & AI';
            else if (c === 4) domainLabel = 'An toàn & Bảo mật';
            else if (c === 5) domainLabel = 'Giải quyết Vấn đề';
          } else if (domainCodes.length > 1) {
            domainLabel = `Đa miền (${domainCodes.length} miền)`;
          }

          const status: 'READY' | 'DRAFT' | 'ARCHIVED' = a.is_published ? 'READY' : 'DRAFT';

          return {
            id: a.id,
            code: `ĐE-${new Date(a.created_at).getFullYear()}-${a.id.slice(0, 3).toUpperCase()}`,
            title: a.title,
            description: a.description || '',
            domain: domainLabel,
            durationMinutes: a.duration_minutes || 45,
            passingScore: Number(a.passing_score) || 70,
            questionCount: items.length,
            mcqCount,
            scenarioCount,
            practicalCount,
            status,
            updatedAt: new Date(a.updated_at || a.created_at).toLocaleDateString('vi-VN'),
          };
        });

        setAssessments(mapped);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi tải danh sách đề');
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyAssessments();
  }, [fetchMyAssessments]);

  // Duplicate assessment handler
  const handleDuplicate = async (assessmentId: string) => {
    try {
      const source = assessments.find((a) => a.id === assessmentId);
      if (!source) return;

      const { data, error } = await supabase
        .from('assessments')
        .insert({
          title: `${source.title} (Bản sao)`,
          description: source.description,
          duration_minutes: source.durationMinutes,
          passing_score: source.passingScore,
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('Đã nhân bản đề thành công!');
      fetchMyAssessments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi nhân bản');
    }
  };

  // Delete assessment handler
  const handleDelete = async (assessmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đề đánh giá này? Thao tác không thể hoàn tác.')) {
      return;
    }

    try {
      const res = await fetch(`/api/personal/assessments/${assessmentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể xóa đề');
      }

      showToast(data.message || 'Đã xóa đề đánh giá thành công.');
      setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể xóa đề đánh giá');
    }
  };

  // Metric counts
  const counts = useMemo(() => {
    const ready = assessments.filter((a) => a.status === 'READY').length;
    const draft = assessments.filter((a) => a.status === 'DRAFT').length;
    const archived = assessments.filter((a) => a.status === 'ARCHIVED').length;
    return {
      all: assessments.length,
      draft,
      ready,
      in_progress: 0, // Assessments tied to live sessions
      archived,
    };
  }, [assessments]);

  // Filtered list
  const filteredList = useMemo(() => {
    return assessments.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'ready' && item.status !== 'READY') return false;
      if (activeTab === 'draft' && item.status !== 'DRAFT') return false;
      if (activeTab === 'in_progress') return false; // Future campaign linkage
      if (activeTab === 'archived' && item.status !== 'ARCHIVED') return false;

      // 2. Domain filter
      if (selectedDomain !== 'all') {
        if (!item.domain.toLowerCase().includes(selectedDomain.toLowerCase())) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        if (!matchTitle && !matchCode) return false;
      }

      return true;
    });
  }, [assessments, activeTab, selectedDomain, searchQuery]);

  // Paginated list
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <AuthoringListHeader />

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Filter Tabs (Đã tích hợp số lượng trực tiếp vào từng tab, loại bỏ hàng thẻ KPI trùng lặp) */}
      <AuthoringTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      {/* 4. Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên đề, miền năng lực..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dropdowns & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain Dropdown */}
          <div className="relative">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-neutral-800 dark:text-zinc-200 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Miền năng lực: Tất cả</option>
              <option value="Dữ liệu">Thông tin &amp; Dữ liệu</option>
              <option value="Giao tiếp">Giao tiếp &amp; Hợp tác</option>
              <option value="Sáng tạo">Sáng tạo Nội dung &amp; AI</option>
              <option value="An toàn">An toàn &amp; Bảo mật</option>
              <option value="Giải quyết">Giải quyết Vấn đề</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Time Range Dropdown */}
          <div className="relative">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-neutral-800 dark:text-zinc-200 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Thời gian: Tất cả</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="month">Tháng này</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-neutral-800 dark:text-zinc-200 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="recent">Cập nhật gần đây</option>
              <option value="name">Tên đề (A-Z)</option>
              <option value="questions">Số câu hỏi</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-neutral-900 dark:text-zinc-400'
              }`}
              title="Xem dạng bảng"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-neutral-900 dark:text-zinc-400'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Table View (Screen 01) or Grid View */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
            Đang tải danh sách đề khảo thí...
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
            <FileCheck className="w-8 h-8" strokeWidth={1.5} />
          </div>

          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1.5">
            {searchQuery || selectedDomain !== 'all' || activeTab !== 'all'
              ? 'Không tìm thấy đề đánh giá phù hợp'
              : 'Chưa có đề đánh giá nào'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
            {searchQuery || selectedDomain !== 'all' || activeTab !== 'all'
              ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ lọc để xem toàn bộ danh sách.'
              : 'Hãy bắt đầu bằng cách soạn đề đánh giá đầu tiên theo chuẩn 5 miền năng lực số DigComp.'}
          </p>

          <Link
            href="/personal/authoring/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Soạn đề mới ngay</span>
          </Link>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Exact Design from Screen 01 Image) */
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-850 bg-slate-50/70 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 text-[11px] font-bold">
                  <th className="py-3 px-4 min-w-[240px]">Tên đề</th>
                  <th className="py-3 px-3 min-w-[150px]">Miền năng lực</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">Số câu</th>
                  <th className="py-3 px-3 min-w-[100px]">Thời lượng</th>
                  <th className="py-3 px-3 min-w-[120px]">Trạng thái</th>
                  <th className="py-3 px-4 min-w-[150px]">Cập nhật gần đây</th>
                  <th className="py-3 px-4 min-w-[170px]">Phiên/Đợt thi</th>
                  <th className="py-3 px-4 text-right min-w-[110px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                {paginatedList.map((item) => {
                  // Domain badge style
                  let domainBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300';
                  if (item.domain.includes('Sáng tạo')) {
                    domainBadgeColor = 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300';
                  } else if (item.domain.includes('An toàn')) {
                    domainBadgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300';
                  } else if (item.domain.includes('Giao tiếp')) {
                    domainBadgeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200/60 dark:bg-cyan-950/40 dark:text-cyan-300';
                  } else if (item.domain.includes('Giải quyết')) {
                    domainBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300';
                  } else if (item.domain.includes('Tổng hợp') || item.domain.includes('Đa miền')) {
                    domainBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300';
                  }

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-850/50 transition-colors"
                    >
                      {/* Tên đề */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/personal/authoring/${item.id}`}
                              className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1 cursor-pointer"
                            >
                              {item.title}
                            </Link>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {item.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Miền năng lực */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${domainBadgeColor}`}
                        >
                          {item.domain}
                        </span>
                      </td>

                      {/* Số câu */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-neutral-800 dark:text-zinc-200">
                        {item.questionCount}
                      </td>

                      {/* Thời lượng */}
                      <td className="py-3.5 px-3 text-slate-600 dark:text-zinc-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.durationMinutes} phút</span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-3">
                        {item.status === 'READY' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã phát hành</span>
                          </span>
                        ) : item.status === 'DRAFT' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Bản nháp</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200">
                            <Archive className="w-3 h-3" />
                            <span>Lưu trữ</span>
                          </span>
                        )}
                      </td>

                      {/* Cập nhật gần đây */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {item.updatedAt}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          bởi Bạn
                        </div>
                      </td>

                      {/* Phiên/Đợt thi */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium">Chưa gắn đợt thi</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-5">-</div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 relative">
                          {/* Play / Deploy button */}
                          <Link
                            href={`/personal/authoring/${item.id}/deploy`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 text-slate-500 transition-colors"
                            title="Tổ chức đợt thi / Phòng thi"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Link>

                          {/* Edit questions button */}
                          <Link
                            href={`/personal/authoring/${item.id}/edit`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
                            title="Soạn câu hỏi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(item.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-zinc-800 text-slate-500 transition-colors cursor-pointer"
                            title="Nhân bản đề"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* More dropdown */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === item.id ? null : item.id)
                            }
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-zinc-800 text-slate-500 transition-colors cursor-pointer"
                            title="Thao tác khác"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === item.id && (
                            <div className="absolute right-0 top-9 w-40 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1 z-30 text-left">
                              <Link
                                href={`/personal/authoring/${item.id}`}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Xem chi tiết</span>
                              </Link>
                              <Link
                                href={`/personal/authoring/${item.id}/preview`}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                                <span>Kiểm định &amp; xem</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleDelete(item.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa đề</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer (Screen 01 Design) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-zinc-850 bg-slate-50/40 dark:bg-zinc-900/30 text-xs">
            <span className="text-slate-500 font-medium">
              Hiển thị {paginatedList.length} trên tổng số {filteredList.length} đề
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-[11px]">10 / trang</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-30 cursor-pointer text-xs"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      currentPage === idx + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-30 cursor-pointer text-xs"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedList.map((item) => (
            <AuthoringCard
              key={item.id}
              item={item}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
