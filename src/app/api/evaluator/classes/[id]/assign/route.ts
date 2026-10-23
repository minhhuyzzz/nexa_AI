import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';

const assignAssessmentSchema = z.object({
  assessmentId: z.string().uuid('Mã bài khảo thí không hợp lệ'),
  deadline: z.string().datetime().optional().nullable(),
});

export async function POST(
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
      return NextResponse.json({ error: 'Bạn không có quyền giao đề cho nhóm này' }, { status: 403 });
    }

    const body: unknown = await req.json();
    const parsed = assignAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { assessmentId, deadline } = parsed.data;

    // Upsert class_assignment
    const { data: assignment, error: assignError } = await supabase
      .from('class_assignments')
      .upsert(
        {
          class_id: classId,
          assessment_id: assessmentId,
          deadline: deadline || null,
        },
        { onConflict: 'class_id,assessment_id' }
      )
      .select()
      .single();

    if (assignError || !assignment) {
      console.error('Error assigning assessment:', assignError);
      return NextResponse.json({ error: 'Không thể giao bài khảo thí' }, { status: 500 });
    }

    // Fetch assessment title for notification
    const { data: assessmentData } = await supabase
      .from('assessments')
      .select('title')
      .eq('id', assessmentId)
      .single();

    const assessmentTitle = assessmentData?.title || 'Bài khảo thí mới';
    const deadlineText = deadline
      ? new Date(deadline).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Không giới hạn';

    // Auto-create SYSTEM post on the class stream
    await supabase.from('class_posts').insert({
      class_id: classId,
      author_id: currentUser.id,
      post_type: 'SYSTEM',
      title: 'Đã giao bài khảo thí mới',
      content: `Đã giao bài khảo thí: "${assessmentTitle}". Hạn nộp: ${deadlineText}. Các bạn thành viên vui lòng hoàn thành đúng tiến độ.`,
      linked_assignment_id: assignment.id,
    });

    return NextResponse.json({ success: true, assignment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    console.error('Error in POST /api/evaluator/classes/[id]/assign:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
