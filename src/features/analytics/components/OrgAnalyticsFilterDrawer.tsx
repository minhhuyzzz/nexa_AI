'use client';

import React, { useEffect, useState } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { RawClassInfo, RawCampaignInfo } from '../types/org-analytics.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classes: RawClassInfo[];
  campaigns: RawCampaignInfo[];
  selectedCampaignId?: string;
  selectedClassId?: string;
  onApplyFilters: (campaignId?: string, classId?: string) => void;
}

export function OrgAnalyticsFilterDrawer({
  isOpen,
  onClose,
  classes,
  campaigns,
  selectedCampaignId,
  selectedClassId,
  onApplyFilters,
}: Props) {
  const [tempCampaignId, setTempCampaignId] = useState<string | undefined>(selectedCampaignId);
  const [tempClassId, setTempClassId] = useState<string | undefined>(selectedClassId);

  useEffect(() => {
    setTempCampaignId(selectedCampaignId);
    setTempClassId(selectedClassId);
  }, [selectedCampaignId, selectedClassId, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(tempCampaignId || undefined, tempClassId || undefined);
    onClose();
  };

  const handleReset = () => {
    setTempCampaignId(undefined);
    setTempClassId(undefined);
    onApplyFilters(undefined, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
        className="relative z-10 w-full max-w-sm bg-white dark:bg-[#0A0A0B] border-l border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-200 text-xs"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 id="filter-drawer-title" className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              Bộ Lọc Báo Cáo
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Form Controls */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          {/* Campaign Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-neutral-300 block">
              Đợt khảo thí / Chiến dịch
            </label>
            <select
              value={tempCampaignId || ''}
              onChange={(e) => setTempCampaignId(e.target.value || undefined)}
              className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Tất cả các đợt khảo thí</option>
              {campaigns.map((cmp) => (
                <option key={cmp.id} value={cmp.id}>
                  {cmp.title} ({cmp.status})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500">
              Lọc theo một chiến dịch đánh giá cụ thể của tổ chức.
            </p>
          </div>

          {/* Unit / Class Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-neutral-300 block">
              Đơn vị / Lớp học
            </label>
            <select
              value={tempClassId || ''}
              onChange={(e) => setTempClassId(e.target.value || undefined)}
              className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Toàn bộ các đơn vị / Lớp</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.member_count ?? 0} thành viên)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500">
              Lọc kết quả của các thành viên trực thuộc đơn vị được chọn.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}
