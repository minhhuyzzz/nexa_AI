/**
 * @deprecated [UX SPEC 2026-11-03] Member experience is now integrated 100% into Personal Workspace
 * (/personal/groups and /personal/submissions). Non-admin roles (MEMBER, ASSESSOR, etc.) are strictly
 * blocked from /org/[slug]/* console. This component is preserved for backward compatibility only.
 */

import Link from 'next/link';
import { Building2, Calendar, Award, CheckCircle2, Clock, ArrowRight, ExternalLink } from 'lucide-react';

export interface MemberAssignedCampaign {
  id: string;
  title: string;
  assessmentTitle: string;
  durationMinutes: number;
  endsAt?: string | null;
  status: string;
  submissionStatus?: string;
  score?: number | null;
  isPassed?: boolean | null;
}

interface OrgMemberOverviewViewProps {
  orgName: string;
  orgSlug: string;
  userEmail?: string;
  assignedCampaigns: MemberAssignedCampaign[];
  evaluatedCount: number;
  pendingCount: number;
}

export function OrgMemberOverviewView({
  orgName,
  orgSlug,
  userEmail,
  assignedCampaigns,
  evaluatedCount,
  pendingCount,
}: OrgMemberOverviewViewProps) {
  const notStartedCount = assignedCampaigns.filter(
    (c) => !c.submissionStatus || c.submissionStatus === 'NOT_STARTED'
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="p-5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-0.5">
                KHÔNG GIAN HỌC VIÊN &bull; {orgName}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Tổng quan khảo thí cá nhân
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  Thành viên
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Theo dõi các bài đánh giá năng lực số được giao và kết quả chứng nhận của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/org/${orgSlug}/my-results`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Award className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Xem kết quả &amp; chứng chỉ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider font-mono">
            <span>Bài cần hoàn thành</span>
            <Clock className="w-4 h-4 text-slate-400 dark:text-neutral-500" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono mt-2 tabular-nums text-neutral-900 dark:text-neutral-100">
            {notStartedCount} <span className="text-sm font-normal text-slate-400 dark:text-neutral-500">bài</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
            Đợt khảo thí đang mở cần làm bài
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider font-mono">
            <span>Bài đang chờ chấm</span>
            <Calendar className="w-4 h-4 text-slate-400 dark:text-neutral-500" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono mt-2 tabular-nums text-amber-600 dark:text-amber-400">
            {pendingCount} <span className="text-sm font-normal text-slate-400 dark:text-neutral-500">bài</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
            Đã nộp bài, đang chờ khảo thí viên duyệt
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider font-mono">
            <span>Đã hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400 dark:text-neutral-500" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono mt-2 tabular-nums text-emerald-600 dark:text-emerald-400">
            {evaluatedCount} <span className="text-sm font-normal text-slate-400 dark:text-neutral-500">kết quả</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
            Đã có đánh giá và hồ sơ 5 miền
          </div>
        </div>
      </div>

      {/* 3. Assigned Campaigns Table */}
      <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Bài khảo thí được phân công
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Danh sách các kỳ đánh giá thuộc lớp học của bạn tại {orgName}
            </p>
          </div>
          <Link
            href={`/org/${orgSlug}/my-results`}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            <span>Hồ sơ kết quả</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {assignedCampaigns.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-neutral-600 mx-auto mb-2" />
              <div className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                Chưa có bài đánh giá nào được giao
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                Khi đơn vị phát hành đợt đánh giá cho lớp của bạn, bài thi sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-zinc-900/60 text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-4">Đợt đánh giá</th>
                  <th className="py-2.5 px-4">Đề thi</th>
                  <th className="py-2.5 px-4">Thời hạn</th>
                  <th className="py-2.5 px-4">Trạng thái làm bài</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {assignedCampaigns.map((c) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                      Chưa làm bài
                    </span>
                  );
                  let actionBtn = (
                    <Link
                      href={`/org/${orgSlug}/campaigns/${c.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <span>Vào làm bài</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  );

                  if (c.submissionStatus === 'EVALUATED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Đã chấm: {c.score ?? '—'}% {c.isPassed ? '(Đạt)' : ''}
                      </span>
                    );
                    actionBtn = (
                      <Link
                        href={`/org/${orgSlug}/my-results`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                      >
                        <span>Xem kết quả</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    );
                  } else if (c.submissionStatus === 'SUBMITTED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Đã nộp &bull; Chờ chấm
                      </span>
                    );
                    actionBtn = (
                      <Link
                        href={`/org/${orgSlug}/my-results`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-neutral-900"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    );
                  }

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                        {c.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-neutral-400">
                        {c.assessmentTitle}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-neutral-400 tabular-nums">
                        {c.endsAt ? new Date(c.endsAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </td>
                      <td className="py-3 px-4">{statusBadge}</td>
                      <td className="py-3 px-4 text-right">{actionBtn}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
