import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';

const patchClassSchema = z.object({
  name: z.string().trim().min(2, 'Tên nhóm phải có ít nhất 2 ký tự').max(100, 'Tên nhóm tối đa 100 ký tự').optional(),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
});

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

    // Verify evaluator access (or admin)
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
          profiles ( id, nickname, email, avatar_url )
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

    if (cls.evaluator_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bạn không có quyền quản lý nhóm này' }, { status: 403 });
    }

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
      const { data: subsData } = await supabase
        .from('assessment_submissions')
        .select('id, user_id, assessment_id, class_assignment_id, status, total_score, percentage, is_passed, submitted_at')
        .in('assessment_id', assessmentIds);
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
        memberCount: cls.class_members?.length || 0,
        assignmentCount: cls.class_assignments?.length || 0,
        members: cls.class_members || [],
        assignments: cls.class_assignments || [],
        submissions: realSubmissions,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // Verify class ownership
    const { data: cls, error: clsError } = await supabase
      .from('evaluator_classes')
      .select('id, evaluator_id')
      .eq('id', classId)
      .single();

    if (clsError || !cls) {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 });
    }

    if (cls.evaluator_id !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa nhóm này' }, { status: 403 });
    }

    const body: unknown = await req.json();
    const parsed = patchClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const updatePayload: { name?: string; description?: string } = {};
    if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
    if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description;

    const { data: updatedClass, error: updateError } = await supabase
      .from('evaluator_classes')
      .update(updatePayload)
      .eq('id', classId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Không thể cập nhật thông tin nhóm' }, { status: 500 });
    }

    return NextResponse.json({ success: true, group: updatedClass });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
