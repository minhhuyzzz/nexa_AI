import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch user active organization memberships
    const { data: userOrgs, error: orgErr } = await adminSupabase
      .from('user_organizations')
      .select('organization_id, org_role, organizations ( id, name, slug, code )')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE');

    if (orgErr || !userOrgs || userOrgs.length === 0) {
      return NextResponse.json({
        success: true,
        hasOrganization: false,
        organization: null,
        tasks: [],
      });
    }

    const primaryOrg = (userOrgs[0].organizations as any);
    const orgIds = userOrgs.map((uo) => uo.organization_id);

    // 2. Fetch classes that user belongs to in these organizations
    const { data: classMemberships } = await adminSupabase
      .from('class_members')
      .select(`
        class_id,
        role_in_class,
        sub_group,
        evaluator_classes!inner (
          id,
          name,
          organization_id
        )
      `)
      .eq('user_id', user.id)
      .in('evaluator_classes.organization_id', orgIds);

    const classIds = (classMemberships || []).map((cm) => cm.class_id);

    // 3. Fetch submissions already done by this user
    const { data: userSubmissions } = await adminSupabase
      .from('assessment_submissions')
      .select('id, assessment_id, status, total_score')
      .eq('user_id', user.id);

    const completedAssessmentIds = new Set(
      (userSubmissions || [])
        .filter((s) => s.status === 'EVALUATED' || s.status === 'SUBMITTED')
        .map((s) => s.assessment_id)
    );

    // 4. Fetch assignments for these classes
    let tasks: Array<{
      id: string;
      title: string;
      assessmentId: string;
      orgName: string;
      className: string;
      deadline?: string | null;
      durationMinutes: number;
      status: string;
      actionUrl: string;
    }> = [];

    if (classIds.length > 0) {
      const { data: assignments } = await adminSupabase
        .from('class_assignments')
        .select(`
          id,
          assessment_id,
          class_id,
          deadline,
          status,
          evaluator_classes ( id, name, organization_id, organizations ( name ) ),
          assessments ( id, title, duration_minutes )
        `)
        .in('class_id', classIds)
        .eq('status', 'PUBLISHED')
        .order('deadline', { ascending: true });

      if (assignments) {
        tasks = assignments
          .filter((a: any) => a.assessment_id && !completedAssessmentIds.has(a.assessment_id))
          .map((a: any) => {
            const assm = a.assessments;
            const cls = a.evaluator_classes;
            const orgName = cls?.organizations?.name || primaryOrg?.name || 'Tổ chức của bạn';
            return {
              id: a.id,
              title: assm?.title || 'Bài đánh giá năng lực số',
              assessmentId: a.assessment_id,
              orgName,
              className: cls?.name || 'Lớp của bạn',
              deadline: a.deadline,
              durationMinutes: assm?.duration_minutes || 45,
              status: 'Chưa bắt đầu',
              actionUrl: `/personal/take?assessmentId=${a.assessment_id}&assignmentId=${a.id}`,
            };
          });
      }
    }

    // 5. Fetch active assessment campaigns for user's organizations
    const { data: activeCampaigns } = await adminSupabase
      .from('assessment_campaigns')
      .select(`
        id,
        title,
        status,
        ends_at,
        class_ids,
        organization_id,
        assessments ( id, title, duration_minutes ),
        organizations ( id, name )
      `)
      .in('organization_id', orgIds)
      .eq('status', 'ACTIVE')
      .order('ends_at', { ascending: true });

    if (activeCampaigns) {
      for (const camp of activeCampaigns) {
        const assm = (camp.assessments as any);
        if (!assm?.id || completedAssessmentIds.has(assm.id)) continue;

        // Check if student is targeted (either campaign targets whole org or student's class)
        const targetClasses: string[] = Array.isArray(camp.class_ids) ? camp.class_ids : [];
        const isTargeted =
          targetClasses.length === 0 ||
          targetClasses.some((tId) => classIds.includes(tId));

        if (isTargeted) {
          const orgName = (camp.organizations as any)?.name || primaryOrg?.name || 'Tổ chức';
          tasks.push({
            id: `camp_${camp.id}`,
            title: camp.title || assm.title || 'Đợt khảo thí',
            assessmentId: assm.id,
            orgName,
            className: 'Đợt khảo thí tổ chức',
            deadline: camp.ends_at,
            durationMinutes: assm.duration_minutes || 45,
            status: 'Đang diễn ra',
            actionUrl: `/personal/take?assessmentId=${assm.id}&campaignId=${camp.id}`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      hasOrganization: true,
      organization: primaryOrg,
      tasks,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
