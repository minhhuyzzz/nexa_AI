'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarRange,
  Plus,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  Users,
  Search,
  Filter,
  FileCheck,
} from 'lucide-react';
import { OrgEmptyState } from '@/components/dashboard/org/org-ui/OrgEmptyState';

export interface CampaignItem {
  id: string;
  title: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  status: string;
  passing_score: number;
  class_ids?: string[];
  assessor_ids?: string[];
  assessments?: {
    id: string;
    title: string;
    duration_minutes: number;
    passing_score: number;
    version?: string;
  } | null;
}

interface OrgCampaignsClientViewProps {
  organizationId: string;
  organizationName: string;
  slug: string;
  campaigns: CampaignItem[];
  isManager: boolean;
}

export function OrgCampaignsClientView({
  organizationId,
  organizationName,
  slug,
  campaigns,
  isManager,
}: OrgCampaignsClientViewProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');

  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const scheduledCount = campaigns.filter((c) => c.status === 'SCHEDULED').length;
  const completedCount = campaigns.filter((c) => c.status === 'COMPLETED').length;

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (activeTab !== 'ALL' && c.status !== activeTab) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchAsm = c.assessments?.title.toLowerCase().includes(q);
        if (!matchTitle && !matchAsm) return false;
      }
      return true;
    });
  }, [campaigns, activeTab, search]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Đợt khảo thí
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold font-mono rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-zinc-700 tabular-nums">
              {campaigns.length}
            </span>
          </div>
        </div>

        {isManager && (
          <Link
            href={`/org/${slug}/campaigns/new`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Tạo đợt đánh giá mới</span>
          </Link>
        )}
      </div>

      {/* 2. Filter & Tabs Bar (Pill Tabs, không gạch chân) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Tất cả ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Đang diễn ra ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SCHEDULED')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'SCHEDULED'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Sắp diễn ra ({scheduledCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Đã hoàn thành ({completedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên đợt, tên đề..."
            className="w-full h-8 pl-8 pr-3 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* 3. Campaign Grid or Empty State */}
      {filtered.length === 0 ? (
        <OrgEmptyState
          icon={<CalendarRange className="w-5 h-5" strokeWidth={1.75} />}
          title="Không tìm thấy đợt đánh giá phù hợp"
          description={
            campaigns.length === 0
              ? 'Tổ chức chưa có đợt khảo thí nào. Hãy khởi tạo đợt đánh giá để giao đề thi cho các nhóm.'
              : 'Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang bộ lọc trạng thái khác.'
          }
          actionText={isManager && campaigns.length === 0 ? "Tạo đợt đánh giá mới" : undefined}
          actionHref={isManager && campaigns.length === 0 ? `/org/${slug}/campaigns/new` : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const isCompleted = c.status === 'COMPLETED';
            const isActive = c.status === 'ACTIVE';
            const targetClassesCount = Array.isArray(c.class_ids) ? c.class_ids.length : 0;

            return (
              <div
                key={c.id}
                className="p-5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : isCompleted
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-zinc-700'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-600' : isCompleted ? 'bg-slate-400' : 'bg-blue-600'
                        }`}
                      />
                      {isActive ? 'Đang diễn ra' : isCompleted ? 'Đã hoàn thành' : 'Sắp diễn ra'}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 tabular-nums">
                      {c.ends_at ? new Date(c.ends_at).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    Đề: {c.assessments?.title || 'Đề khảo thí chuẩn hóa'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-mono mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span>{targetClassesCount > 0 ? `${targetClassesCount} nhóm/lớp` : 'Toàn đơn vị'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span className="tabular-nums">Đạt: {c.passing_score || 70}/100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/org/${slug}/grading?campaignId=${c.id}`}
                      className="flex-1 h-8 px-2.5 rounded bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-blue-200/60 dark:border-blue-900"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Bàn chấm bài</span>
                    </Link>
                    <Link
                      href={`/org/${slug}/analytics?campaignId=${c.id}`}
                      className="h-8 px-3 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center transition-colors"
                    >
                      <span>Báo cáo</span>
                    </Link>
                    {isManager && c.assessments?.id && (
                      <Link
                        href={`/org/${slug}/campaigns/new?assessmentId=${c.assessments.id}`}
                        className="h-8 px-2.5 rounded border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 hover:text-blue-600 text-xs font-semibold flex items-center justify-center transition-colors"
                        title="Tạo đợt mới từ đề thi này"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
