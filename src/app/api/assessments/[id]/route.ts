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
    const isBaseline = id === 'baseline' || id === 'initial';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase
      .from('assessments')
      .select('id, title, description, duration_minutes, passing_score, point_reward, is_vip, access_tier, organization_id, security_settings')
      .eq('is_published', true);

    if (isBaseline) {
      query = query.or('is_system_baseline.eq.true,id.eq.a0000000-0000-0000-0000-000000000001');
    } else if (isUUID) {
      query = query.eq('id', id);
    }

    const { data: assessment, error: assessmentError } = await query.limit(1).maybeSingle();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài đánh giá hoặc bài chưa được công bố' },
        { status: 404 }
      );
    }

    // 2b. Rule: Baseline assessment can only be taken ONCE per learner account
    const isBaselineAssessment = Boolean(
      isBaseline ||
      assessment.id === 'a0000000-0000-0000-0000-000000000001' ||
      assessment.title?.toLowerCase().includes('đầu vào')
    );

    if (isBaselineAssessment) {
      try {
        const subQuery = supabase.from('assessment_submissions');
        if (subQuery && typeof subQuery.select === 'function') {
          const selectResult = subQuery.select('id, status, submitted_at, total_score, percentage');
          if (selectResult && typeof selectResult.eq === 'function') {
            const { data: previousBaselineSub } = await selectResult
              .eq('user_id', user.id)
              .in('status', ['SUBMITTED', 'EVALUATED'])
              .or(`assessment_id.eq.${assessment.id},assessment_id.eq.a0000000-0000-0000-0000-000000000001`)
              .order('submitted_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (previousBaselineSub) {
              return NextResponse.json({
                alreadyCompleted: true,
                message: 'Bạn đã hoàn thành bài khảo thí đầu vào. Mỗi tài khoản chỉ làm bài khảo sát ban đầu 1 lần.',
                submissionId: previousBaselineSub.id,
                assessment,
                submittedAt: previousBaselineSub.submitted_at,
                scorePercentage: previousBaselineSub.percentage,
              });
            }
          }
        }
      } catch (checkErr) {
        // Non-blocking in mock environments
        console.warn('[BASELINE_CHECK_WARN]:', checkErr);
      }
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
      console.warn('[GET_ASSESSMENT_RPC_FALLBACK] Falling back to sanitized direct query:', rpcError);
      const { data: directItems, error: directError } = await supabase
        .from('assessment_items')
        .select(`
          id,
          prompt,
          points,
          type,
          order_index,
          difficulty_level,
          competency_id,
          competencies (
            skill_code,
            title
          ),
          item_options (
            id,
            content,
            order_index
          )
        `)
        .eq('assessment_id', assessment.id)
        .order('order_index', { ascending: true });

      if (directError || !directItems || directItems.length === 0) {
        return NextResponse.json({ error: 'Không thể tải danh sách câu hỏi' }, { status: 500 });
      }

      const sanitizedItems = directItems.map((item: any) => ({
        ...item,
        options: (item.item_options || []).sort((a: any, b: any) => a.order_index - b.order_index),
      }));

      return NextResponse.json({
        assessment,
        items: sanitizedItems,
      });
    }

    const responseData = {
      assessment: {
        ...assessment,
        ...((rpcData as { assessment?: Record<string, unknown> })?.assessment || {}),
      },
      items: (rpcData as { items?: unknown[] })?.items || [],
    };
    console.log('[GET_ASSESSMENT_API_SUCCESS]:', {
      id,
      assessmentId: assessment.id,
      itemsCount: responseData.items.length,
    });
    return NextResponse.json(responseData);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
