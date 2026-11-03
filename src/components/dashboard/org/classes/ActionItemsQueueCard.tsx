'use client';

import React from 'react';
import { CheckSquare, AlertTriangle, FileText, Users, ChevronRight } from 'lucide-react';

interface ActionItemsQueueCardProps {
  unassignedInstructorCount: number;
  classesWithoutAssignmentsCount: number;
  pendingEnrollmentRequestsCount: number;
  onFilterUnassigned: () => void;
  onFilterWithoutAssignments: () => void;
  onNavigateRequests: () => void;
}

export function ActionItemsQueueCard({
  unassignedInstructorCount,
  classesWithoutAssignmentsCount,
  pendingEnrollmentRequestsCount,
  onFilterUnassigned,
  onFilterWithoutAssignments,
  onNavigateRequests,
}: ActionItemsQueueCardProps) {
  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Việc cần làm
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Những công việc cần bạn xử lý để đảm bảo hoạt động lớp học.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onFilterUnassigned}
          className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              <strong className="font-mono tabular-nums">{unassignedInstructorCount}</strong> lớp chưa có giảng viên
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
        </button>

        <button
          type="button"
          onClick={onFilterWithoutAssignments}
          className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              <strong className="font-mono tabular-nums">{classesWithoutAssignmentsCount}</strong> lớp chưa giao đề
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
        </button>

        <button
          type="button"
          onClick={onNavigateRequests}
          className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              <strong className="font-mono tabular-nums">{pendingEnrollmentRequestsCount}</strong> yêu cầu thêm thành viên đang chờ
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
        </button>
      </div>
    </div>
  );
}
