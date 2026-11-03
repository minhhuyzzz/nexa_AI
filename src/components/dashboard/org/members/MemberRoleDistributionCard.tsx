import React from 'react';
import { Users, Mail, ChevronRight, Lightbulb, Check } from 'lucide-react';
import type { OrgMemberItem } from './types';

interface MemberRoleDistributionCardProps {
  members: OrgMemberItem[];
  pendingRequestsCount: number;
  pendingInvitationsCount: number;
  onSelectTab: (tab: 'members' | 'requests' | 'invitations' | 'join-codes') => void;
}

export function MemberRoleDistributionCard({
  members,
  pendingRequestsCount,
  pendingInvitationsCount,
  onSelectTab,
}: MemberRoleDistributionCardProps) {
  const total = members.length || 1;

  // Calculate role counts
  const adminCount = members.filter((m) => ['ORG_OWNER', 'ORG_ADMIN'].includes(m.role)).length;
  const teacherCount = members.filter((m) => ['ASSESSOR', 'EVALUATOR'].includes(m.role)).length;
  const studentCount = members.filter((m) => m.role === 'MEMBER').length;
  const otherCount = members.length - adminCount - teacherCount - studentCount;

  const adminPct = Math.round((adminCount / total) * 100);
  const teacherPct = Math.round((teacherCount / total) * 100);
  const studentPct = Math.round((studentCount / total) * 100);
  const otherPct = Math.max(0, 100 - adminPct - teacherPct - studentPct);

  const totalActions = pendingRequestsCount + pendingInvitationsCount;

  return (
    <div className="space-y-4">
      {/* 1. Hôm nay cần xử lý */}
      <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Hôm nay cần xử lý
          </h3>
          <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold flex items-center justify-center tabular-nums">
            {totalActions}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-850 mt-1">
          <button
            onClick={() => onSelectTab('requests')}
            className="w-full py-2.5 flex items-center justify-between text-left text-xs text-neutral-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
              <span className="font-medium">
                <strong className="font-mono text-neutral-900 dark:text-neutral-100">{pendingRequestsCount}</strong> yêu cầu gia nhập mới
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onSelectTab('invitations')}
            className="w-full py-2.5 flex items-center justify-between text-left text-xs text-neutral-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
              <span className="font-medium">
                <strong className="font-mono text-neutral-900 dark:text-neutral-100">{pendingInvitationsCount}</strong> lời mời đang chờ
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 2. Phân bổ vai trò */}
      <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono mb-3">
          Phân bổ vai trò
        </h3>

        <div className="flex items-center gap-4">
          {/* Circular Graphic */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" className="stroke-slate-100 dark:stroke-zinc-800" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#2563EB"
                strokeWidth="4"
                strokeDasharray={`${studentPct} 100`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeDasharray={`${teacherPct} 100`}
                strokeDashoffset={`-${studentPct}`}
                strokeLinecap="round"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#6366F1"
                strokeWidth="4"
                strokeDasharray={`${adminPct} 100`}
                strokeDashoffset={`-${studentPct + teacherPct}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                {members.length}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-neutral-400 leading-none">
                thành viên
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 flex-1 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-slate-600 dark:text-neutral-400">Quản trị</span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-neutral-800 dark:text-zinc-200">
                {adminCount} ({adminPct}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-neutral-400">Giảng viên</span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-neutral-800 dark:text-zinc-200">
                {teacherCount} ({teacherPct}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-slate-600 dark:text-neutral-400">Học viên</span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-neutral-800 dark:text-zinc-200">
                {studentCount} ({studentPct}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700" />
                <span className="text-slate-600 dark:text-neutral-400">Khác</span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-neutral-800 dark:text-zinc-200">
                {otherCount} ({otherPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mẹo quản trị */}
      <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono mb-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
          <span>Mẹo quản trị</span>
        </div>

        <ul className="space-y-2 text-xs text-slate-600 dark:text-neutral-400">
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
            </span>
            <span>Dùng &ldquo;Mã gia nhập&rdquo; để thêm nhanh học viên vào đúng lớp/nhóm.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
            </span>
            <span>Phân quyền theo vai trò để kiểm soát truy cập và tính năng phù hợp.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
            </span>
            <span>Định kỳ rà soát thành viên không hoạt động để tối ưu hạn mức ghế.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
