import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch assessment details
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase
      .from('assessments')
      .select('id, title, description, duration_minutes, passing_score, point_reward, is_vip, access_tier, organization_id')
      .eq('is_published', true);

    if (isUUID) {
      query = query.eq('id', id);
    }

    const { data: assessment, error: assessmentError } = await query.limit(1).maybeSingle();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài đánh giá hoặc bài chưa được công bố' },
        { status: 404 }
      );
    }

    // 3. Server-Side Access Control: Check Free vs VIP/Premium Tier
    const isVipAssessment = Boolean(assessment.is_vip || assessment.access_tier === 'VIP');
    if (isVipAssessment) {
      const url = new URL(request.url);
      const assignmentId = url.searchParams.get('assignmentId') || url.searchParams.get('classAssignmentId');
      const campaignId = url.searchParams.get('campaignId');

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_tier, role, admin_role')
        .eq('id', user.id)
        .maybeSingle();

      const isPaidUser = profile?.plan_tier && profile.plan_tier !== 'FREE';
      const isPlatformStaff = profile?.role === 'ADMIN' || profile?.admin_role === 'SUPER_ADMIN';

      let hasAuthorizedAssignment = false;

      // Check if candidate is assigned through an active class assignment
      if (!isPaidUser && !isPlatformStaff && assignmentId) {
        const { data: assign } = await supabase
          .from('class_assignments')
          .select('id, class_id, assessment_id')
          .eq('id', assignmentId)
          .eq('assessment_id', assessment.id)
          .maybeSingle();

        if (assign) {
          const { data: member } = await supabase
            .from('class_members')
            .select('id')
            .eq('class_id', assign.class_id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (member) hasAuthorizedAssignment = true;
        }
      }

      // Check if candidate is assigned through an active organization campaign
      if (!isPaidUser && !isPlatformStaff && !hasAuthorizedAssignment && campaignId) {
        const { data: camp } = await supabase
          .from('assessment_campaigns')
          .select('id, organization_id, class_ids, assessment_id')
          .eq('id', campaignId)
          .eq('assessment_id', assessment.id)
          .maybeSingle();

        if (camp) {
          const { data: orgMember } = await supabase
            .from('user_organizations')
            .select('id')
            .eq('organization_id', camp.organization_id)
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .maybeSingle();

          if (orgMember) hasAuthorizedAssignment = true;
        }
      }

      if (!isPaidUser && !isPlatformStaff && !hasAuthorizedAssignment) {
        return NextResponse.json(
          {
            error: 'Bài khảo thí này thuộc phân hạng VIP / Premium. Vui lòng nâng cấp tài khoản để làm bài.',
            code: 'UPGRADE_REQUIRED',
          },
          { status: 403 }
        );
      }
    }

    // 4. Fetch questions and options via leak-proof RPC (Zero is_correct / explanation leaks)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_assessment_for_candidate', {
      p_assessment_id: assessment.id,
    });

    if (rpcError || !rpcData) {
      return NextResponse.json({ error: 'Không thể tải danh sách câu hỏi' }, { status: 500 });
    }

    return NextResponse.json({
      assessment: {
        ...assessment,
        ...((rpcData as { assessment?: Record<string, unknown> }).assessment || {}),
      },
      items: (rpcData as { items?: unknown[] }).items || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
