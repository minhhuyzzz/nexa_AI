import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import {
  OrgGradingClientView,
  SubmissionItem,
  OrgClassOption,
  OrgCampaignOption,
} from './OrgGradingClientView';

export const dynamic = 'force-dynamic';

export default async function OrgGradingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ classId?: string; campaignId?: string; status?: string; submissionId?: string }>;
}) {
  const { slug } = await params;
  const { classId, campaignId, status, submissionId } = await searchParams;
  const { organization: org } = await requireOrgPagePermission(slug, 'VIEW_GRADING');
  const adminSupabase = createAdminClient();

  // 1. Fetch related IDs and metadata for this organization
  const [{ data: orgClasses }, { data: orgCampaigns }, { data: orgAssessments }] = await Promise.all([
    adminSupabase
      .from('evaluator_classes')
      .select('id, name, class_code')
      .eq('organization_id', org.id)
      .order('name'),
    adminSupabase
      .from('assessment_campaigns')
      .select('id, title')
      .eq('organization_id', org.id)
      .order('title'),
    adminSupabase
      .from('assessments')
      .select('id, title, passing_score')
      .eq('organization_id', org.id),
  ]);

  const classIds = (orgClasses || []).map((c) => c.id);
  const campaignIds = (orgCampaigns || []).map((c) => c.id);
  const assessmentIds = (orgAssessments || []).map((a) => a.id);

  const assignmentIds: string[] = [];
  const classAssignmentMap: Record<string, string> = {}; // assignmentId -> classId
  if (classIds.length > 0) {
    const { data: assignments } = await adminSupabase
      .from('class_assignments')
      .select('id, class_id')
      .in('class_id', classIds);
    (assignments || []).forEach((a) => {
      assignmentIds.push(a.id);
      classAssignmentMap[a.id] = a.class_id;
    });
  }

  // Build OR conditions to load all relevant submissions for this organization
  const conditions: string[] = [];
  if (assignmentIds.length > 0) {
    conditions.push(`class_assignment_id.in.(${assignmentIds.join(',')})`);
  }
  if (campaignIds.length > 0) {
    conditions.push(`campaign_id.in.(${campaignIds.join(',')})`);
  }
  if (assessmentIds.length > 0) {
    conditions.push(`assessment_id.in.(${assessmentIds.join(',')})`);
  }

  let submissions: SubmissionItem[] = [];

  if (conditions.length > 0) {
    const { data: subs, error } = await adminSupabase
      .from('assessment_submissions')
      .select(`
        id,
        assessment_id,
        user_id,
        status,
        grading_status,
        total_score,
        percentage,
        is_passed,
        submitted_at,
        time_spent_seconds,
        evaluator_notes,
        class_assignment_id,
        campaign_id,
        assessments (
          id,
          title,
          passing_score
        ),
        profiles:user_id (
          id,
          email,
          nickname,
          full_name,
          avatar_url
        ),
        submission_answers (
          id,
          item_id,
          text_response,
          evidence_url,
          score_awarded,
          auto_graded,
          assessment_items (
            id,
            prompt,
            points,
            type,
            order_index
          )
        )
      `)
      .in('status', ['SUBMITTED', 'EVALUATED'])
      .or(conditions.join(','))
      .order('submitted_at', { ascending: false });

    if (!error && subs) {
      // Exclude 100% MCQ tests that completed automatically (grading_status === 'COMPLETED' and no open questions)
      submissions = (subs as any[]).filter((s) => {
        const answers = s.submission_answers || [];
        const hasOpenQuestion = answers.some(
          (a: any) =>
            a.auto_graded === false ||
            Boolean(a.text_response?.trim()) ||
            Boolean(a.evidence_url)
        );
        if (!hasOpenQuestion && s.grading_status === 'COMPLETED') {
          return false;
        }
        return true;
      }) as unknown as SubmissionItem[];
    }
  }

  const classes: OrgClassOption[] = (orgClasses || []).map((c) => ({
    id: c.id,
    name: c.name,
    class_code: c.class_code,
  }));

  const campaigns: OrgCampaignOption[] = (orgCampaigns || []).map((camp) => ({
    id: camp.id,
    title: camp.title,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Bàn chấm bài
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 tabular-nums">
            {submissions.length} bài
          </span>
        </div>
      </div>

      <OrgGradingClientView
        organizationId={org.id}
        organizationName={org.name}
        slug={slug}
        classes={classes}
        campaigns={campaigns}
        classAssignmentMap={classAssignmentMap}
        submissions={submissions}
        initialClassId={classId || ''}
        initialCampaignId={campaignId || ''}
        initialStatus={status || 'ALL'}
        initialSubmissionId={submissionId || null}
      />
    </div>
  );
}
