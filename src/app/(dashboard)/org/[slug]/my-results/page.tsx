import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  XCircle,
  FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface MyOrgSubmission {
  id: string;
  assessment_id: string;
  status: string;
  total_score: number | null;
  percentage: number | null;
  is_passed: boolean | null;
  submitted_at: string | null;
  time_spent_seconds: number | null;
  assessments?: {
    id: string;
    title: string;
    passing_score: number;
    duration_minutes: number;
  } | null;
}

export default async function OrgMyResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireOrgPagePermission(slug, 'VIEW_WORKSPACE');
  const user = context.user;
  const org = context.organization;
  const adminSupabase = createAdminClient();

  // 1. Fetch organization assessments
  const { data: orgAssessments } = await adminSupabase
    .from('assessments')
    .select('id, title, passing_score, duration_minutes')
    .eq('organization_id', org.id);

  const assessmentIds = (orgAssessments || []).map((a) => a.id);

  // 2. Fetch current member's submissions for this organization
  let submissions: MyOrgSubmission[] = [];
  if (assessmentIds.length > 0) {
    const { data: subs } = await adminSupabase
      .from('assessment_submissions')
      .select(`
        id,
        assessment_id,
        status,
        total_score,
        percentage,
        is_passed,
        submitted_at,
        time_spent_seconds,
        assessments ( id, title, passing_score, duration_minutes )
      `)
      .eq('user_id', user.id)
      .in('assessment_id', assessmentIds)
      .order('submitted_at', { ascending: false });

    submissions = (subs as unknown as MyOrgSubmission[]) || [];
  }

  const evaluatedSubs = submissions.filter((s) => s.status === 'EVALUATED');
  const passedSubs = evaluatedSubs.filter((s) => s.is_passed === true);
  const avgScore =
    evaluatedSubs.length > 0
      ? Math.round(
          evaluatedSubs.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
            evaluatedSubs.length
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Kết Quả Khảo Thí Của Tôi
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-100 text-slate-700">
              {org.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi điểm số, kết quả đánh giá năng lực số và lịch sử bài làm của bạn tại đơn vị.
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Bài thi đã tham gia
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {submissions.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            {evaluatedSubs.length} bài đã có điểm chính thức
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Bài đạt chuẩn
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            {passedSubs.length} <span className="text-sm font-normal text-slate-400">/ {evaluatedSubs.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            Tỷ lệ đạt:{' '}
            {evaluatedSubs.length > 0
              ? `${Math.round((passedSubs.length / evaluatedSubs.length) * 100)}%`
              : '—'}
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Điểm trung bình
          </div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-1 tabular-nums">
            {avgScore !== null ? `${avgScore}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Theo khung năng lực số DigComp
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900">Danh sách bài khảo thí</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kết quả thẩm định bởi hội đồng khảo thí của {org.name}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {submissions.length} bài nộp
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.75} />
            <p className="font-semibold text-slate-700">Bạn chưa có bài khảo thí nào trong tổ chức</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Khi giảng viên phát hành đợt đánh giá, bạn có thể làm bài và xem kết quả tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => {
              const isEvaluated = sub.status === 'EVALUATED';
              const isPassed = Boolean(sub.is_passed);

              return (
                <div
                  key={sub.id}
                  className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {sub.assessments?.title || 'Bài khảo thí tổ chức'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isEvaluated
                            ? isPassed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEvaluated
                              ? isPassed
                                ? 'bg-emerald-600'
                                : 'bg-rose-600'
                              : 'bg-amber-500'
                          }`}
                        />
                        {isEvaluated
                          ? isPassed
                            ? 'Đạt chuẩn'
                            : 'Chưa đạt'
                          : 'Đang chấm điểm'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>
                        Nộp lúc:{' '}
                        {sub.submitted_at
                          ? new Date(sub.submitted_at).toLocaleDateString('vi-VN')
                          : '—'}
                      </span>
                      {sub.time_spent_seconds && (
                        <span>
                          Thời gian làm: {Math.round(sub.time_spent_seconds / 60)} phút
                        </span>
                      )}
                      <span>Chuẩn đạt: {sub.assessments?.passing_score || 70}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                        {isEvaluated && sub.percentage !== null
                          ? `${sub.percentage}%`
                          : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {isEvaluated
                          ? sub.total_score !== null
                            ? `${sub.total_score} điểm`
                            : 'Chính thức'
                          : 'Chờ thẩm định'}
                      </div>
                    </div>

                    <Link
                      href={`/personal/assessments/${sub.assessment_id}/result?submissionId=${sub.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 hover:border-sky-300 hover:text-sky-700 text-slate-700 text-xs font-semibold bg-white transition-colors"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
