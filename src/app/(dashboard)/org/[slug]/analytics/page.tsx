import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { CheckCircle2, Award, Users, BarChart2, TrendingUp } from 'lucide-react';
import { OrgCompetencyAnalyticsService } from '@/features/analytics/services/org-competency-analytics.service';
import { CampaignComparisonChart } from '@/components/dashboard/org/CampaignComparisonChart';
import { CohortLearningRecommendations } from '@/components/dashboard/org/CohortLearningRecommendations';

export const dynamic = 'force-dynamic';

export default async function OrgAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  // 1. Fetch organization
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  // 2. Fetch total submissions for this organization's assessments
  const { data: orgAssessments } = await adminSupabase
    .from('assessments')
    .select('id')
    .eq('organization_id', org.id);

  const assessmentIds = (orgAssessments || []).map((a) => a.id);

  let rawSubmissions: any[] = [];
  if (assessmentIds.length > 0) {
    const { data: subs } = await adminSupabase
      .from('assessment_submissions')
      .select('id, status, percentage, is_passed, total_score')
      .in('assessment_id', assessmentIds);

    rawSubmissions = subs || [];
  }

  const summary = OrgCompetencyAnalyticsService.aggregateOrgCompetency(rawSubmissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Báo Cáo & Phân Tích Năng Lực Số</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chẩn đoán mức độ phát triển năng lực số 5 miền cốt lõi của đơn vị {org.name}.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Tổng lượt khảo thí</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {summary.totalSubmissions}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {summary.evaluatedSubmissions} bài đã được phê duyệt điểm
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Tỷ lệ đạt chuẩn (&ge; 70%)</div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-1 tabular-nums">
            {summary.overallPassRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Điểm TB toàn đơn vị:{' '}
            <span className="font-mono font-semibold">
              {summary.overallAverageScore !== null ? `${summary.overallAverageScore}đ` : 'Chưa có dữ liệu'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Khung chuẩn áp dụng</div>
          <div className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
            <span>DigComp Khung Chuẩn (5 Miền Cốt Lõi)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Đánh giá toàn diện 5 miền năng lực số</div>
        </div>
      </div>

      {/* Competency Distribution Card (5 Canonical Domains) */}
      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Phân Bố Điểm Số 5 Miền Cốt Lõi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kết quả khảo thí tập thể được tính toán trung thực từ các bài thi đã được phê duyệt.
            </p>
          </div>
        </div>

        <CampaignComparisonChart
          domains={summary.domains}
          passRate={summary.overallPassRate}
          totalEvaluated={summary.evaluatedSubmissions}
        />
      </div>

      {/* Collective Learning Interventions */}
      <CohortLearningRecommendations gapDomainCodes={summary.gapDomainCodes} />
    </div>
  );
}
