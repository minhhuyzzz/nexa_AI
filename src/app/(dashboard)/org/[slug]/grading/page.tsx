import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgGradingClientView, SubmissionItem } from './OrgGradingClientView';

export const dynamic = 'force-dynamic';

export default async function OrgGradingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'VIEW_GRADING');
  const adminSupabase = createAdminClient();

  // 1. Fetch related IDs for this organization
  const [{ data: orgClasses }, { data: orgCampaigns }, { data: orgAssessments }] = await Promise.all([
    adminSupabase.from('evaluator_classes').select('id').eq('organization_id', org.id),
    adminSupabase.from('assessment_campaigns').select('id').eq('organization_id', org.id),
    adminSupabase.from('assessments').select('id').eq('organization_id', org.id),
  ]);

  const classIds = (orgClasses || []).map((c) => c.id);
  const campaignIds = (orgCampaigns || []).map((c) => c.id);
  const assessmentIds = (orgAssessments || []).map((a) => a.id);

  let assignmentIds: string[] = [];
  if (classIds.length > 0) {
    const { data: assignments } = await adminSupabase
      .from('class_assignments')
      .select('id')
      .in('class_id', classIds);
    assignmentIds = (assignments || []).map((a) => a.id);
  }

  // Build OR condition
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
        total_score,
        percentage,
        is_passed,
        submitted_at,
        time_spent_seconds,
        evaluator_notes,
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
          evidence_url
        )
      `)
      .in('status', ['SUBMITTED', 'EVALUATED'])
      .or(conditions.join(','))
      .order('submitted_at', { ascending: false });

    if (!error && subs) {
      submissions = subs as unknown as SubmissionItem[];
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              Bàn Chấm Bài Khảo Thí 3 Cột
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold font-mono rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-zinc-700 tabular-nums">
              {submissions.length} bài nộp
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Không gian chấm thi thực hành &amp; phê duyệt điểm số Rubric thang /100 cho tổ chức {org.name}.
          </p>
        </div>
      </div>

      <OrgGradingClientView
        organizationId={org.id}
        organizationName={org.name}
        submissions={submissions}
      />
    </div>
  );
}
