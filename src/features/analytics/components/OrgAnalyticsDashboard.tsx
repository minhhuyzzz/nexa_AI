'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  OrgAnalyticsSummary,
  DomainMetric,
  RawClassInfo,
  RawCampaignInfo,
} from '../types/org-analytics.types';
import { DateRangeSelection } from './NexaDateRangePicker';
import { OrgAnalyticsHeader } from './OrgAnalyticsHeader';
import { OrgAnalyticsKpiRow } from './OrgAnalyticsKpiRow';
import { DomainBarChartSection } from './DomainBarChartSection';
import { PeriodTrendSection } from './PeriodTrendSection';
import { AnalyticsInsightPanel } from './AnalyticsInsightPanel';
import { DataSourceRulesBox } from './DataSourceRulesBox';
import { UnitHeatmapTable } from './UnitHeatmapTable';
import { DomainDetailDrawer } from './DomainDetailDrawer';
import { ExportReportModal } from './ExportReportModal';
import { Calendar, Users } from 'lucide-react';
import Link from 'next/link';

interface Props {
  orgName: string;
  orgSlug: string;
  summary: OrgAnalyticsSummary;
  classes: RawClassInfo[];
  campaigns: RawCampaignInfo[];
  initialTab?: string;
  initialCampaignId?: string;
  initialClassId?: string;
  initialTimeRange?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialDataSource?: string;
}

export function OrgAnalyticsDashboard({
  orgName,
  orgSlug,
  summary,
  classes,
  campaigns,
  initialCampaignId,
  initialClassId,
  initialTimeRange = 'all',
  initialStartDate,
  initialEndDate,
  initialDataSource = 'all',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Selected Domain for Drawer
  const [selectedDomain, setSelectedDomain] = useState<DomainMetric | null>(null);

  // Export Modal visibility
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Active Filter state
  const selectedTimeRange = searchParams.get('timeRange') || initialTimeRange || 'all';
  const selectedStartDate = searchParams.get('startDate') || initialStartDate || '';
  const selectedEndDate = searchParams.get('endDate') || initialEndDate || '';
  const selectedClassId = searchParams.get('classId') || initialClassId || 'all';
  const selectedCampaignId = searchParams.get('campaignId') || initialCampaignId || 'all';

  const updateParams = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v && v !== 'all') {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyDateRange = (range: DateRangeSelection) => {
    updateParams({
      timeRange: range.timeRange,
      startDate: range.startDate,
      endDate: range.endDate,
    });
  };

  const handleClassChange = (classId: string) => {
    updateParams({ classId });
  };

  const handleClearFilters = () => {
    updateParams({
      timeRange: undefined,
      startDate: undefined,
      endDate: undefined,
      classId: undefined,
      campaignId: undefined,
    });
  };

  const hasEvaluatedData = summary.evaluatedSubmissions > 0;
  const hasActiveFilters = Boolean(
    (selectedTimeRange && selectedTimeRange !== 'all') ||
      (selectedClassId && selectedClassId !== 'all') ||
      (selectedCampaignId && selectedCampaignId !== 'all')
  );

  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Global Toolbar */}
      <OrgAnalyticsHeader
        orgName={orgName}
        classes={classes}
        selectedTimeRange={selectedTimeRange}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        selectedClassId={selectedClassId}
        onApplyDateRange={handleApplyDateRange}
        onClassChange={handleClassChange}
        onExportClick={() => setIsExportOpen(true)}
        hasEvaluatedData={hasEvaluatedData}
      />

      {/* Active Filter Pills Bar (nếu đang lọc) */}
      {hasActiveFilters && (
        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 dark:text-neutral-400 font-medium">Đang lọc theo:</span>
            {selectedTimeRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold text-[11px]">
                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                Thời gian:{' '}
                {selectedTimeRange === 'custom'
                  ? selectedStartDate || selectedEndDate
                    ? `${selectedStartDate || '...'} ~ ${selectedEndDate || '...'}`
                    : 'Khoảng ngày tùy chọn'
                  : selectedTimeRange === 'yesterday'
                  ? 'Hôm qua'
                  : selectedTimeRange === 'last_7_days'
                  ? '7 ngày gần nhất'
                  : selectedTimeRange === 'last_month'
                  ? '30 ngày gần nhất'
                  : selectedTimeRange === '2026'
                  ? 'Năm 2026'
                  : selectedTimeRange === '2025'
                  ? 'Năm 2025'
                  : selectedTimeRange === 'last_quarter'
                  ? 'Quý gần nhất'
                  : 'Thời gian đã chọn'}
              </span>
            )}
            {currentClass && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold text-[11px]">
                <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                {currentClass.name}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}

      {/* 2. Hàng 5 Thẻ KPI Cốt Lõi */}
      <OrgAnalyticsKpiRow summary={summary} orgSlug={orgSlug} />

      {/* 3. Khối Phân Tích Năng Lực & Trợ Lý Nhận Định NEXA AI (Hàng 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Cột 1: Kết quả 5 miền năng lực số (7 cols - thoáng đãng cho tên miền, điểm số, tỷ lệ bao phủ) */}
        <div className="lg:col-span-7 flex flex-col">
          <DomainBarChartSection
            domains={summary.domains}
            onDomainClick={(d) => setSelectedDomain(d)}
          />
        </div>

        {/* Cột 2: Nhận định & Ưu tiên hành động NEXA AI (5 cols - rộng rãi cho card phân tích và đề xuất) */}
        <div className="lg:col-span-5 flex flex-col">
          <AnalyticsInsightPanel
            bestDomain={summary.bestDomain}
            priorityGapDomain={summary.priorityGapDomain}
            coverageWarningDomain={summary.coverageWarningDomain}
            suggestedActions={summary.suggestedActions}
            orgSlug={orgSlug}
            orgName={orgName}
            summary={summary}
            hasEvaluatedData={hasEvaluatedData}
            timeRangeLabel={
              selectedTimeRange === 'custom'
                ? selectedStartDate && selectedEndDate
                  ? `${selectedStartDate} đến ${selectedEndDate}`
                  : 'Khoảng thời gian tùy chọn'
                : selectedTimeRange === 'yesterday'
                ? 'Hôm qua'
                : selectedTimeRange === 'last_7_days'
                ? '7 ngày gần nhất'
                : selectedTimeRange === 'last_month'
                ? '30 ngày gần nhất'
                : selectedTimeRange === '2026'
                ? 'Năm 2026'
                : selectedTimeRange === '2025'
                ? 'Năm 2025'
                : selectedTimeRange === 'last_quarter'
                ? 'Quý gần nhất'
                : 'Toàn bộ thời gian'
            }
          />
        </div>
      </div>

      {/* 4. Khối Tiến Bộ Theo Thời Gian (Hàng 2 - 12 cols Full Width rộng rãi, thoáng mắt) */}
      <div className="w-full">
        <PeriodTrendSection
          trend={summary.trend}
          hasEnoughTrendData={summary.hasEnoughTrendData}
        />
      </div>

      {/* 4. Box Quy Tắc Nguồn Dữ Liệu */}
      <DataSourceRulesBox />

      {/* 5. Bảng So Sánh Lớp/Đơn Vị Dạng Heatmap D1..D5 */}
      <UnitHeatmapTable
        units={summary.units}
        selectedClassId={selectedClassId}
        onSelectClass={(clsId) => handleClassChange(clsId)}
      />

      {/* Drawer Chi Tiết Từng Miền (Mở khi nhấp vào D1..D5) */}
      <DomainDetailDrawer
        domain={selectedDomain}
        onClose={() => setSelectedDomain(null)}
      />

      {/* Modal Xuất Báo Cáo */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        orgSlug={orgSlug}
        orgName={orgName}
        evaluatedCount={summary.evaluatedSubmissions}
        selectedCampaignTitle={undefined}
        selectedClassName={currentClass?.name}
        classId={selectedClassId !== 'all' ? selectedClassId : undefined}
      />
    </div>
  );
}
