import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { BarChart2, CheckCircle2, Award, Users, TrendingUp } from 'lucide-react';
import { CompetencyRadarChart } from '@/components/dashboard/personal/CompetencyRadarChart';

export default async function OrgAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  // 1. Fetch total submissions for this organization's assessments
  const { data: orgAssessments } = await adminSupabase
    .from('assessments')
    .select('id')
    .eq('organization_id', org.id);

  const assessmentIds = (orgAssessments || []).map((a) => a.id);

  let totalSubmissions = 0;
  let passedSubmissions = 0;

  if (assessmentIds.length > 0) {
    const { count: total } = await adminSupabase
      .from('assessment_submissions')
      .select('id', { count: 'exact', head: true })
      .in('assessment_id', assessmentIds)
      .eq('status', 'COMPLETED');

    const { count: passed } = await adminSupabase
      .from('assessment_submissions')
      .select('id', { count: 'exact', head: true })
      .in('assessment_id', assessmentIds)
      .eq('status', 'COMPLETED')
      .gte('score', 70);

    totalSubmissions = total || 0;
    passedSubmissions = passed || 0;
  }

  const passRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Báo cáo & Phân tích Năng lực</h1>
          <p className="text-xs text-slate-500 mt-1">
            Phân tích số liệu khảo thí và phân bố năng lực số theo khung DigComp 3.0 của tổ chức {org.name}.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Tổng lượt khảo thí</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalSubmissions}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Bài nộp đã hoàn thành</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Tỷ lệ đạt chuẩn (&ge; 70%)</div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-1">
            {passRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-2">{passedSubmissions} bài đạt chuẩn</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Khung chuẩn áp dụng</div>
          <div className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
            <span>DigComp 3.0 (5 Miền, 21 Kỹ năng)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Chuẩn năng lực số Châu Âu</div>
        </div>
      </div>

      {/* Competency Distribution Card */}
      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Phân bố Năng lực 5 Miền Toàn Tổ Chức</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Biểu đồ Radar tổng hợp năng lực số của các thành viên trong tổ chức.
          </p>
        </div>

        <CompetencyRadarChart />
      </div>
    </div>
  );
}
