import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const submitGradeSchema = z.object({
  submissionId: z.string().uuid('ID bài thi không hợp lệ'),
  totalScore: z.number().min(0).max(100),
  feedback: z.string().trim().optional(),
});

async function checkOrgAssessor(userId: string, orgId: string) {
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'ADMIN') return true;

  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .single();

  return (
    member &&
    ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(member.org_role)
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const isAssessor = await checkOrgAssessor(user.id, orgId);
    if (!isAssessor) {
      return NextResponse.json(
        { error: 'Bạn không có quyền chấm bài trong tổ chức này' },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch organization assessments
    const { data: orgAssessments } = await adminSupabase
      .from('assessments')
      .select('id, title, passing_score')
      .eq('organization_id', orgId);

    const assessmentIds = (orgAssessments || []).map((a) => a.id);
    if (assessmentIds.length === 0) {
      return NextResponse.json({ success: true, submissions: [] });
    }

    // 2. Fetch submissions for these assessments
    const { data: submissions, error } = await adminSupabase
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submissions: submissions || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const isAssessor = await checkOrgAssessor(user.id, orgId);
    if (!isAssessor) {
      return NextResponse.json(
        { error: 'Bạn không có quyền chấm điểm bài thi trong tổ chức này' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = submitGradeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { submissionId, totalScore, feedback } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Fetch submission with assessment info
    const { data: sub, error: subErr } = await adminSupabase
      .from('assessment_submissions')
      .select('id, assessment_id, max_score, assessments ( organization_id, passing_score )')
      .eq('id', submissionId)
      .single();

    if (subErr || !sub) {
      return NextResponse.json({ error: 'Bài nộp không tồn tại' }, { status: 404 });
    }

    interface SubWithOrg {
      assessments: { organization_id?: string; passing_score?: number } | null;
      max_score?: number;
    }
    const typedSub = sub as unknown as SubWithOrg;

    if (typedSub.assessments?.organization_id !== orgId) {
      return NextResponse.json(
        { error: 'Bài nộp không thuộc tổ chức này' },
        { status: 403 }
      );
    }

    const maxScore = typedSub.max_score || 100;
    const percentage = Math.round((totalScore / maxScore) * 1000) / 10;
    const passingThreshold = typedSub.assessments?.passing_score || 70.0;
    const isPassed = percentage >= passingThreshold;

    // 2. Official HITL Approval - Update submission status to EVALUATED
    const { data: updated, error: updateErr } = await adminSupabase
      .from('assessment_submissions')
      .update({
        total_score: totalScore,
        percentage,
        is_passed: isPassed,
        status: 'EVALUATED',
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã phê duyệt kết quả khảo thí thành công (${percentage}% - ${isPassed ? 'Đạt' : 'Chưa đạt'})`,
      submission: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
