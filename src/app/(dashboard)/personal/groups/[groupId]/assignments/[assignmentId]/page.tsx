import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ArrowLeft,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Award,
  BarChart2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    groupId: string;
    assignmentId: string;
  }>;
}

export default async function PersonalGroupAssignmentDetailPage({ params }: PageProps) {
  const { groupId, assignmentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/personal/groups/${groupId}/assignments/${assignmentId}`);
  }

  const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

  // 1. Lấy thông tin nhóm cá nhân
  const { data: classRecord } = await adminSupabase
    .from('evaluator_classes')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();

  if (!classRecord) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Không tìm thấy nhóm học tập.
      </div>
    );
  }

  const isManager = classRecord.evaluator_id === user.id || classRecord.owner_user_id === user.id;

  // 2. Lấy thông tin đợt thi (assignment)
  const { data: assignment, error: asgError } = await adminSupabase
    .from('class_assignments')
    .select(`
      id,
      assessment_id,
      deadline,
      start_time,
      allow_late_submission,
      status,
      created_at,
      assessments (
        id,
        title,
        description,
        duration_minutes,
        passing_score
      )
    `)
    .eq('id', assignmentId)
    .eq('class_id', groupId)
    .maybeSingle();

  if (asgError || !assignment) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Không tìm thấy bài khảo thí trong nhóm.
      </div>
    );
  }

  const asm = (assignment as any).assessments;
  const assessmentTitle = asm?.title || 'Bài khảo thí';
  const durationMinutes = asm?.duration_minutes || 45;
  const passingScore = asm?.passing_score || 70;

  // 3. Lấy thành viên nhóm
  const { data: membersRaw } = await adminSupabase
    .from('class_members')
    .select(`
      id,
      joined_at,
      user_id,
      profiles ( id, email, full_name, nickname )
    `)
    .eq('class_id', groupId)
    .order('joined_at', { ascending: true });

  const members = (membersRaw || []).map((m: any) => {
    const prof = m.profiles;
    const fullName = prof?.full_name || prof?.nickname || prof?.email?.split('@')[0] || 'Thành viên';
    return {
      userId: m.user_id,
      fullName,
      email: prof?.email || '',
      joinedAt: m.joined_at,
    };
  });

  const memberUserIds = members.map((m: any) => m.userId);

  // 4. Lấy danh sách bài nộp của học viên
  let submissions: any[] = [];
  if (memberUserIds.length > 0) {
    const { data: subsData } = await adminSupabase
      .from('assessment_submissions')
      .select('id, user_id, status, total_score, max_score, percentage, is_passed, submitted_at')
      .in('user_id', memberUserIds)
      .eq('class_assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    submissions = subsData || [];
  }

  const subByUserId = new Map<string, any>();
  submissions.forEach((s) => {
    if (!subByUserId.has(s.user_id)) {
      subByUserId.set(s.user_id, s);
    }
  });

  // 5. Thống kê KPI thực tế
  const totalMembers = members.length;
  let submittedCount = 0;
  let passedCount = 0;
  let sumPercentage = 0;

  members.forEach((m: any) => {
    const sub = subByUserId.get(m.userId);
    if (sub && (sub.status === 'SUBMITTED' || sub.status === 'EVALUATED')) {
      submittedCount++;
      const pct = Number(sub.percentage) || 0;
      sumPercentage += pct;
      if (sub.is_passed || pct >= passingScore) {
        passedCount++;
      }
    }
  });

  const submissionRate = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0;
  const avgScore = submittedCount > 0 ? Math.round(sumPercentage / submittedCount) : 0;
  const passedRate = submittedCount > 0 ? Math.round((passedCount / submittedCount) * 100) : 0;

  const exportUrl = `/api/classes/${groupId}/assignments/${assignmentId}/export`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      {/* 1. Header & Điều hướng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/personal/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Nhóm: {classRecord.name}</span>
        </Link>

        {/* Nút Tải Báo Cáo Excel - icon tải không cần chữ */}
        <a
          href={exportUrl}
          download
          className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors shadow-2xs cursor-pointer"
          title="Tải Báo Cáo Excel (.xlsx)"
          aria-label="Tải Báo Cáo Excel"
        >
          <Download className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
        </a>
      </div>

      {/* 2. Card Thông Tin Đợt Thi */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[11px] font-bold font-mono">
            ĐỢT KHẢO THÍ NHÓM HỌC TẬP
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
            Đang hoạt động
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {assessmentTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời lượng: {durationMinutes} phút</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Ngưỡng đạt: ≥ {passingScore}%</span>
            </span>
            <span>&bull;</span>
            <span>
              Hạn nộp: {assignment.deadline ? new Date(assignment.deadline).toLocaleString('vi-VN') : 'Không giới hạn'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Dashboard KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Sĩ số nhóm</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {totalMembers}
            <span className="text-xs font-normal text-slate-400 ml-1.5">thành viên</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Danh sách thành viên nhóm</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Tiến độ nộp bài</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {submittedCount}/{totalMembers}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Tỷ lệ nộp: <strong className="text-blue-600 dark:text-blue-400">{submissionRate}%</strong>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Điểm trung bình</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {avgScore}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Tính trên các bài đã nộp</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Tỷ lệ đạt chuẩn</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {passedRate}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {passedCount}/{submittedCount} học viên đạt
          </div>
        </div>
      </div>

      {/* 4. Bảng Kết Quả Nộp Bài */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Danh sách học viên và kết quả ({members.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Theo dõi tình trạng nộp bài và xem chi tiết bài làm của từng học viên
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {submittedCount}/{totalMembers} đã nộp
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 border-b border-slate-200/80 dark:border-zinc-800">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Thời gian nộp</th>
                <th className="py-3 px-4 text-center">Tình trạng</th>
                <th className="py-3 px-4 text-right">Điểm số</th>
                <th className="py-3 px-4 text-right">Tỷ lệ</th>
                <th className="py-3 px-4 text-center">Kết quả</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-sans">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nhóm chưa có thành viên nào.
                  </td>
                </tr>
              ) : (
                members.map((m: any, idx: number) => {
                  const sub = subByUserId.get(m.userId);
                  const isSubmitted = sub && (sub.status === 'SUBMITTED' || sub.status === 'EVALUATED');

                  let statusText = 'Chưa nộp';
                  let submittedDateStr = '—';
                  let scoreVal = '—';
                  let pctVal = '—';
                  let isPassed = false;

                  if (isSubmitted) {
                    statusText = sub.status === 'EVALUATED' ? 'Đã chấm' : 'Đã nộp';
                    if (sub.submitted_at) {
                      submittedDateStr = new Date(sub.submitted_at).toLocaleString('vi-VN');
                      if (assignment.deadline && new Date(sub.submitted_at) > new Date(assignment.deadline)) {
                        statusText = 'Nộp muộn';
                      }
                    }
                    const earned = Number(sub.total_score) || 0;
                    const max = Number(sub.max_score) || 10;
                    const pct = sub.percentage !== null && sub.percentage !== undefined ? Number(sub.percentage) : (max > 0 ? Math.round((earned / max) * 100) : 0);

                    scoreVal = `${earned}/${max}`;
                    pctVal = `${pct}%`;
                    isPassed = Boolean(sub.is_passed || pct >= passingScore);
                  }

                  return (
                    <tr key={m.userId} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                        {m.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {m.email}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {submittedDateStr}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isSubmitted ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            statusText === 'Nộp muộn'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}>
                            {statusText}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                            Chưa nộp
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {scoreVal}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {pctVal}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isSubmitted ? (
                          isPassed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đạt chuẩn</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                              <AlertCircle className="w-3 h-3" />
                              <span>Cần bồi dưỡng</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSubmitted ? (
                          <Link
                            href={`/personal/assessments/${assignment.assessment_id}/result?submissionId=${sub.id}&classId=${groupId}&assignmentId=${assignmentId}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors cursor-pointer"
                          >
                            <span>Xem bài</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
