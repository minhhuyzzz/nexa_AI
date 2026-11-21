'use client';

import React, { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import {
  Search,
  Download,
  Upload,
  MoreHorizontal,
  Shield,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Crown,
  PauseCircle,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import type { OrgMemberItem } from './types';
import { normalizeOrgRole } from '@/lib/auth/org-roles';

interface MemberDirectoryTableProps {
  members: OrgMemberItem[];
  isManager: boolean;
  isOwner?: boolean;
  currentUserRole?: string;
  onOpenRoleModal: (member: OrgMemberItem) => void;
  onToggleStatus?: (member: OrgMemberItem) => void;
  onRequestDelete?: (member: OrgMemberItem) => void;
  onOpenBulkImport?: () => void;
}

const ROLE_BADGES: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  ORG_OWNER: {
    label: 'Chủ sở hữu',
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
  MEMBER: {
    label: 'Thành viên',
    badgeClass: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-700',
    dotClass: 'bg-slate-500',
  },
};

export function MemberDirectoryTable({
  members,
  isManager,
  isOwner = false,
  currentUserRole,
  onOpenRoleModal,
  onToggleStatus,
  onRequestDelete,
  onOpenBulkImport,
}: MemberDirectoryTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

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
    const menuHeight = 135;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && rect.top > menuHeight ? 'top' : 'bottom';

    setDropdownMenu({
      id: member.membershipId,
      top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
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
      const normRole = normalizeOrgRole(m.role);
      const matchRole =
        roleFilter === 'ALL'
          ? true
          : roleFilter === 'ADMIN'
          ? normRole === 'ORG_ADMIN' || normRole === 'ORG_OWNER'
          : roleFilter === 'ASSESSOR'
          ? normRole === 'ASSESSOR'
          : normRole === 'MEMBER';
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

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NEXA AI Platform';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Thanh_Vien', {
        views: [{ showGridLines: true }],
      });

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Họ và tên', key: 'name', width: 26 },
        { header: 'Email', key: 'email', width: 32 },
        { header: 'Nhóm / Lớp', key: 'class', width: 22 },
        { header: 'Vai trò', key: 'role', width: 18 },
        { header: 'Trạng thái', key: 'status', width: 16 },
        { header: 'Ngày tham gia', key: 'joinedAt', width: 16 },
      ];

      // Format Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }, // Cobalt #2563EB
        };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
          bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
          left: { style: 'thin', color: { argb: 'FF3B82F6' } },
          right: { style: 'thin', color: { argb: 'FF3B82F6' } },
        };
      });

      // Add Data Rows
      filtered.forEach((m, idx) => {
        const normRole = normalizeOrgRole(m.role);
        const roleLabel = ROLE_BADGES[normRole]?.label || m.role;
        const row = worksheet.addRow({
          stt: idx + 1,
          name: m.nickname,
          email: m.email,
          class: m.className || 'Chưa phân lớp',
          role: roleLabel,
          status: m.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng',
          joinedAt: new Date(m.createdAt).toLocaleDateString('vi-VN'),
        });

        row.height = 22;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Segoe UI', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };

          // Alignment
          if (colNumber === 1 || colNumber === 5 || colNumber === 6 || colNumber === 7) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `danh_sach_thanh_vien_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3.5 font-sans">
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

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          {isManager && onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
              <span>Nhập Excel / CSV</span>
            </button>
          )}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            )}
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 shrink-0">
            {filtered.length} bản ghi
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
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
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                  const normRole = normalizeOrgRole(m.role);
                  const roleConfig = ROLE_BADGES[normRole] || {
                    label: normRole,
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    dotClass: 'bg-slate-400',
                  };
                  const isSelected = selectedIds.includes(m.membershipId);

                  return (
                    <tr
                      key={m.membershipId}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-900/60 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
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
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                          {normRole === 'ORG_OWNER' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800 tracking-tight font-mono">
                              <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Chủ sở hữu</span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${roleConfig.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dotClass}`} />
                              <span>{roleConfig.label}</span>
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
                          type="button"
                          onClick={(e) => handleOpenDropdown(e, m)}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center ml-auto rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
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
        <div className="p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 min-h-[36px] border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-[#111114] text-xs cursor-pointer"
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
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-dots Dropdown Menu (Chỉ chứa các hành động bấm được, không tiêu đề thừa) */}
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
          className="w-48 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] shadow-xl p-1 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans space-y-0.5"
        >
          {/* Phân quyền vai trò -> Mở modal phân quyền */}
          {isManager && (() => {
            const mem = dropdownMenu.member;
            const isTargetOwner = mem.role === 'ORG_OWNER';
            const isTargetSelf = mem.isCurrentUser;
            const isTargetAdmin = mem.role === 'ORG_ADMIN';
            const cannotEditRole = isTargetOwner || isTargetSelf || (!isOwner && isTargetAdmin);

            let roleEditReason = '';
            if (isTargetOwner) roleEditReason = 'Chủ sở hữu chỉ chuyển giao tại Cài đặt';
            else if (isTargetSelf) roleEditReason = 'Không thể tự đổi vai trò của chính mình';
            else if (!isOwner && isTargetAdmin) roleEditReason = 'Không thể đổi vai trò Quản trị viên khác';

            return (
              <button
                type="button"
                disabled={cannotEditRole}
                title={roleEditReason || 'Phân quyền vai trò'}
                onClick={() => {
                  if (cannotEditRole) return;
                  setDropdownMenu(null);
                  onOpenRoleModal(mem);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition font-medium ${
                  cannotEditRole
                    ? 'text-slate-400 dark:text-neutral-600 cursor-not-allowed opacity-60'
                    : 'text-neutral-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">{cannotEditRole && roleEditReason ? roleEditReason : 'Phân quyền vai trò'}</span>
              </button>
            );
          })()}

          {/* Tạm ngưng hoạt động / Kích hoạt lại */}
          {isManager && (() => {
            const mem = dropdownMenu.member;
            const isTargetOwner = mem.role === 'ORG_OWNER';
            const isTargetSelf = mem.isCurrentUser;
            const isTargetAdmin = mem.role === 'ORG_ADMIN';
            const cannotChangeStatus = isTargetOwner || isTargetSelf || (!isOwner && isTargetAdmin);
            const isSuspended = mem.status === 'SUSPENDED';

            let reason = '';
            if (isTargetOwner) reason = 'Chủ sở hữu không thể bị tạm ngưng';
            else if (isTargetSelf) reason = 'Không thể tự tạm ngưng chính mình';
            else if (!isOwner && isTargetAdmin) reason = 'Không thể đổi trạng thái Quản trị viên khác';

            return (
              <button
                type="button"
                disabled={cannotChangeStatus}
                title={reason || (isSuspended ? 'Kích hoạt lại tài khoản' : 'Tạm ngưng tài khoản')}
                onClick={() => {
                  if (cannotChangeStatus) return;
                  setDropdownMenu(null);
                  onToggleStatus?.(mem);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition font-medium ${
                  cannotChangeStatus
                    ? 'text-slate-400 dark:text-neutral-600 cursor-not-allowed opacity-60'
                    : isSuspended
                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer'
                }`}
              >
                {isSuspended ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Kích hoạt lại</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Tạm ngưng hoạt động</span>
                  </>
                )}
              </button>
            );
          })()}

          {/* Xóa khỏi tổ chức */}
          {isManager && (() => {
            const mem = dropdownMenu.member;
            const isTargetOwner = mem.role === 'ORG_OWNER';
            const isTargetSelf = mem.isCurrentUser;
            const isTargetAdmin = mem.role === 'ORG_ADMIN';
            const cannotDelete = isTargetOwner || isTargetSelf || (!isOwner && isTargetAdmin);

            let reason = '';
            if (isTargetOwner) reason = 'Chủ sở hữu không thể bị xóa';
            else if (isTargetSelf) reason = 'Không thể tự xóa chính mình';
            else if (!isOwner && isTargetAdmin) reason = 'Không thể xóa Quản trị viên khác';

            return (
              <button
                type="button"
                disabled={cannotDelete}
                title={reason || 'Xóa thành viên khỏi tổ chức'}
                onClick={() => {
                  if (cannotDelete) return;
                  setDropdownMenu(null);
                  onRequestDelete?.(mem);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                  cannotDelete
                    ? 'text-slate-400 dark:text-neutral-600 cursor-not-allowed opacity-60'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{cannotDelete && reason ? reason : 'Xóa khỏi tổ chức'}</span>
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}
