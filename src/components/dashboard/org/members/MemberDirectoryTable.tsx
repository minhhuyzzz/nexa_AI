'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Upload, MoreHorizontal, User, Shield, ChevronLeft, ChevronRight, Trash2, Crown } from 'lucide-react';
import type { OrgMemberItem, OrgRoleType } from './types';

interface MemberDirectoryTableProps {
  members: OrgMemberItem[];
  onSelectMember: (member: OrgMemberItem) => void;
  isManager: boolean;
  isOwner?: boolean;
  currentUserRole?: string;
  onRequestDelete?: (member: OrgMemberItem) => void;
  onOpenBulkImport?: () => void;
}

const ROLE_BADGES: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  ORG_OWNER: {
    label: 'Quản trị viên',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-600',
  },
  ORG_ADMIN: {
    label: 'Quản trị viên',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-600',
  },
  ASSESSOR: {
    label: 'Khảo thí viên',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-600',
  },
  EVALUATOR: {
    label: 'Khảo thí viên',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-600',
  },
  REPORT_VIEWER: {
    label: 'Khảo thí viên',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-600',
  },
  MEMBER: {
    label: 'Thành viên',
    badgeClass: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-700',
    dotClass: 'bg-slate-500',
  },
};

export function MemberDirectoryTable({
  members,
  onSelectMember,
  isManager,
  isOwner = false,
  currentUserRole,
  onRequestDelete,
  onOpenBulkImport,
}: MemberDirectoryTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 3-dots Dropdown State
  const [dropdownMenu, setDropdownMenu] = useState<{
    id: string;
    top: number;
    right: number;
    placement: 'top' | 'bottom';
    member: OrgMemberItem;
  } | null>(null);

  // Đóng dropdown khi click ngoài hoặc cuộn trang
  useEffect(() => {
    const handleClose = () => setDropdownMenu(null);
    if (dropdownMenu) {
      window.addEventListener('click', handleClose);
      window.addEventListener('scroll', handleClose, true);
      return () => {
        window.removeEventListener('click', handleClose);
        window.removeEventListener('scroll', handleClose, true);
      };
    }
  }, [dropdownMenu]);

  const handleOpenDropdown = (e: React.MouseEvent, member: OrgMemberItem) => {
    e.stopPropagation();
    if (dropdownMenu?.id === member.membershipId) {
      setDropdownMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && rect.top > menuHeight ? 'top' : 'bottom';

    setDropdownMenu({
      id: member.membershipId,
      top: placement === 'bottom' ? rect.bottom + 4 : rect.top - 4,
      right: window.innerWidth - rect.right,
      placement,
      member,
    });
  };

  // Filter members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.nickname.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        roleFilter === 'ALL'
          ? true
          : roleFilter === 'ADMIN'
          ? m.role === 'ORG_ADMIN' || m.role === 'ORG_OWNER'
          : roleFilter === 'ASSESSOR'
          ? m.role === 'ASSESSOR' || m.role === 'EVALUATOR'
          : m.role === 'MEMBER';
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [members, search, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedMembers.map((m) => m.membershipId));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCsv = () => {
    const headers = ['Họ tên', 'Email', 'Vai trò', 'Lớp/Nhóm', 'Trạng thái', 'Ngày tham gia'];
    const rows = filtered.map((m) => [
      m.nickname,
      m.email,
      ROLE_BADGES[m.role]?.label || m.role,
      m.className || 'Chưa phân lớp',
      m.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng',
      new Date(m.createdAt).toLocaleDateString('vi-VN'),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_thanh_vien_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3.5">
      {/* Toolbar: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, email..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] text-neutral-800 dark:text-zinc-200 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="ASSESSOR">Khảo thí viên</option>
            <option value="MEMBER">Thành viên</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#111114] text-neutral-800 dark:text-zinc-200 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="SUSPENDED">Tạm ngưng</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {isManager && onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
              <span>Nhập danh sách (.CSV)</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Xuất danh sách</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
            {filtered.length} bản ghi
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-zinc-900/60 text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedMembers.length > 0 &&
                      selectedIds.length === paginatedMembers.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2.5 px-4">Thành viên</th>
                <th className="py-2.5 px-4">Nhóm / Lớp</th>
                <th className="py-2.5 px-4">Vai trò</th>
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4">Tham gia</th>
                <th className="py-2.5 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-neutral-500 text-xs">
                    Không tìm thấy thành viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => {
                  const roleConfig = ROLE_BADGES[m.role] || {
                    label: m.role,
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    dotClass: 'bg-slate-400',
                  };
                  const isSelected = selectedIds.includes(m.membershipId);

                  return (
                    <tr
                      key={m.membershipId}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => onSelectMember(m)}
                    >
                      <td
                        className="py-3 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(m.membershipId);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-[11px] shrink-0 font-mono">
                            {m.nickname.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                              <span>{m.nickname}</span>
                              {m.isCurrentUser && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                                  (Bạn)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                              {m.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-neutral-300">
                        {m.className || 'Chưa phân lớp'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${roleConfig.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dotClass}`} />
                            <span>{roleConfig.label}</span>
                          </span>
                          {m.role === 'ORG_OWNER' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800 tracking-tight">
                              <Crown className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                              <span>Chủ sở hữu</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-800 dark:text-zinc-200">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{m.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] tabular-nums text-slate-500 dark:text-neutral-400">
                        {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleOpenDropdown(e, m)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                          title="Tùy chọn thao tác"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-[#111114] text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>bản ghi mỗi trang</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-dots Dropdown Menu (Fixed position to avoid table overflow clipping) */}
      {dropdownMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: dropdownMenu.placement === 'bottom' ? dropdownMenu.top : undefined,
            bottom: dropdownMenu.placement === 'top' ? window.innerHeight - dropdownMenu.top : undefined,
            right: dropdownMenu.right,
            zIndex: 9999,
          }}
          className="w-52 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Xem hồ sơ & phân quyền */}
          <button
            type="button"
            onClick={() => {
              const mem = dropdownMenu.member;
              setDropdownMenu(null);
              onSelectMember(mem);
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-neutral-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 transition text-left cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Xem hồ sơ &amp; phân quyền</span>
          </button>

          {/* Xóa khỏi tổ chức */}
          {(() => {
            const mem = dropdownMenu.member;
            const isTargetOwner = mem.role === 'ORG_OWNER';
            const isTargetSelf = mem.isCurrentUser;
            const isTargetAdmin = mem.role === 'ORG_ADMIN';
            const cannotDelete = isTargetOwner || isTargetSelf || (!isOwner && isTargetAdmin);

            let reason = '';
            if (isTargetOwner) reason = 'Chủ sở hữu tổ chức không thể bị xóa';
            else if (isTargetSelf) reason = 'Bạn không thể tự xóa chính mình';
            else if (!isOwner && isTargetAdmin) reason = 'Quản trị viên không thể xóa Quản trị viên khác';

            return (
              <>
                <div className="my-1" />
                <button
                  type="button"
                  disabled={cannotDelete}
                  title={reason || 'Xóa thành viên khỏi tổ chức'}
                  onClick={() => {
                    if (cannotDelete) return;
                    setDropdownMenu(null);
                    onRequestDelete?.(mem);
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2 text-left transition ${
                    cannotDelete
                      ? 'text-slate-400 dark:text-neutral-600 cursor-not-allowed opacity-60'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cannotDelete && reason ? reason : 'Xóa khỏi tổ chức'}</span>
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
