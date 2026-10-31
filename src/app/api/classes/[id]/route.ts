import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { verifyClassAccess } from '@/lib/classes/access';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const access = await verifyClassAccess(supabase, classId, currentUser.id, currentUser.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Bạn không thuộc nhóm này' }, { status: 403 });
    }

    const { data: cls, error: clsError } = await supabase
      .from('evaluator_classes')
      .select(`
        id,
        evaluator_id,
        name,
        class_code,
        description,
        created_at,
        class_members (
          id,
          user_id,
          joined_at,
          profiles ( id, nickname, email, avatar_url, role )
        ),
        class_assignments (
          id,
          assessment_id,
          deadline,
          created_at,
          assessments ( id, title, duration_minutes, passing_score )
        )
      `)
      .eq('id', classId)
      .single();

    if (clsError || !cls) {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 });
    }

    // Filter member emails if the caller is a learner (privacy)
    const members = (cls.class_members || []).map((m) => {
      const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        id: m.id,
        user_id: m.user_id,
        joined_at: m.joined_at,
        profiles: {
          id: prof?.id || m.user_id,
          nickname: prof?.nickname || 'Thành viên',
          avatar_url: prof?.avatar_url,
          role: prof?.role,
          email: access.isEvaluator ? prof?.email : undefined,
        },
      };
    });

    // Fetch real submissions for assignments in this cohort
    const assessmentIds = (cls.class_assignments || []).map((a: { assessment_id: string }) => a.assessment_id);
    let realSubmissions: Array<{
      id: string;
      user_id: string;
      assessment_id: string;
      class_assignment_id?: string | null;
      status: string;
      total_score?: number | null;
      percentage?: number | null;
      is_passed?: boolean | null;
      submitted_at?: string | null;
    }> = [];

    if (assessmentIds.length > 0) {
      let subQuery = supabase
        .from('assessment_submissions')
        .select('id, user_id, assessment_id, class_assignment_id, status, total_score, percentage, is_passed, submitted_at')
        .in('assessment_id', assessmentIds);

      if (!access.isEvaluator && currentUser.role !== 'ADMIN') {
        subQuery = subQuery.eq('user_id', currentUser.id);
      }

      const { data: subsData } = await subQuery;
      realSubmissions = (subsData as typeof realSubmissions) || [];
    }

    return NextResponse.json({
      group: {
        id: cls.id,
        evaluatorId: cls.evaluator_id,
        name: cls.name,
        code: cls.class_code,
        description: cls.description || '',
        createdAt: cls.created_at,
        memberCount: members.length,
        assignmentCount: cls.class_assignments?.length || 0,
        members,
        assignments: cls.class_assignments || [],
        submissions: realSubmissions,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
