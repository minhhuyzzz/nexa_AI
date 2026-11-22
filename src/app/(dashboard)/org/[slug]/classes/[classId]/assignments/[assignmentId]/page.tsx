import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import {
  ArrowLeft,
  Download,
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  Calendar,
  ShieldCheck,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug: string;
    classId: string;
    assignmentId: string;
  }>;
}

export default async function OrgClassAssignmentDetailPage({ params }: PageProps) {
  const { slug, classId, assignmentId } = await params;
  const { organization: org, user, role, isSuperadmin } = await requireOrgPagePermission(slug, 'MANAGE_CLASSES');
  const isManager = ['ORG_OWNER', 'ORG_ADMIN'].includes(role) || Boolean(isSuperadmin);
  const adminSupabase = createAdminClient();

  // 1. Lấy thông tin lớp học
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);
  let classQuery = adminSupabase
    .from('evaluator_classes')
    .select('*')
    .eq('organization_id', org.id);

  if (isUuid) {
    classQuery = classQuery.eq('id', classId);
  } else {
    classQuery = classQuery.eq('class_code', classId);
  }

  if (!isManager) {
    classQuery = classQuery.or(`instructor_id.eq.${user.id},evaluator_id.eq.${user.id}`);
  }

  const { data: classRecord } = await classQuery.maybeSingle();
  if (!classRecord) notFound();

  const realClassId = classRecord.id;

  // 2. Lấy thông tin đợt thi (assignment)
  const { data: assignment, error: asgError } = await adminSupabase
    .from('class_assignments')
    .select(`
      id,
      assessment_id,
      deadline,
      start_time,
      timezone,
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
    .eq('class_id', realClassId)
    .maybeSingle();

  if (asgError || !assignment) notFound();

  const asm = (assignment as any).assessments;
  const assessmentTitle = asm?.title || 'Bài khảo thí';
  const durationMinutes = asm?.duration_minutes || 45;
  const passingScore = asm?.passing_score || 70;

  // 3. Lấy danh sách thành viên lớp
  const { data: membersRaw } = await adminSupabase
    .from('class_members')
    .select(`
      id,
      joined_at,
      user_id,
      role_in_class,
      profiles ( id, email, full_name, nickname )
    `)
    .eq('class_id', realClassId)
    .order('joined_at', { ascending: true });

  const members = (membersRaw || []).map((m: any) => {
    const prof = m.profiles;
    const fullName = prof?.full_name || prof?.nickname || prof?.email?.split('@')[0] || 'Thành viên';
    return {
      userId: m.user_id,
      fullName,
      email: prof?.email || '',
      role: m.role_in_class || 'STUDENT',
      joinedAt: m.joined_at,
    };
  });

  const memberUserIds = members.map((m) => m.userId);

  // 4. Lấy danh sách bài nộp của học viên
  let submissions: any[] = [];
  if (memberUserIds.length > 0) {
    const { data: subsData } = await adminSupabase
      .from('assessment_submissions')
      .select('id, user_id, status, total_score, max_score, percentage, is_passed, submitted_at')
      .in('user_id', memberUserIds)
      .or(`class_assignment_id.eq.${assignmentId},assessment_id.eq.${assignment.assessment_id}`)
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

  members.forEach((m) => {
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

  const exportUrl = `/api/org/${slug}/classes/${classId}/assignments/${assignmentId}/export`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      {/* 1. Header & Điều hướng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/org/${slug}/classes/${classId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Lớp: {classRecord.name}</span>
        </Link>

        {/* Nút Tải Báo Cáo Excel */}
        <a
          href={exportUrl}
          download
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Tải Báo Cáo Excel (.xlsx)</span>
        </a>
      </div>

      {/* 2. Card Thông Tin Đợt Thi */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[11px] font-bold font-mono">
            ĐỢT KHẢO THÍ LỚP HỌC
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-semibold">
            Đang hoạt động
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
          {assessmentTitle}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-neutral-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            Thời lượng: <strong>{durationMinutes} phút</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            Ngưỡng đạt: <strong>≥ {passingScore}%</strong>
          </span>
          {assignment.deadline && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Hạn nộp: <strong>{new Date(assignment.deadline).toLocaleString('vi-VN')}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 3. Thống Kê 4 Chỉ Số Cốt Lõi (KPI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Sĩ số lớp</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
            {totalMembers} <span className="text-xs font-normal text-slate-500">học viên</span>
          </div>
          <p className="text-[11px] text-slate-400">Danh sách thành viên lớp</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tiến độ nộp bài</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
            {submittedCount} / {totalMembers}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            Tỷ lệ nộp: {submissionRate}%
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Điểm trung bình</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
            {avgScore}%
          </div>
          <p className="text-[11px] text-slate-400">Tính trên các bài đã nộp</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tỷ lệ đạt chuẩn</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {passedRate}%
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {passedCount} / {submittedCount > 0 ? submittedCount : 1} học viên đạt
          </p>
        </div>
      </div>

      {/* 4. Bảng Danh Sách Học Viên Chi Tiết */}
      <div className="rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Danh sách học viên và kết quả ({members.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {submittedCount}/{totalMembers} đã nộp
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-neutral-400 font-semibold border-b border-slate-200/80 dark:border-zinc-800">
              <tr>
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
            <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800/60">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Lớp chưa có thành viên nào.
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => {
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
                            href={`/org/${slug}/grading`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
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
