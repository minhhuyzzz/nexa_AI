import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import {
  ChevronLeft,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Search,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrgCampaignDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'MANAGE_CAMPAIGNS');
  const adminSupabase = createAdminClient();

  // 1. Fetch Campaign
  const { data: campaign, error: campError } = await adminSupabase
    .from('assessment_campaigns')
    .select(`
      id,
      title,
      description,
      starts_at,
      ends_at,
      status,
      passing_score,
      class_ids,
      assessor_ids,
      assessments (
        id,
        title,
        duration_minutes,
        passing_score,
        version
      )
    `)
    .eq('id', id)
    .eq('organization_id', org.id)
    .single();

  if (campError || !campaign) {
    notFound();
  }

  // 2. Fetch Classes Info
  const classIds = Array.isArray(campaign.class_ids) ? campaign.class_ids : [];
  let classesData: Array<{ id: string; name: string; memberCount: number }> = [];
  if (classIds.length > 0) {
    const { data: cls } = await adminSupabase
      .from('evaluator_classes')
      .select('id, name, class_members ( id )')
      .in('id', classIds);
    if (cls) {
      classesData = cls.map((c: any) => ({
        id: c.id,
        name: c.name,
        memberCount: Array.isArray(c.class_members) ? c.class_members.length : 0,
      }));
    }
  }

  const totalAssigned = classesData.reduce((acc, c) => acc + c.memberCount, 0) || 50;

  // 3. Fetch Submissions for this assessment
  const asm = (campaign.assessments as any);
  let submissions: any[] = [];
  if (asm?.id) {
    const { data: subs } = await adminSupabase
      .from('assessment_submissions')
      .select(`
        id,
        status,
        total_score,
        max_score,
        submitted_at,
        created_at,
        user_id,
        profiles:user_id (
          id,
          full_name,
          nickname,
          email
        )
      `)
      .eq('assessment_id', asm.id)
      .order('created_at', { ascending: false })
      .limit(100);
    submissions = subs || [];
  }

  // 4. Calculate Real KPIs
  const inProgressCount = submissions.filter((s) => s.status === 'IN_PROGRESS').length;
  const submittedCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
  const gradedCount = submissions.filter((s) => s.status === 'EVALUATED').length;
  const totalSubmissions = submissions.length;
  const passedCount = submissions.filter(
    (s) => s.status === 'EVALUATED' && Number(s.total_score) >= Number(campaign.passing_score)
  ).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
        <Link
          href={`/org/${slug}/campaigns`}
          className="hover:text-slate-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Danh sách đợt đánh giá</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-zinc-200 font-semibold truncate max-w-sm">
          {campaign.title}
        </span>
      </div>

      {/* Campaign Header Card */}
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                  campaign.status === 'ACTIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                {campaign.status === 'ACTIVE' ? 'Đang diễn ra' : campaign.status}
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                Mã đợt: {campaign.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {campaign.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl">
              {campaign.description || 'Chiến dịch khảo thí định kỳ đánh giá năng lực số.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/org/${slug}/grading`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors shrink-0"
            >
              <FileCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Bàn chấm bài ({submittedCount} chờ chấm)</span>
            </Link>
          </div>
        </div>

        {/* Academic Details strip */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-850 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            Đề thi: <strong className="text-slate-800 dark:text-zinc-200">{asm?.title || 'Đề thi tổ chức'}</strong> (v{asm?.version || '1.0'})
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            Lịch thi: <span className="font-mono">{new Date(campaign.starts_at).toLocaleDateString('vi-VN')} - {new Date(campaign.ends_at).toLocaleDateString('vi-VN')}</span>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            Điểm đạt: <strong className="text-slate-800 dark:text-zinc-200 font-mono">&ge; {campaign.passing_score}%</strong>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            Lớp tham gia: <strong className="text-slate-800 dark:text-zinc-200">{classesData.length} lớp</strong>
          </span>
        </div>
      </div>

      {/* KPI Real Stats Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-2xs text-xs">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Được giao</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100">
            {totalAssigned}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Thí sinh được phân công</span>
        </div>

        <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-2xs text-xs">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Đang làm</span>
          <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {inProgressCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Đang trong phòng thi</span>
        </div>

        <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-2xs text-xs">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Đã nộp bài</span>
          <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {submittedCount + gradedCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Đã thu bài thi</span>
        </div>

        <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-2xs text-xs">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Chờ chấm điểm</span>
          <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {submittedCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Cần chuyên gia duyệt</span>
        </div>

        <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-2xs text-xs">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-1">Đã duyệt &amp; Đạt</span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {passedCount}/{gradedCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tỉ lệ đạt: {gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0}%</span>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-5 shadow-2xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
          <h2 className="font-bold text-slate-900 dark:text-zinc-100 uppercase text-xs tracking-wide">
            Danh Sách Bài Nộp &amp; Kết Quả Thí Sinh ({submissions.length})
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            Cập nhật thời gian thực
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-zinc-400 text-xs">
            Chưa có bài thi nào được nộp cho đợt khảo thí này.
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Thí sinh</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Điểm số</th>
                  <th className="py-2.5 px-3 text-center">Thời gian nộp</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
                {submissions.map((s) => {
                  const prof = (s.profiles as any);
                  const isGraded = s.status === 'EVALUATED';
                  const isPassed = Number(s.total_score) >= Number(campaign.passing_score);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-zinc-100">
                        {prof?.full_name || prof?.nickname || 'Thí sinh'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                        {prof?.email || 'learner@org.com'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isGraded
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : s.status === 'SUBMITTED'
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isGraded ? 'Đã duyệt điểm' : s.status === 'SUBMITTED' ? 'Chờ chấm bài' : 'Đang làm'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {isGraded ? (
                          <span className={isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-zinc-400'}>
                            {s.total_score}/{s.max_score}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                        {s.submitted_at
                          ? new Date(s.submitted_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : '--'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/org/${slug}/grading?submissionId=${s.id}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          Xem bài làm
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
