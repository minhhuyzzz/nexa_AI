'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Calendar,
  Mail,
  User,
} from 'lucide-react';
import type { ClassMemberItem } from './types';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(query);
        const matchesEmail = m.email.toLowerCase().includes(query);
        const matchesCode = (m.studentId || '').toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesCode) return false;
      }
      return true;
    });
  }, [members, searchQuery]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '---';
    try {
      return new Date(isoString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '---';
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Danh sách thành viên ({members.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Quản lý danh sách thành viên tham gia học tập và làm bài đánh giá trong lớp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddMembers}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm thành viên</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên thành viên, email hoặc mã..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition shadow-2xs"
          />
        </div>
      </div>

      {/* Member Table Container (Seamless single-box layout) */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-zinc-900/40 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredMembers.length && filteredMembers.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Thành viên</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Ngày tham gia</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-neutral-500">
                    {members.length === 0
                      ? 'Lớp chưa có thành viên nào. Hãy thêm thành viên hoặc chia sẻ mã tham gia.'
                      : 'Không tìm thấy thành viên nào phù hợp với từ khóa.'}
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);

                  return (
                    <tr
                      key={member.id}
                      className={`transition ${
                        isSelected
                          ? 'bg-blue-50/50 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50/60 dark:hover:bg-zinc-850/50'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(member.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(member.fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {member.fullName}
                            </p>
                            {member.studentId && (
                              <p className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                                {member.studentId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-neutral-300 text-xs">
                        {member.email || '---'}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 dark:text-neutral-400 text-xs font-mono">
                        {formatDate(member.joinedAt)}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {onRemoveMember && (
                          <button
                            type="button"
                            onClick={() => onRemoveMember(member.userId)}
                            className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition cursor-pointer"
                            title="Gỡ khỏi lớp"
                          >
                            Gỡ khỏi lớp
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

        {/* Pagination Footer inside Table Card */}
        {filteredMembers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 text-xs bg-slate-50/30 dark:bg-zinc-900/20">
            <span className="text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
              Hiển thị {paginatedMembers.length} trên {filteredMembers.length} thành viên
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 font-mono tabular-nums">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded border border-slate-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-6 h-6 rounded text-xs font-medium transition cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded border border-slate-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
