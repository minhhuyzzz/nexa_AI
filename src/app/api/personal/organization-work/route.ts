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

    // 3. Fetch assignments for these classes
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
        tasks = assignments.map((a: any) => {
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
