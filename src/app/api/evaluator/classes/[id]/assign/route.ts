import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';

const assignAssessmentSchema = z.object({
  assessmentId: z.string().uuid('Mã bài khảo thí không hợp lệ'),
  deadline: z.string().datetime().optional().nullable(),
  customTitle: z.string().optional().nullable(),
  shuffleQuestions: z.boolean().optional(),
  immediateResults: z.boolean().optional(),
  allowLateSubmission: z.boolean().optional(),
  securitySettings: z.record(z.any()).optional(),
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

    const {
      assessmentId,
      deadline,
      customTitle,
      shuffleQuestions,
      immediateResults,
      allowLateSubmission,
      securitySettings,
    } = parsed.data;

    // Fetch assessment title first
    const { data: assessmentData } = await supabase
      .from('assessments')
      .select('title')
      .eq('id', assessmentId)
      .single();

    const finalTitle = customTitle?.trim() || assessmentData?.title || 'Bài khảo thí mới';
    const secSettings = {
      ...(securitySettings || {}),
      custom_title: finalTitle,
    };

    // Check if assignment exists
    const { data: existingAssignment } = await supabase
      .from('class_assignments')
      .select('id')
      .eq('class_id', classId)
      .eq('assessment_id', assessmentId)
      .maybeSingle();

    let assignment;
    let assignError;

    const assignmentPayload: Record<string, any> = {
      deadline: deadline || null,
      security_settings: secSettings,
    };
    if (shuffleQuestions !== undefined) assignmentPayload.shuffle_questions = Boolean(shuffleQuestions);
    if (immediateResults !== undefined) assignmentPayload.immediate_results = Boolean(immediateResults);
    if (allowLateSubmission !== undefined) assignmentPayload.allow_late_submission = Boolean(allowLateSubmission);

    if (existingAssignment) {
      const res = await supabase
        .from('class_assignments')
        .update(assignmentPayload)
        .eq('id', existingAssignment.id)
        .select()
        .single();
      assignment = res.data;
      assignError = res.error;
    } else {
      const res = await supabase
        .from('class_assignments')
        .insert({
          class_id: classId,
          assessment_id: assessmentId,
          deadline: deadline || null,
          shuffle_questions: Boolean(shuffleQuestions),
          immediate_results: Boolean(immediateResults),
          allow_late_submission: Boolean(allowLateSubmission),
          security_settings: secSettings,
        })
        .select()
        .single();
      assignment = res.data;
      assignError = res.error;
    }

    if (assignError || !assignment) {
      console.error('Error assigning assessment:', assignError);
      return NextResponse.json({ error: 'Không thể giao bài khảo thí' }, { status: 500 });
    }

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
      content: `Đã giao bài khảo thí: "${finalTitle}". Hạn nộp: ${deadlineText}. Các bạn thành viên vui lòng hoàn thành đúng tiến độ.`,
      linked_assignment_id: assignment.id,
    });

    // Notify all class members about the new assignment
    try {
      let adminClient: any = null;
      try {
        adminClient = createAdminClient();
      } catch {
        adminClient = supabase;
      }
      const db = adminClient || supabase;

      const { data: members } = await db
        .from('class_members')
        .select('user_id')
        .eq('class_id', classId);

      if (members && members.length > 0) {
        const studentUserIds = members
          .map((m: any) => m.user_id)
          .filter((uid: string) => uid && uid !== currentUser.id);

        if (studentUserIds.length > 0) {
          const notifRecords = studentUserIds.map((uid: string) => ({
            user_id: uid,
            title: 'Bài khảo thí mới được giao',
            message: `Nhóm học của bạn có bài khảo thí mới: "${finalTitle}". Hạn nộp: ${deadlineText}.`,
            category: 'ASSIGNMENT',
            link_url: '/personal/submissions',
            is_read: false,
          }));

          const notifTable = db.from('user_notifications');
          if (typeof notifTable?.insert === 'function') {
            await notifTable.insert(notifRecords);
          }
        }
      }
    } catch (notifErr) {
      console.warn('Lỗi ghi nhận thông báo bài tập mới cho nhóm:', notifErr);
    }

    return NextResponse.json({ success: true, assignment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    console.error('Error in POST /api/evaluator/classes/[id]/assign:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
