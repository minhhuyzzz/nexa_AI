import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrgGradingClientView } from './OrgGradingClientView';

export const dynamic = 'force-dynamic';

export default async function OrgGradingPage({
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

  if (!org) notFound();

  // 2. Fetch organization assessments
  const { data: orgAssessments } = await adminSupabase
    .from('assessments')
    .select('id, title, passing_score')
    .eq('organization_id', org.id);

  const assessmentIds = (orgAssessments || []).map((a) => a.id);

  // 3. Fetch submissions
  let submissions: any[] = [];
  if (assessmentIds.length > 0) {
    const { data: subs } = await adminSupabase
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
        assessments ( id, title, passing_score ),
        profiles:user_id ( id, email, nickname, full_name )
      `)
      .in('assessment_id', assessmentIds)
      .in('status', ['SUBMITTED', 'EVALUATED'])
      .order('submitted_at', { ascending: false });

    submissions = subs || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Bàn Chấm Bài Khảo Thí</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-100 text-slate-700">
              {submissions.length} bài nộp
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Không gian chấm thi thực hành & phê duyệt điểm số Rubric cho giảng viên tổ chức {org.name}.
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
