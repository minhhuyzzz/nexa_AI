'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Shield,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  Clock,
  Filter,
} from 'lucide-react';
import type { ClassMemberItem, RoleInClass } from './types';

interface ClassMemberRosterTableProps {
  members: ClassMemberItem[];
  onOpenAddMembers: () => void;
  onRemoveMember?: (userId: string) => void;
}

export function ClassMemberRosterTable({
  members,
  onOpenAddMembers,
  onRemoveMember,
}: ClassMemberRosterTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | RoleInClass>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map((m) => m.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== 'ALL' && m.roleInClass !== roleFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(query);
        const matchesEmail = m.email.toLowerCase().includes(query);
        const matchesCode = m.studentId.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesCode) return false;
      }
      return true;
    });
  }, [members, roleFilter, searchQuery]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const getRoleBadge = (role: RoleInClass) => {
    switch (role) {
      case 'CLASS_LEADER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Users className="w-3 h-3" /> Lớp trưởng
          </span>
        );
      case 'VICE_LEADER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Users className="w-3 h-3" /> Lớp phó
          </span>
        );
      case 'ASSISTANT_TEACHER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Shield className="w-3 h-3" /> Trợ giảng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
            <GraduationCap className="w-3 h-3" /> Sinh viên
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-4 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Danh sách thành viên ({members.length})
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Quản lý học viên, cán sự và theo dõi tiến độ tham gia bài học trong lớp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddMembers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, mã sinh viên..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">Vai trò: Tất cả</option>
            <option value="STUDENT">Sinh viên</option>
            <option value="CLASS_LEADER">Lớp trưởng</option>
            <option value="VICE_LEADER">Lớp phó</option>
            <option value="ASSISTANT_TEACHER">Trợ giảng</option>
          </select>
        </div>
      </div>

      {/* Member Table */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === filteredMembers.length && filteredMembers.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="py-2.5 px-3">Thành viên</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3">Vai trò trong lớp</th>
              <th className="py-2.5 px-3">Tiến độ tham gia</th>
              <th className="py-2.5 px-3">Hoạt động gần nhất</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Không tìm thấy thành viên nào phù hợp.
                </td>
              </tr>
            ) : (
              paginatedMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                const progress = member.participationRate || 0;

                return (
                  <tr
                    key={member.id}
                    className={`transition ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/30'
                        : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(member.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {getInitials(member.fullName)}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {member.fullName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                            {member.studentId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-neutral-300 text-[11px]">
                      {member.email}
                    </td>

                    <td className="py-2.5 px-3">{getRoleBadge(member.roleInClass)}</td>

                    <td className="py-2.5 px-3">
                      <div className="w-28 space-y-1">
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                          {progress}%
                        </span>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progress >= 80
                                ? 'bg-emerald-500'
                                : progress >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-500 dark:text-neutral-400 text-[11px] whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {member.lastActiveAt || 'Hôm nay, 14:32'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {onRemoveMember && (
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member.userId)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                          title="Gỡ khỏi lớp"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100 dark:border-zinc-800">
        <span className="text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
          Hiển thị {paginatedMembers.length} trên {filteredMembers.length} thành viên
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
