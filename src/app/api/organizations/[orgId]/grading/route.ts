import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgApiPermission } from '@/lib/auth/org-guard';

export const dynamic = 'force-dynamic';

const submitGradeSchema = z.object({
  submissionId: z.string().uuid('ID bài thi không hợp lệ'),
  totalScore: z.number().min(0).max(100),
  feedback: z.string().trim().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const authResult = await requireOrgApiPermission(orgId, 'VIEW_GRADING');
    if (!authResult.authorized) {
      return authResult.response!;
    }

    const user = authResult.context!.user;
    const orgRole = authResult.context!.role;
    const isOrgAdminOrOwner = orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN' || authResult.context!.isSuperadmin;

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

    let allowedClassIds: string[] | null = null;
    let targetAssessmentIds: string[] = assessmentIds;

    // ORG-08: Giới hạn assessor chỉ xem bài nộp của lớp/đợt mình được phân công phụ trách
    if (!isOrgAdminOrOwner) {
      const { data: myClasses } = await adminSupabase
        .from('evaluator_classes')
        .select('id')
        .eq('organization_id', orgId)
        .eq('evaluator_id', user.id);

      const myClassIds = (myClasses || []).map((c) => c.id);

      const { data: myCampaigns } = await adminSupabase
        .from('assessment_campaigns')
        .select('assessment_id, class_ids, assessor_ids')
        .eq('organization_id', orgId);

      const assignedCampaigns = (myCampaigns || []).filter((camp) => {
        const ids = Array.isArray(camp.assessor_ids) ? camp.assessor_ids : [];
        return ids.includes(user.id);
      });

      const campaignClassIds = assignedCampaigns.flatMap((c) => (Array.isArray(c.class_ids) ? c.class_ids : []));
      const combinedClassIds = Array.from(new Set([...myClassIds, ...campaignClassIds]));
      const assignedAssessmentIds = Array.from(new Set(assignedCampaigns.map((c) => c.assessment_id)));

      if (combinedClassIds.length === 0 && assignedAssessmentIds.length === 0) {
        return NextResponse.json({ success: true, submissions: [] });
      }

      allowedClassIds = combinedClassIds;
      if (assignedAssessmentIds.length > 0) {
        targetAssessmentIds = assessmentIds.filter((id) => assignedAssessmentIds.includes(id));
      }
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
        class_assignment_id,
        assessments ( id, title, passing_score ),
        profiles:user_id ( id, email, nickname, full_name )
      `)
      .in('assessment_id', targetAssessmentIds)
      .in('status', ['SUBMITTED', 'EVALUATED'])
      .order('submitted_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let resultSubmissions = submissions || [];
    if (allowedClassIds !== null && allowedClassIds.length > 0) {
      const { data: classAsgs } = await adminSupabase
        .from('class_assignments')
        .select('id')
        .in('class_id', allowedClassIds);

      const validAsgIds = new Set((classAsgs || []).map((a) => a.id));
      resultSubmissions = resultSubmissions.filter(
        (s: any) => !s.class_assignment_id || validAsgIds.has(s.class_assignment_id)
      );
    }

    return NextResponse.json({ success: true, submissions: resultSubmissions });
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
    const authResult = await requireOrgApiPermission(orgId, 'GRADE_SUBMISSION');
    if (!authResult.authorized) {
      return authResult.response!;
    }

    const user = authResult.context!.user;
    const orgRole = authResult.context!.role;
    const isOrgAdminOrOwner = orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN' || authResult.context!.isSuperadmin;

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
      .select('id, assessment_id, max_score, class_assignment_id, assessments ( organization_id, passing_score )')
      .eq('id', submissionId)
      .single();

    if (subErr || !sub) {
      return NextResponse.json({ error: 'Bài nộp không tồn tại' }, { status: 404 });
    }

    interface SubWithOrg {
      assessments: { organization_id?: string; passing_score?: number } | null;
      max_score?: number;
      class_assignment_id?: string | null;
    }
    const typedSub = sub as unknown as SubWithOrg;

    if (typedSub.assessments?.organization_id !== orgId) {
      return NextResponse.json(
        { error: 'Bài nộp không thuộc tổ chức này' },
        { status: 403 }
      );
    }

    // ORG-08: Giới hạn assessor chỉ được chấm bài thuộc lớp/chiến dịch mình phụ trách
    if (!isOrgAdminOrOwner && typedSub.class_assignment_id) {
      const { data: myClasses } = await adminSupabase
        .from('evaluator_classes')
        .select('id')
        .eq('organization_id', orgId)
        .eq('evaluator_id', user.id);

      const { data: myCampaigns } = await adminSupabase
        .from('assessment_campaigns')
        .select('class_ids, assessor_ids')
        .eq('organization_id', orgId);

      const assignedCampaigns = (myCampaigns || []).filter((camp) => {
        const ids = Array.isArray(camp.assessor_ids) ? camp.assessor_ids : [];
        return ids.includes(user.id);
      });

      const allowedClassIds = new Set([
        ...(myClasses || []).map((c) => c.id),
        ...assignedCampaigns.flatMap((c) => (Array.isArray(c.class_ids) ? c.class_ids : [])),
      ]);

      const { data: asg } = await adminSupabase
        .from('class_assignments')
        .select('class_id')
        .eq('id', typedSub.class_assignment_id)
        .single();

      if (!asg || !allowedClassIds.has(asg.class_id)) {
        return NextResponse.json(
          { error: 'Bạn không được phân công chấm bài nộp này' },
          { status: 403 }
        );
      }
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
