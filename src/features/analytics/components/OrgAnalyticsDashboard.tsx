'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  OrgAnalyticsSummary,
  DomainMetric,
  RawClassInfo,
  RawCampaignInfo,
} from '../types/org-analytics.types';
import { DomainCompetencyTable } from './DomainCompetencyTable';
import { DomainDetailDrawer } from './DomainDetailDrawer';
import { UnitComparisonTable } from './UnitComparisonTable';
import { CampaignAnalyticsView } from './CampaignAnalyticsView';
import { TrendAnalysisView } from './TrendAnalysisView';
import { ExportReportModal } from './ExportReportModal';
import { OrgAnalyticsFilterDrawer } from './OrgAnalyticsFilterDrawer';
import { CohortLearningRecommendations } from '@/components/dashboard/org/CohortLearningRecommendations';
import {
  Filter,
  Download,
  BarChart2,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
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
}

export function OrgAnalyticsDashboard({
  orgName,
  orgSlug,
  summary,
  classes,
  campaigns,
  initialTab = 'overview',
  initialCampaignId,
  initialClassId,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'campaigns' | 'trend'>(
    (initialTab as any) || 'overview'
  );

  // Selected Domain for Drawer
  const [selectedDomain, setSelectedDomain] = useState<DomainMetric | null>(null);

  // Modal / Drawer visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Current filters
  const selectedCampaignId = initialCampaignId || searchParams.get('campaignId') || undefined;
  const selectedClassId = initialClassId || searchParams.get('classId') || undefined;

  const currentCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const currentClass = classes.find((c) => c.id === selectedClassId);

  const hasActiveFilters = Boolean(selectedCampaignId || selectedClassId);

  // Helper to update query params cleanly
  const updateParams = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTabChange = (tab: 'overview' | 'units' | 'campaigns' | 'trend') => {
    setActiveTab(tab);
    updateParams({ tab });
  };

  const handleApplyFilters = (campaignId?: string, classId?: string) => {
    updateParams({ campaignId, classId });
  };

  const handleClearFilters = () => {
    updateParams({ campaignId: undefined, classId: undefined });
  };

  const handleFilterClass = (classId: string) => {
    if (selectedClassId === classId) {
      updateParams({ classId: undefined });
    } else {
      updateParams({ classId, tab: 'overview' });
      setActiveTab('overview');
    }
  };

  const handleFilterCampaign = (campaignId: string) => {
    if (selectedCampaignId === campaignId) {
      updateParams({ campaignId: undefined });
    } else {
      updateParams({ campaignId, tab: 'overview' });
      setActiveTab('overview');
    }
  };

  const hasEvaluatedData = summary.evaluatedSubmissions > 0;

  return (
    <div className="space-y-6">
      {/* Page Header with Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            Báo Cáo & Phân Tích Năng Lực Số
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Chẩn đoán chuẩn xác mức độ phát triển năng lực số 5 miền cốt lõi của đơn vị {orgName}.
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-neutral-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ lọc</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </button>

          <button
            type="button"
            disabled={!hasEvaluatedData}
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-zinc-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Active Filter Pills Bar (if filters applied) */}
      {hasActiveFilters && (
        <div className="p-3 rounded-md bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 dark:text-neutral-400 font-medium">Đang lọc theo:</span>
            {currentCampaign && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold text-[11px]">
                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                {currentCampaign.title}
              </span>
            )}
            {currentClass && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold text-[11px]">
                <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                {currentClass.name}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Key Metrics Row (3 Standard KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Lượt đánh giá hợp lệ */}
        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            Lượt đánh giá hợp lệ
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
            {hasEvaluatedData ? summary.evaluatedSubmissions : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
            {hasEvaluatedData
              ? `Trên tổng số ${summary.totalSubmissions} lượt làm bài`
              : 'Sẵn sàng ghi nhận khi có bài thi'}
          </div>
        </div>

        {/* KPI 2: Điểm năng lực trung bình */}
        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            Điểm năng lực trung bình
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
            {summary.overallAverageScore !== null ? `${summary.overallAverageScore}đ` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
            Thang điểm 100 từ các bài thi đã duyệt
          </div>
        </div>

        {/* KPI 3: Miền cần ưu tiên bồi dưỡng (Phương án B) */}
        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            Miền cần ưu tiên bồi dưỡng
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
            {hasEvaluatedData && summary.priorityGapDomain ? (
              <span className={summary.priorityGapDomain.score < 60 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-neutral-100'}>
                {summary.priorityGapDomain.domainCode} ({summary.priorityGapDomain.score}đ)
              </span>
            ) : hasEvaluatedData ? (
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">Đồng đều</span>
            ) : (
              '—'
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5 truncate">
            {hasEvaluatedData && summary.priorityGapDomain
              ? summary.priorityGapDomain.name
              : hasEvaluatedData
              ? 'Tất cả 5 miền đều đạt mức tốt'
              : 'Khoảng trống năng lực cần tập trung'}
          </div>
        </div>
      </div>

      {/* 4 Tabs Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-zinc-800">
        <nav className="flex space-x-6 text-xs font-semibold" aria-label="Báo cáo tabs">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Tổng quan 5 miền</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('units')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'units'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Theo đơn vị / Lớp</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('campaigns')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'campaigns'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Theo đợt đánh giá</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('trend')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'trend'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Xu hướng biến thiên</span>
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {!hasEvaluatedData && (
            <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-neutral-100">
                    Sẵn sàng ghi nhận dữ liệu khảo thí 5 miền
                  </h3>
                  <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                    Điểm số sẽ tự động tổng hợp khi các thành viên hoàn thành và bài thi được phê duyệt.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/org/${orgSlug}/campaigns/new`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Giao bài đánh giá</span>
                </Link>
              </div>
            </div>
          )}

          {/* Data Table 5 Domains (Luôn hiển thị cấu trúc chuẩn 5 miền DigComp) */}
          <DomainCompetencyTable
            domains={summary.domains}
            onSelectDomain={(domain) => setSelectedDomain(domain)}
          />

          {/* Collective Learning Interventions */}
          <CohortLearningRecommendations gapDomainCodes={summary.gapDomainCodes} />
        </div>
      )}

          {activeTab === 'units' && (
            <UnitComparisonTable
              units={summary.units}
              selectedClassId={selectedClassId}
              onFilterClass={handleFilterClass}
            />
          )}

          {activeTab === 'campaigns' && (
            <CampaignAnalyticsView
              campaigns={summary.campaigns}
              selectedCampaignId={selectedCampaignId}
              onFilterCampaign={handleFilterCampaign}
            />
          )}

          {activeTab === 'trend' && (
            <TrendAnalysisView trend={summary.trend} />
          )}

      {/* Slide-out Domain Detail Drawer */}
      <DomainDetailDrawer
        domain={selectedDomain}
        onClose={() => setSelectedDomain(null)}
      />

      {/* Filter Drawer */}
      <OrgAnalyticsFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        classes={classes}
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        selectedClassId={selectedClassId}
        onApplyFilters={handleApplyFilters}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        orgName={orgName}
        orgSlug={orgSlug}
        evaluatedCount={summary.evaluatedSubmissions}
        selectedCampaignTitle={currentCampaign?.title}
        selectedClassName={currentClass?.name}
        campaignId={selectedCampaignId}
        classId={selectedClassId}
      />
    </div>
  );
}
