'use client';

import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface AssignmentItem {
  id: string;
  assessment_id: string;
  deadline?: string | null;
  created_at: string;
  assessments?: {
    id: string;
    title: string;
    duration_minutes: number;
    passing_score: number;
  };
}

interface SubmissionItem {
  id: string;
  user_id: string;
  assessment_id: string;
  class_assignment_id?: string | null;
  status: string;
  total_score?: number | null;
  percentage?: number | null;
  is_passed?: boolean | null;
  submitted_at?: string | null;
}

interface ClassMemberDashboardViewProps {
  classId: string;
  className: string;
  assignments: AssignmentItem[];
  submissions: SubmissionItem[];
  postsCount: number;
  filesCount: number;
  memberCount: number;
  evaluatorName: string;
}

export function ClassMemberDashboardView({
  classId,
  className,
  assignments,
  submissions,
  memberCount,
  evaluatorName,
}: ClassMemberDashboardViewProps) {
  // Map of assessment_id -> submission
  const subMap = new Map<string, SubmissionItem>();
  submissions.forEach((s) => {
    subMap.set(s.assessment_id, s);
  });

  const pendingAssignments = assignments.filter((a) => {
    const sub = subMap.get(a.assessment_id);
    return !sub || (sub.status !== 'SUBMITTED' && sub.status !== 'EVALUATED');
  });

  const nextAssignment = pendingAssignments[0] || assignments[0];
  const nextSub = nextAssignment ? subMap.get(nextAssignment.assessment_id) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Content Area (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* 1. Hero Assigned Assessment Card */}
        {nextAssignment ? (
          <div className="p-6 sm:p-7 rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 dark:from-blue-950/40 dark:via-[#111114] dark:to-indigo-950/20 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BÀI ĐÁNH GIÁ DÀNH CHO BẠN</span>
              </span>
              {nextSub ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Đã hoàn thành ({nextSub.percentage ?? nextSub.total_score ?? 0}%)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  Cần làm ngay
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {nextAssignment.assessments?.title || 'Bài đánh giá năng lực số'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Bài kiểm tra chuẩn hóa được giảng viên giao cho lớp. Hãy chuẩn bị kỹ năng trước khi bắt đầu.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-neutral-400 flex-wrap font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{nextAssignment.assessments?.duration_minutes || 30} phút</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span>Điểm đạt: {nextAssignment.assessments?.passing_score || 70}%</span>
              </span>
              {nextAssignment.deadline && (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>Hạn chót: {new Date(nextAssignment.deadline).toLocaleDateString('vi-VN')}</span>
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {pendingAssignments.length} bài chưa nộp trong lớp này
              </span>

              {nextSub ? (
                <Link
                  href={`/personal/assessments/${nextAssignment.assessment_id}`}
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Xem lại kết quả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href={`/personal/take/${nextAssignment.assessment_id}`}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-md shadow-blue-500/25"
                >
                  <span>Bắt đầu làm bài ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Không có bài kiểm tra nào cần làm
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Bạn đã hoàn thành tất cả các bài được giao hoặc giảng viên chưa giao bài mới.
            </p>
          </div>
        )}

        {/* 2. Pinned & Important Announcements */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thông báo tuần này
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Bảng tin lớp</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                    Ghim
                  </span>
                  <span>Chào mừng các thành viên đến với {className}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Người quản lý</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
                Các bạn học viên lưu ý hoàn thành bài khảo thí năng lực đầu vào và tham khảo các tài liệu học tập được chia sẻ trong mục Tài liệu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Class info & tasks overview (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Class Info Box */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Thông tin lớp học
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Giảng viên / Quản lý:</span>
              <strong className="text-neutral-900 dark:text-neutral-100">{evaluatorName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Sĩ số thành viên:</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {memberCount} học viên
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Vai trò của bạn:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300">
                Học viên (Thành viên)
              </span>
            </div>
          </div>
        </div>

        {/* Assigned tasks quicklist */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Bài được giao
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              {assignments.length} bài
            </span>
          </div>

          <div className="space-y-2">
            {assignments.length > 0 ? (
              assignments.slice(0, 4).map((a) => {
                const sub = subMap.get(a.assessment_id);
                const isDone = Boolean(sub && (sub.status === 'SUBMITTED' || sub.status === 'EVALUATED'));

                return (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isDone ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="truncate font-medium text-neutral-800 dark:text-zinc-200">
                        {a.assessments?.title || 'Bài kiểm tra'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono shrink-0">
                      {isDone ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Đã nộp</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Chưa làm</span>
                      )}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">Chưa có bài giao</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
