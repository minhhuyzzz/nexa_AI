'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutGrid,
  List,
  GraduationCap,
  Users,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building,
  MoreHorizontal,
  Copy,
  Check,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { EditClassModal } from './EditClassModal';
import type { OrgClassItem, GroupType, ClassStatus } from './types';

interface OrgClassesDirectoryViewProps {
  classes: OrgClassItem[];
  slug: string;
  organizationId?: string;
  isManager: boolean;
  onOpenCreateClass: () => void;
  onRefresh?: () => void;
}

export function OrgClassesDirectoryView({
  classes,
  slug,
  organizationId,
  isManager,
  onOpenCreateClass,
  onRefresh,
}: OrgClassesDirectoryViewProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClassStatus>('ALL');
  const [groupTypeFilter, setGroupTypeFilter] = useState<'ALL' | GroupType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Modals & Dropdown states
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<OrgClassItem | null>(null);
  const [deletingClass, setDeletingClass] = useState<OrgClassItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-class-menu]')) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openMenuId]);

  // Counts for status tabs (Only ALL and ACTIVE per user requirements)
  const activeCount = classes.filter((c) => c.status === 'ACTIVE').length;

  // Filtered classes
  const filtered = useMemo(() => {
    return classes.filter((cls) => {
      if (statusFilter !== 'ALL' && cls.status !== statusFilter) return false;
      if (groupTypeFilter !== 'ALL' && cls.groupType !== groupTypeFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = cls.name.toLowerCase().includes(query);
        const matchesCode = cls.classCode.toLowerCase().includes(query);
        const matchesTerm = (cls.term || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesTerm) return false;
      }

      return true;
    });
  }, [classes, statusFilter, groupTypeFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleCopyCode = (code: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setOpenMenuId(null);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleDeleteClass = async () => {
    if (!deletingClass || !organizationId) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/classes/${deletingClass.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể xóa lớp học');
      }

      setDeletingClass(null);
      onRefresh?.();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Lỗi khi xóa lớp');
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="space-y-4 font-sans">
      {/* 1. Top Status Tabs & View Toggle (Modern Pill Tabs, không gạch chân border-b) */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Tất cả ({classes.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ACTIVE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Đang hoạt động ({activeCount})
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
              viewMode === 'card'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Thẻ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Bảng</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên lớp, mã nhận diện, đợt..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition shadow-2xs"
          />
        </div>

        {/* Group Type Filter */}
        <div className="flex items-center gap-2">
          <select
            value={groupTypeFilter}
            onChange={(e) => {
              setGroupTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-blue-600 transition cursor-pointer shadow-2xs"
          >
            <option value="ALL">Loại không gian: Tất cả</option>
            <option value="CLASS">Lớp học</option>
            <option value="DEPARTMENT">Phòng ban</option>
            <option value="PROJECT_GROUP">Nhóm dự án</option>
          </select>
        </div>
      </div>

      {/* 3. CARD VIEW: Lưới thẻ thoáng, tinh giản, bo góc rounded-2xl, có 3 chấm */}
      {viewMode === 'card' && (
        <div>
          {paginatedClasses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-neutral-500 bg-white dark:bg-[#111114] rounded-2xl border border-dashed border-slate-200/80 dark:border-zinc-800">
              <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-600" />
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Không tìm thấy lớp học hoặc nhóm nào
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bấm nút Tạo lớp / nhóm mới.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {paginatedClasses.map((cls) => {
                const monogram = (cls.name ? cls.name[0] : 'K').toUpperCase();
                const isMenuOpen = openMenuId === cls.id;

                return (
                  <div
                    key={cls.id}
                    onClick={() => router.push(`/org/${slug}/classes/${cls.id}`)}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 bg-white dark:bg-[#111114] transition-all shadow-xs hover:shadow-md flex flex-col justify-between group relative cursor-pointer"
                  >
                    <div>
                      {/* Top Bar: Monogram + Group Type + 3-Dots Menu */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 select-none">
                          {monogram}
                        </div>

                        <div className="flex items-center gap-1.5" data-class-menu onClick={(e) => e.stopPropagation()}>
                          {getGroupTypeBadge(cls.groupType)}

                          {/* 3-dots action dropdown */}
                          {isManager && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(isMenuOpen ? null : cls.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                title="Tùy chọn lớp học"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyCode(cls.classCode, cls.id, e)}
                                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-200 flex items-center gap-2 transition cursor-pointer"
                                  >
                                    {copiedCodeId === cls.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-600 font-semibold">Đã sao chép</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Sao chép mã lớp</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      setEditingClass(cls);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-200 flex items-center gap-2 transition cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Chỉnh sửa thông tin</span>
                                  </button>

                                  <div className="my-1" />

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      setDeletingClass(cls);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Xóa lớp / nhóm</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Class Name (Prominent & Clean) */}
                      <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                        {cls.name}
                      </h4>

                      {/* Description (Only show when actual description exists) */}
                      {cls.description ? (
                        <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                          {cls.description}
                        </p>
                      ) : null}

                      {/* Metadata Row (Không gạch ngang phân cách) */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="font-mono tabular-nums">{cls.membersCount}</strong> thành viên
                        </span>
                        {cls.term && (
                          <>
                            <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
                            <span className="truncate">{cls.term}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action & Stats */}
                    <div className="pt-4 flex items-center justify-between gap-2 mt-auto">
                      <div>
                        {cls.pendingGradingCount ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900 text-[11px] font-mono tabular-nums">
                            {cls.pendingGradingCount} bài nộp
                          </span>
                        ) : null}
                      </div>

                      <div className="text-slate-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#111114] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-zinc-900/40 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Tên lớp / Không gian</th>
                  <th className="py-3 px-4">Mã tham gia</th>
                  <th className="py-3 px-4">Loại không gian</th>
                  <th className="py-3 px-4">Đợt / Học kỳ</th>
                  <th className="py-3 px-4 text-center">Thành viên</th>
                  <th className="py-3 px-4 text-center">Đề đã giao</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="">
                {paginatedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Không có lớp nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedClasses.map((cls) => (
                    <tr key={cls.id} onClick={() => router.push(`/org/${slug}/classes/${cls.id}`)} className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/60 transition cursor-pointer">
                      <td className="py-3 px-4">
                        <Link
                          href={`/org/${slug}/classes/${cls.id}`}
                          className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 transition"
                        >
                          {cls.name}
                        </Link>
                        {cls.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{cls.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {cls.classCode}
                      </td>
                      <td className="py-3 px-4">{getGroupTypeBadge(cls.groupType)}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-neutral-300">
                        {cls.term || 'Chung'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{cls.membersCount}</td>
                      <td className="py-3 px-4 text-center font-mono">{cls.assignmentsCount}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingClass(cls)}
                            className="p-1 rounded-lg text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                            title="Sửa thông tin"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingClass(cls)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Xóa lớp"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
            Hiển thị {paginatedClasses.length} trên {filtered.length} lớp &amp; nhóm
          </span>

          <div className="flex items-center gap-1 font-mono tabular-nums">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Edit Class Modal */}
      <EditClassModal
        isOpen={Boolean(editingClass)}
        classItem={editingClass}
        organizationId={organizationId || ''}
        onClose={() => setEditingClass(null)}
        onSuccess={() => {
          setEditingClass(null);
          onRefresh?.();
        }}
      />

      {/* 7. Delete Confirmation Modal (Destructive Red Modal) */}
      {deletingClass && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Xác nhận xóa Lớp / Nhóm
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Bạn có chắc chắn muốn xóa lớp{' '}
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    &ldquo;{deletingClass.name}&rdquo;
                  </strong>{' '}
                  (Mã: <span className="font-mono">{deletingClass.classCode}</span>)? Toàn bộ dữ liệu thành viên và bài giao trong lớp sẽ bị gỡ bỏ.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingClass(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteClass}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
