'use client';

import Link from 'next/link';
import { Calendar, FileText, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

export interface OrgTaskItem {
  id: string;
  title: string;
  assessmentId: string;
  orgName: string;
  className: string;
  deadline?: string | null;
  durationMinutes: number;
  status: string;
  actionUrl: string;
}

interface OrgAssignmentsWidgetProps {
  organizationName: string;
  tasks: OrgTaskItem[];
}

export function OrgAssignmentsWidget({
  organizationName,
  tasks,
}: OrgAssignmentsWidgetProps) {
  return (
    <div className="space-y-4">
      {/* Main Section Card */}
      <section className="p-6 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Từ tổ chức của bạn
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {organizationName} &bull; Các bài tập và đợt đánh giá liên quan đến bạn
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shrink-0 self-start sm:self-auto">
            {tasks.length} nhiệm vụ
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-neutral-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-neutral-800 dark:text-neutral-200">
              Hiện tại bạn chưa có bài đánh giá cần hoàn thành từ {organizationName}.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
              Các bài thi mới khi được giảng viên giao sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {tasks.map((task, idx) => {
              const deadlineFormatted = task.deadline
                ? new Date(task.deadline).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : 'Không có hạn nộp';

              return (
                <div
                  key={task.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0">
                      {idx % 2 === 0 ? (
                        <Calendar className="w-4 h-4" strokeWidth={1.75} />
                      ) : (
                        <FileText className="w-4 h-4" strokeWidth={1.75} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {task.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {task.className} &bull; Hạn nộp <span className="font-mono tabular-nums font-medium text-neutral-700 dark:text-neutral-300">{deadlineFormatted}</span>
                      </p>
                    </div>
                  </div>

                  <Link
                    href={task.actionUrl}
                    className="h-8 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto shadow-xs"
                  >
                    <span>Bắt đầu làm bài</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Subtle Policy Card */}
      <div className="p-4 rounded-md border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-[#111114]/60 text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
        <strong className="text-neutral-900 dark:text-neutral-200 block mb-0.5">
          Không gian cá nhân của bạn được giữ nguyên:
        </strong>
        Đề được giao từ tổ chức xuất hiện cùng hoạt động học tập cá nhân. Bạn không cần mở dashboard quản trị tổ chức và không cần mua gói PRO để làm bài.
      </div>
    </div>
  );
}
