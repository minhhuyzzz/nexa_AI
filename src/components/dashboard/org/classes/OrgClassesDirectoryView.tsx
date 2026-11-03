'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  List,
  GraduationCap,
  Users,
  Layers,
  ArrowRight,
  FileText,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Building,
} from 'lucide-react';
import type { OrgClassItem, GroupType, ClassStatus } from './types';

interface OrgClassesDirectoryViewProps {
  classes: OrgClassItem[];
  slug: string;
  isManager: boolean;
  onOpenCreateClass: () => void;
}

export function OrgClassesDirectoryView({
  classes,
  slug,
  isManager,
  onOpenCreateClass,
}: OrgClassesDirectoryViewProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClassStatus>('ALL');
  const [groupTypeFilter, setGroupTypeFilter] = useState<'ALL' | GroupType>('ALL');
  const [instructorFilter, setInstructorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Extract unique instructors for filter dropdown
  const uniqueInstructors = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.instructorName && c.instructorName !== 'Chưa phân công') {
        set.add(c.instructorName);
      }
    });
    return Array.from(set);
  }, [classes]);

  // Counts for status tabs
  const activeCount = classes.filter((c) => c.status === 'ACTIVE').length;
  const upcomingCount = classes.filter((c) => c.status === 'UPCOMING').length;
  const archivedCount = classes.filter((c) => c.status === 'ARCHIVED').length;

  // Filtered classes
  const filtered = useMemo(() => {
    return classes.filter((cls) => {
      if (statusFilter !== 'ALL' && cls.status !== statusFilter) return false;
      if (groupTypeFilter !== 'ALL' && cls.groupType !== groupTypeFilter) return false;
      if (instructorFilter !== 'ALL' && cls.instructorName !== instructorFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = cls.name.toLowerCase().includes(query);
        const matchesCode = cls.classCode.toLowerCase().includes(query);
        const matchesInstructor = (cls.instructorName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesInstructor) return false;
      }

      return true;
    });
  }, [classes, statusFilter, groupTypeFilter, instructorFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const getGroupTypeBadge = (type: GroupType) => {
    switch (type) {
      case 'DEPARTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Building className="w-3 h-3" /> Phòng ban
          </span>
        );
      case 'PROJECT_GROUP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Layers className="w-3 h-3" /> Nhóm dự án
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <GraduationCap className="w-3 h-3" /> Lớp học
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-4 shadow-xs">
      {/* Top Status Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 overflow-x-auto">
        <div className="flex items-center gap-4 text-xs font-semibold whitespace-nowrap">
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className={`pb-2 border-b-2 transition ${
              statusFilter === 'ALL'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            Tất cả ({classes.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('ACTIVE');
              setCurrentPage(1);
            }}
            className={`pb-2 border-b-2 transition ${
              statusFilter === 'ACTIVE'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            Đang hoạt động ({activeCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter('UPCOMING');
              setCurrentPage(1);
            }}
            className={`pb-2 border-b-2 transition ${
              statusFilter === 'UPCOMING'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            Sắp khai giảng ({upcomingCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter('ARCHIVED');
              setCurrentPage(1);
            }}
            className={`pb-2 border-b-2 transition ${
              statusFilter === 'ARCHIVED'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            Lưu trữ ({archivedCount})
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition ${
              viewMode === 'card'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-neutral-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Thẻ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition ${
              viewMode === 'table'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-neutral-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Bảng</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <div className="sm:col-span-6 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên lớp, giảng viên..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={groupTypeFilter}
            onChange={(e) => {
              setGroupTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">Loại nhóm: Tất cả</option>
            <option value="CLASS">Lớp học</option>
            <option value="DEPARTMENT">Phòng ban</option>
            <option value="PROJECT_GROUP">Nhóm dự án</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={instructorFilter}
            onChange={(e) => {
              setInstructorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">Giảng viên: Tất cả</option>
            {uniqueInstructors.map((ins) => (
              <option key={ins} value={ins}>
                {ins}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CARD VIEW */}
      {viewMode === 'card' && (
        <div className="space-y-3">
          {paginatedClasses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-neutral-500 bg-slate-50/50 dark:bg-zinc-900/40 rounded-md border border-slate-200 dark:border-zinc-800">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Không tìm thấy lớp học nào phù hợp
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bấm nút Tạo lớp mới.
              </p>
            </div>
          ) : (
            paginatedClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 hover:border-slate-300 dark:hover:border-zinc-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
              >
                {/* Left: Code, Name, Metadata */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 tracking-wider">
                      {cls.classCode}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {cls.name}
                    </h4>
                    {getGroupTypeBadge(cls.groupType)}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-neutral-400 flex-wrap font-mono tabular-nums">
                    <span className="flex items-center gap-1 font-sans">
                      <Users className="w-3 h-3 text-slate-400" />
                      <strong>{cls.membersCount}</strong> thành viên
                    </span>
                    <span>•</span>
                    <span className="font-sans">
                      Phụ trách: <strong>{cls.instructorName || 'Chưa phân công'}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-sans text-slate-500">
                      {cls.term || 'Học kỳ Fall 2026'}
                    </span>
                  </div>
                </div>

                {/* Right: Metrics Pills & Action */}
                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-between md:justify-end">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900 font-mono tabular-nums">
                    <FileText className="w-3 h-3" /> Đã giao {cls.assignmentsCount} đề
                  </span>

                  {cls.participationRate !== null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900 font-mono tabular-nums">
                      <TrendingUp className="w-3 h-3" /> {cls.participationRate}% tham gia
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900 font-mono tabular-nums">
                    <Clock className="w-3 h-3" /> {cls.pendingGradingCount || 0} bài chờ chấm
                  </span>

                  <Link
                    href={`/org/${slug}/classes/${cls.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 border border-blue-200 dark:border-blue-800 rounded transition shrink-0 ml-1"
                  >
                    <span>Vào lớp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Mã lớp</th>
                <th className="py-2.5 px-3">Tên lớp / nhóm</th>
                <th className="py-2.5 px-3">Loại nhóm</th>
                <th className="py-2.5 px-3">Phụ trách</th>
                <th className="py-2.5 px-3">Thành viên</th>
                <th className="py-2.5 px-3">Đề giao</th>
                <th className="py-2.5 px-3">Tham gia</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {paginatedClasses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không có lớp nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedClasses.map((cls) => (
                  <tr
                    key={cls.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {cls.classCode}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {cls.name}
                    </td>
                    <td className="py-2.5 px-3">{getGroupTypeBadge(cls.groupType)}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-neutral-300">
                      {cls.instructorName || 'Chưa phân công'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                      {cls.membersCount}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                      {cls.assignmentsCount}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-emerald-600 font-semibold">
                      {cls.participationRate ? `${cls.participationRate}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/org/${slug}/classes/${cls.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Vào lớp <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Strip */}
      <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100 dark:border-zinc-800">
        <span className="text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
          Hiển thị {paginatedClasses.length} / {filtered.length} lớp & nhóm
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1 font-mono tabular-nums">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded border border-slate-200 dark:border-zinc-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-6 h-6 rounded text-xs font-medium transition ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded border border-slate-200 dark:border-zinc-700 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
