import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const isPreview = url.searchParams.get('preview') === 'true';
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
      .select('id, title, description, duration_minutes, passing_score, point_reward, is_vip, access_tier, organization_id, security_settings');

    if (!isPreview) {
      query = query.eq('is_published', true);
    }

    if (isBaseline) {
      query = query.or('is_system_baseline.eq.true,id.eq.a0000000-0000-0000-0000-000000000001');
    } else if (isUUID) {
      query = query.eq('id', id);
    }

    let { data: assessment, error: assessmentError } = await query.limit(1).maybeSingle();

    // Fallback in preview mode: query via admin client if draft / org RLS
    if ((assessmentError || !assessment) && isPreview) {
      try {
        const adminClient = createAdminClient();
        let adminQuery = adminClient
          .from('assessments')
          .select('id, title, description, duration_minutes, passing_score, point_reward, is_vip, access_tier, organization_id, security_settings');

        if (isBaseline) {
          adminQuery = adminQuery.or('is_system_baseline.eq.true,id.eq.a0000000-0000-0000-0000-000000000001');
        } else if (isUUID) {
          adminQuery = adminQuery.eq('id', id);
        }

        const adminRes = await adminQuery.limit(1).maybeSingle();
        if (adminRes.data) {
          assessment = adminRes.data;
          assessmentError = null;
        }
      } catch (adminErr) {
        console.warn('[PREVIEW_ADMIN_FALLBACK_WARN]:', adminErr);
      }
    }

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài đánh giá hoặc bài chưa được công bố' },
        { status: 404 }
      );
    }

    // 2b. Rule: Baseline assessment can only be taken ONCE per learner account (skipped in preview mode)
    const isBaselineAssessment = Boolean(
      isBaseline ||
      assessment.id === 'a0000000-0000-0000-0000-000000000001' ||
      assessment.title?.toLowerCase().includes('đầu vào')
    );

    if (isBaselineAssessment && !isPreview) {
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

    // 3. Server-Side Access Control: Check Free vs VIP/Premium Tier (skipped in preview mode)
    const isVipAssessment = Boolean(assessment.is_vip || assessment.access_tier === 'VIP');
    if (isVipAssessment && !isPreview) {
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

    // 4. Fetch questions and options
    let responseItems: any[] = [];

    // For regular exam takers, attempt the leak-proof RPC
    if (!isPreview) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_assessment_for_candidate', {
          p_assessment_id: assessment.id,
        });
        if (!rpcError && rpcData && Array.isArray((rpcData as any)?.items) && (rpcData as any).items.length > 0) {
          responseItems = (rpcData as any).items;
        }
      } catch (rpcErr) {
        console.warn('[GET_ASSESSMENT_RPC_ERR]', rpcErr);
      }
    }

    // Direct query fallback (or primary for preview mode / drafts)
    if (responseItems.length === 0) {
      const fetchClient = isPreview ? createAdminClient() : supabase;
      const { data: directItems, error: directError } = await fetchClient
        .from('assessment_items')
        .select(`
          id,
          prompt,
          points,
          type,
          order_index,
          difficulty_level,
          competency_id,
          scenario_context,
          rubric_guide,
          competencies (
            skill_code,
            title,
            competency_domains (
              code,
              title
            )
          ),
          item_options (
            id,
            content,
            order_index,
            is_correct,
            explanation
          )
        `)
        .eq('assessment_id', assessment.id)
        .order('order_index', { ascending: true });

      if (directError || !directItems || directItems.length === 0) {
        return NextResponse.json(
          { error: 'Bài khảo thí chưa có câu hỏi hoặc chưa được kích hoạt' },
          { status: directError ? 500 : 404 }
        );
      }

      responseItems = directItems.map((item: any) => ({
        ...item,
        options: (item.item_options || [])
          .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((opt: any) => ({
            id: opt.id,
            content: opt.content,
            order_index: opt.order_index,
            is_correct: isPreview ? opt.is_correct : undefined,
            explanation: isPreview ? opt.explanation : undefined,
          })),
      }));
    }

    const responseData = {
      assessment,
      items: responseItems,
    };
    console.log('[GET_ASSESSMENT_API_SUCCESS]:', {
      id,
      assessmentId: assessment.id,
      itemsCount: responseData.items.length,
      isPreview,
    });
    return NextResponse.json(responseData);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
