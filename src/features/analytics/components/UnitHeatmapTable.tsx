'use client';

import React, { useState, useMemo } from 'react';
import { UnitCompetencyMetric } from '../types/org-analytics.types';
import { Search, ChevronRight, ChevronLeft, ArrowUpDown } from 'lucide-react';

interface UnitHeatmapTableProps {
  units: UnitCompetencyMetric[];
  onSelectClass?: (classId: string) => void;
  selectedClassId?: string;
}

export function UnitHeatmapTable({
  units,
  onSelectClass,
  selectedClassId,
}: UnitHeatmapTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'averageScore' | 'passRate' | 'testedCount'>('averageScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 1. Filter by search
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (!searchQuery.trim()) return true;
      return u.className.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });
  }, [units, searchQuery]);

  // 2. Sort
  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      const valA = a[sortField] ?? -1;
      const valB = b[sortField] ?? -1;
      if (valA === valB) return 0;
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredUnits, sortField, sortAsc]);

  // 3. Pagination
  const totalItems = sortedUnits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUnits = sortedUnits.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: 'averageScore' | 'passRate' | 'testedCount') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getHeatmapColor = (score: number | null) => {
    if (score === null) return 'text-slate-300 dark:text-zinc-600 bg-transparent';
    if (score >= 80) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold';
    }
    if (score >= 70) {
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold';
    }
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold';
  };

  const getBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'maintain':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40';
      case 'gap_d5':
      case 'gap_multi':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40';
      case 'high_priority':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs space-y-4">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            So sánh kết quả theo lớp/đơn vị
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Điểm trung bình và tỷ lệ đạt chuẩn theo 5 miền năng lực số.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm lớp / đơn vị..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Heatmap Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 dark:bg-zinc-900/75 font-semibold text-slate-600 dark:text-neutral-400">
            <tr>
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-3 min-w-[160px]">Lớp / Đơn vị</th>
              <th
                onClick={() => handleSort('testedCount')}
                className="py-3 px-3 cursor-pointer hover:text-blue-600 transition-colors text-right"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Số người có dữ liệu</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('averageScore')}
                className="py-3 px-3 cursor-pointer hover:text-blue-600 transition-colors text-right"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Điểm TB (/100)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('passRate')}
                className="py-3 px-3 cursor-pointer hover:text-blue-600 transition-colors text-right"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Tỷ lệ đạt (%)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* 5 Cột Heatmap D1 - D5 */}
              {['D1', 'D2', 'D3', 'D4', 'D5'].map((dCode) => (
                <th key={dCode} className="py-3 px-2 text-center w-14 font-mono font-bold">
                  {dCode}
                </th>
              ))}

              <th className="py-3 px-3 min-w-[140px]">Ưu tiên hỗ trợ</th>
              <th className="py-3 px-3 w-10 text-center"></th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-[#111114]">
            {paginatedUnits.length > 0 ? (
              paginatedUnits.map((u, idx) => {
                const isSelected = selectedClassId === u.classId;
                const rowNum = String(startIndex + idx + 1).padStart(2, '0');

                return (
                  <tr
                    key={u.classId}
                    onClick={() => onSelectClass && onSelectClass(u.classId)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {rowNum}
                    </td>

                    <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {u.className}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                      {u.testedCount}
                      <span className="text-[10px] text-slate-400 ml-1">/ {u.totalMembers}</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {u.averageScore !== null ? u.averageScore : '—'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {u.passRate !== null ? `${u.passRate}%` : '—'}
                    </td>

                    {/* Heatmap 5 cells */}
                    {['D1', 'D2', 'D3', 'D4', 'D5'].map((dCode) => {
                      const score = u.domainScores[dCode];
                      const colorClass = getHeatmapColor(score);
                      return (
                        <td key={dCode} className="py-2 px-1 text-center font-mono text-xs">
                          <span
                            className={`inline-block w-11 py-1 rounded text-center tabular-nums transition-colors ${colorClass}`}
                          >
                            {score !== null ? score : '—'}
                          </span>
                        </td>
                      );
                    })}

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadgeStyle(
                          u.supportPriority
                        )}`}
                      >
                        {u.supportPriorityLabel}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-8 text-center text-xs text-slate-400">
                  {searchQuery ? 'Không tìm thấy lớp học nào phù hợp với tìm kiếm.' : 'Chưa có dữ liệu lớp học.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 pt-2">
        <div>
          Hiển thị{' '}
          <span className="font-semibold text-neutral-800 dark:text-zinc-200">
            {totalItems > 0 ? startIndex + 1 : 0} &ndash;{' '}
            {Math.min(startIndex + pageSize, totalItems)}
          </span>{' '}
          trên <span className="font-semibold text-neutral-800 dark:text-zinc-200">{totalItems}</span> lớp
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-xs text-neutral-800 dark:text-zinc-200">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
