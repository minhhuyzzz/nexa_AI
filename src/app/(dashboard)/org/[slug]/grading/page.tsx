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

  // 1. Fetch organization assessments
  const { data: orgAssessments } = await adminSupabase
    .from('assessments')
    .select('id, title, passing_score')
    .eq('organization_id', org.id);

  const assessmentIds = (orgAssessments || []).map((a) => a.id);

  // 2. Fetch submissions for this organization (by organization_id or assessmentIds)
  let query = adminSupabase
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
    .order('submitted_at', { ascending: false });

  if (assessmentIds.length > 0) {
    query = query.or(`organization_id.eq.${org.id},assessment_id.in.(${assessmentIds.join(',')})`);
  } else {
    query = query.eq('organization_id', org.id);
  }

  const { data: subs } = await query;
  const submissions: SubmissionItem[] = (subs as unknown as SubmissionItem[]) || [];

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
            Không gian chấm thi thực hành &amp; phê duyệt điểm số Rubric thang /100 cho giảng viên tổ chức {org.name}.
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
