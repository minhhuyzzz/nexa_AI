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
        settings,
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

    // Fetch evaluator name
    let evaluatorName = 'Quản trị viên';
    if (cls.evaluator_id) {
      const { data: evalProf } = await supabase
        .from('profiles')
        .select('full_name, nickname')
        .eq('id', cls.evaluator_id)
        .maybeSingle();
      if (evalProf) {
        evaluatorName = evalProf.full_name || evalProf.nickname || 'Quản trị viên';
      }
    }

    // Fetch active live room for this class if any
    let activeLiveRoom: any = null;
    try {
      const roomQuery = supabase
        .from('live_rooms')
        .select('id, room_code, title, status, duration_minutes, scheduled_start');

      if (typeof (roomQuery as any)?.eq === 'function') {
        let q = (roomQuery as any).eq('class_id', classId);
        if (typeof q?.in === 'function') {
          q = q.in('status', ['WAITING', 'IN_PROGRESS']);
        }
        if (typeof q?.order === 'function') {
          q = q.order('created_at', { ascending: false });
        }
        if (typeof q?.limit === 'function') {
          q = q.limit(1);
        }
        if (typeof q?.maybeSingle === 'function') {
          const { data: roomData } = await q.maybeSingle();
          activeLiveRoom = roomData;
        } else if (typeof q?.single === 'function') {
          const { data: roomData } = await q.single();
          activeLiveRoom = roomData;
        }
      }
    } catch {
      // Non-blocking resilient query
    }

    return NextResponse.json({
      group: {
        id: cls.id,
        evaluatorId: cls.evaluator_id,
        evaluatorName,
        name: cls.name,
        code: cls.class_code,
        description: cls.description || '',
        createdAt: cls.created_at,
        memberCount: members.length,
        assignmentCount: cls.class_assignments?.length || 0,
        settings: cls.settings || { allow_member_posts: true },
        members,
        assignments: cls.class_assignments || [],
        submissions: realSubmissions,
        activeLiveRoom: activeLiveRoom
          ? {
              id: activeLiveRoom.id,
              roomCode: activeLiveRoom.room_code,
              title: activeLiveRoom.title,
              status: activeLiveRoom.status,
              durationMinutes: activeLiveRoom.duration_minutes,
            }
          : null,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: cls } = await supabase
      .from('evaluator_classes')
      .select('id, evaluator_id')
      .eq('id', classId)
      .single();

    if (!cls) {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 });
    }

    // Only Owner or Admin can update class settings
    if (cls.evaluator_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa nhóm này' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const updatePayload: Record<string, any> = {};

    if (typeof body.name === 'string' && body.name.trim().length >= 2) {
      updatePayload.name = body.name.trim();
    }
    if (typeof body.description === 'string') {
      updatePayload.description = body.description.trim();
    }
    if (body.regenerateCode === true) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      updatePayload.class_code = `CLS-${rand}`;
    }
    if (typeof body.allowMemberPosts === 'boolean') {
      const { data: currentCls } = await supabase
        .from('evaluator_classes')
        .select('settings')
        .eq('id', classId)
        .single();
      const prevSettings = (currentCls?.settings as Record<string, any>) || {};
      updatePayload.settings = { ...prevSettings, allow_member_posts: body.allowMemberPosts };
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'Không có dữ liệu hợp lệ để cập nhật' }, { status: 400 });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('evaluator_classes')
      .update(updatePayload)
      .eq('id', classId)
      .select('id, name, class_code, description')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: 'Cập nhật thất bại: ' + updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật thông tin lớp học thành công',
      class: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: cls } = await supabase
      .from('evaluator_classes')
      .select('id, evaluator_id')
      .eq('id', classId)
      .single();

    if (!cls) {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 });
    }

    if (cls.evaluator_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ người quản lý mới có quyền xóa nhóm này' }, { status: 403 });
    }

    const { error: delErr } = await supabase
      .from('evaluator_classes')
      .delete()
      .eq('id', classId);

    if (delErr) {
      return NextResponse.json({ error: 'Xóa nhóm thất bại: ' + delErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa nhóm thành công',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
