import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgCompetencyAnalyticsService } from '@/features/analytics/services/org-competency-analytics.service';
import { OrgAnalyticsDashboard } from '@/features/analytics/components/OrgAnalyticsDashboard';
import {
  RawClassInfo,
  RawCampaignInfo,
  RawAnalyticsSubmission,
} from '@/features/analytics/types/org-analytics.types';

export const dynamic = 'force-dynamic';

export default async function OrgAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; campaignId?: string; classId?: string }>;
}) {
  const { slug } = await params;
  const { tab, campaignId, classId } = (await searchParams) || {};
  const { organization: org } = await requireOrgPagePermission(slug, 'VIEW_ANALYTICS');
  const adminSupabase = createAdminClient();

  // 1. Fetch organization classes and member IDs
  const { data: rawClasses } = await adminSupabase
    .from('evaluator_classes')
    .select('id, name, class_members ( user_id )')
    .eq('organization_id', org.id);

  const classesInfo: RawClassInfo[] = (rawClasses || []).map((c: any) => {
    const memberUserIds = (c.class_members || []).map((m: any) => m.user_id).filter(Boolean);
    return {
      id: c.id,
      name: c.name,
      member_count: memberUserIds.length,
      member_user_ids: memberUserIds,
    };
  });

  // 2. Fetch assessment campaigns belonging to this organization
  const { data: rawCampaigns } = await adminSupabase
    .from('assessment_campaigns')
    .select('id, title, status, starts_at, ends_at, passing_score, class_ids')
    .eq('organization_id', org.id)
    .order('starts_at', { ascending: false });

  const campaignsInfo: RawCampaignInfo[] = (rawCampaigns || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    starts_at: c.starts_at,
    ends_at: c.ends_at,
    passing_score: c.passing_score ?? 70,
    class_ids: Array.isArray(c.class_ids) ? c.class_ids : [],
  }));

  // 3. Fetch assessments belonging to this organization
  const { data: orgAssessments } = await adminSupabase
    .from('assessments')
    .select('id')
    .eq('organization_id', org.id);

  const assessmentIds = (orgAssessments || []).map((a) => a.id);
  const campaignIds = campaignsInfo.map((c) => c.id);

  const subsMap = new Map<string, RawAnalyticsSubmission>();

  // Query submissions by campaign_id
  if (campaignIds.length > 0) {
    const { data: cSubs } = await adminSupabase
      .from('assessment_submissions')
      .select('id, campaign_id, assessment_id, user_id, status, percentage, is_passed, total_score, domain_scores, created_at, evaluated_at')
      .in('campaign_id', campaignIds);
    (cSubs || []).forEach((s) => subsMap.set(s.id, s as RawAnalyticsSubmission));
  }

  // Query submissions by assessment_id
  if (assessmentIds.length > 0) {
    const { data: aSubs } = await adminSupabase
      .from('assessment_submissions')
      .select('id, campaign_id, assessment_id, user_id, status, percentage, is_passed, total_score, domain_scores, created_at, evaluated_at')
      .in('assessment_id', assessmentIds);
    (aSubs || []).forEach((s) => subsMap.set(s.id, s as RawAnalyticsSubmission));
  }

  const rawSubmissions = Array.from(subsMap.values());

  // Aggregate multi-dimensional analytics with filters
  const summary = OrgCompetencyAnalyticsService.aggregateOrgCompetency(
    rawSubmissions,
    classesInfo,
    campaignsInfo,
    { campaignId, classId }
  );

  return (
    <OrgAnalyticsDashboard
      orgName={org.name}
      orgSlug={slug}
      summary={summary}
      classes={classesInfo}
      campaigns={campaignsInfo}
      initialTab={tab}
      initialCampaignId={campaignId}
      initialClassId={classId}
    />
  );
}
