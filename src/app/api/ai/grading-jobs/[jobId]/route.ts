import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: job, error: jobError } = await adminSupabase
      .from('ai_grading_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Không tìm thấy tiến trình chấm điểm' }, { status: 404 });
    }

    // Authorization check: Assessor, org admin/owner, or platform admin
    if (job.org_id) {
      const { data: membership } = await adminSupabase
        .from('user_organizations')
        .select('org_role, status')
        .eq('organization_id', job.org_id)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      const isOrgStaff =
        membership &&
        ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(membership.org_role);

      const isDirectAssessor = job.assigned_assessor_id === user.id;

      if (!isOrgStaff && !isDirectAssessor) {
        return NextResponse.json({ error: 'Bạn không có quyền xem tiến trình chấm bài này' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        submissionId: job.submission_id,
        assessmentId: job.assessment_id,
        orgId: job.org_id,
        status: job.job_status,
        aiDraftScores: job.ai_draft_scores,
        hitlReviewedScores: job.hitl_reviewed_scores,
        modelUsed: job.model_used,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        completedAt: job.completed_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi kiểm tra tiến trình chấm bài';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
