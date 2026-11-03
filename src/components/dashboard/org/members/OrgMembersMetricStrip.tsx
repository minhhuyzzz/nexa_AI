import React from 'react';
import { Users, Clock, Mail, Check, Layers } from 'lucide-react';
import type { OrgEntitlementSummary } from '@/features/billing/services/quota-enforcement.service';

interface OrgMembersMetricStripProps {
  activeCount: number;
  pendingRequestsCount: number;
  pendingInvitationsCount: number;
  entitlements?: OrgEntitlementSummary;
}

export function OrgMembersMetricStrip({
  activeCount,
  pendingRequestsCount,
  pendingInvitationsCount,
  entitlements,
}: OrgMembersMetricStripProps) {
  const isEntitlementActive = Boolean(entitlements?.isActive);
  const maxSeats = entitlements?.maxSeats || 0;
  const remainingSeats = isEntitlementActive ? Math.max(0, maxSeats - activeCount) : 0;

  return (
    <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-zinc-800">
        {/* 1. Thành viên hoạt động */}
        <div className="flex items-center gap-3.5 pr-2">
          <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {activeCount}
              </span>
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">
                thành viên hoạt động
              </span>
              <span className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[10px]">
                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
            </div>
          </div>
        </div>

        {/* 2. Chờ phê duyệt */}
        <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:pl-4 pr-2">
          <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {pendingRequestsCount}
              </span>
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">
                chờ phê duyệt
              </span>
            </div>
          </div>
        </div>

        {/* 3. Lời mời đang chờ */}
        <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:pl-4 pr-2">
          <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Mail className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                {pendingInvitationsCount}
              </span>
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">
                lời mời đang chờ
              </span>
            </div>
          </div>
        </div>

        {/* 4. Hạn mức ghế */}
        <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:pl-4">
          <div className="w-9 h-9 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-neutral-400 shrink-0">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <div>
            {isEntitlementActive ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {maxSeats}
                </span>
                <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">
                  ghế &bull; <strong className="text-blue-600 dark:text-blue-400 font-mono">còn {remainingSeats}</strong>
                </span>
              </div>
            ) : entitlements?.status === 'PROVISIONING' ? (
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Đang chuẩn bị ({maxSeats || 50} ghế)
              </div>
            ) : (
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Hạn mức: chưa được cấp
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
