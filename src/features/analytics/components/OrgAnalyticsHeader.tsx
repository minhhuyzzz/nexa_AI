'use client';

import React from 'react';
import { Download, Users } from 'lucide-react';
import { RawClassInfo } from '../types/org-analytics.types';
import { NexaDateRangePicker, DateRangeSelection } from './NexaDateRangePicker';

interface OrgAnalyticsHeaderProps {
  orgName: string;
  classes: RawClassInfo[];
  selectedTimeRange: string;
  selectedStartDate?: string;
  selectedEndDate?: string;
  selectedClassId: string;
  onApplyDateRange: (range: DateRangeSelection) => void;
  onClassChange: (val: string) => void;
  onExportClick: () => void;
  hasEvaluatedData: boolean;
}

export function OrgAnalyticsHeader({
  classes,
  selectedTimeRange,
  selectedStartDate,
  selectedEndDate,
  selectedClassId,
  onApplyDateRange,
  onClassChange,
  onExportClick,
  hasEvaluatedData,
}: OrgAnalyticsHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 font-medium">
        <span>Đánh giá năng lực</span>
        <span>&rsaquo;</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-semibold">Báo cáo năng lực số</span>
      </div>

      {/* Title & Global Filter Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Báo cáo năng lực số
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Dashboard đo lường năng lực số 5 miền của tổ chức, dựa trên các kết quả đánh giá đủ điều kiện.
          </p>
        </div>

        {/* Global Toolbar Filter Controls + Export Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ chọn thời gian 2 cột chuyên nghiệp (Hôm qua / 7 ngày / 30 ngày / Tuần / Tháng / Ngày) */}
          <NexaDateRangePicker
            selectedTimeRange={selectedTimeRange}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            onApplyRange={onApplyDateRange}
          />

          {/* Dropdown 2: Đơn vị / Lớp */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs text-xs">
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
            <select
              aria-label="Đơn vị hoặc lớp học"
              value={selectedClassId}
              onChange={(e) => onClassChange(e.target.value)}
              className="bg-transparent text-neutral-800 dark:text-zinc-200 font-medium focus:outline-none cursor-pointer max-w-[140px] truncate pr-1"
            >
              <option value="all">Toàn tổ chức</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút Xuất báo cáo */}
          <button
            type="button"
            disabled={!hasEvaluatedData}
            onClick={onExportClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
