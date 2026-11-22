import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export const dynamic = 'force-dynamic';

const assignAssessmentSchema = z.object({
  assessmentId: z.string().uuid('ID bài đánh giá không hợp lệ'),
  customTitle: z.string().optional(),
  startTime: z.string().optional(),
  deadline: z.string().optional(),
  timezone: z.string().default('Asia/Ho_Chi_Minh'),
  allowLateSubmission: z.boolean().default(false),
  reminderBeforeHours: z.number().int().min(1).max(72).default(24),
  aiGradingEnabled: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  immediateResults: z.boolean().default(false),
  requireEvidence: z.boolean().default(false),
  allowedEvidenceTypes: z.array(z.string()).default(['PDF', 'DOCX', 'PPTX', 'XLSX']),
  maxEvidenceMb: z.number().int().min(1).max(200).default(50),
  estimatedAiCredits: z.number().int().min(0).default(0),
  securitySettings: z.record(z.any()).optional(),
});

async function checkOrgPermission(userId: string, userEmail: string | undefined, orgId: string) {
  const isSuper = isSuperadminEmail(userEmail);
  if (isSuper) return { isAllowed: true, isManager: true };

  const adminSupabase = createAdminClient();
  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!member) return { isAllowed: false, isManager: false };
  return {
    isAllowed: true,
    isManager: ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(member.org_role),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; classId: string }> }
) {
  try {
    const { orgId, classId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { isAllowed } = await checkOrgPermission(user.id, user.email, orgId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Bạn không thuộc tổ chức này' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: assignments, error } = await adminSupabase
      .from('class_assignments')
      .select(`
        id,
        assessment_id,
        deadline,
        start_time,
        timezone,
        allow_late_submission,
        reminder_before_hours,
        ai_grading_enabled,
        shuffle_questions,
        immediate_results,
        require_evidence,
        allowed_evidence_types,
        max_evidence_mb,
        estimated_ai_credits,
        status,
        created_at,
        assessments (
          id,
          title,
          description,
          duration_minutes,
          passing_score
        )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; classId: string }> }
) {
  try {
    const { orgId, classId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { isAllowed, isManager } = await checkOrgPermission(user.id, user.email, orgId);
    if (!isAllowed || !isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền giao đề khảo thí trong tổ chức này' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = assignAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const {
      assessmentId,
      customTitle,
      startTime,
      deadline,
      timezone,
      allowLateSubmission,
      reminderBeforeHours,
      aiGradingEnabled,
      shuffleQuestions,
      immediateResults,
      requireEvidence,
      allowedEvidenceTypes,
      maxEvidenceMb,
      estimatedAiCredits,
      securitySettings,
    } = parsed.data;

    // Check timeline consistency
    if (startTime && deadline) {
      if (new Date(startTime) >= new Date(deadline)) {
        return NextResponse.json(
          { error: 'Thời gian mở bài phải diễn ra trước hạn nộp bài' },
          { status: 400 }
        );
      }
    }

    const adminSupabase = createAdminClient();

    // Verify assessment exists and belongs to this organization
    const { data: assessment, error: assessErr } = await adminSupabase
      .from('assessments')
      .select('id, title, organization_id')
      .eq('id', assessmentId)
      .eq('organization_id', orgId)
      .single();

    if (assessErr || !assessment) {
      return NextResponse.json({ error: 'Không tìm thấy đề đánh giá của tổ chức' }, { status: 404 });
    }

    const finalCustomTitle =
      customTitle?.trim() ||
      (securitySettings as Record<string, any> | undefined)?.custom_title ||
      assessment.title;

    // Insert or update class assignment record without relying on dropped unique constraint
    const { data: existingAssignment } = await adminSupabase
      .from('class_assignments')
      .select('id')
      .eq('class_id', classId)
      .eq('assessment_id', assessmentId)
      .maybeSingle();

    const assignmentPayload = {
      class_id: classId,
      assessment_id: assessmentId,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      timezone,
      allow_late_submission: allowLateSubmission,
      reminder_before_hours: reminderBeforeHours,
      ai_grading_enabled: aiGradingEnabled,
      shuffle_questions: shuffleQuestions,
      immediate_results: immediateResults,
      require_evidence: requireEvidence,
      allowed_evidence_types: allowedEvidenceTypes,
      max_evidence_mb: maxEvidenceMb,
      estimated_ai_credits: estimatedAiCredits,
      security_settings: {
        ...(securitySettings || {}),
        custom_title: finalCustomTitle,
      },
      status: 'PUBLISHED',
    };

    let assignment;
    let insertError;

    if (existingAssignment) {
      const res = await adminSupabase
        .from('class_assignments')
        .update(assignmentPayload)
        .eq('id', existingAssignment.id)
        .select()
        .single();
      assignment = res.data;
      insertError = res.error;
    } else {
      const res = await adminSupabase
        .from('class_assignments')
        .insert(assignmentPayload)
        .select()
        .single();
      assignment = res.data;
      insertError = res.error;
    }

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Notify class students about the new assignment
    try {
      const { data: members } = await adminSupabase
        .from('class_members')
        .select('user_id')
        .eq('class_id', classId);

      if (members && members.length > 0) {
        const studentUserIds = members
          .map((m: any) => m.user_id)
          .filter((uid: string) => uid && uid !== user.id);

        if (studentUserIds.length > 0) {
          const deadlineText = deadline
            ? new Date(deadline).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : null;

          const notifRecords = studentUserIds.map((uid: string) => ({
            user_id: uid,
            title: 'Bài khảo thí mới được giao',
            message: `Lớp học của bạn có bài khảo thí mới: "${assessment.title}".${
              deadlineText ? ` Hạn nộp: ${deadlineText}.` : ''
            }`,
            category: 'ASSIGNMENT',
            link_url: `/personal/submissions`,
            is_read: false,
          }));

          const notifTable = adminSupabase.from('user_notifications');
          if (typeof notifTable?.insert === 'function') {
            await notifTable.insert(notifRecords);
          }
        }
      }
    } catch (notifErr) {
      console.warn('Lỗi gửi thông báo giao đề cho học viên:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Đã giao thành công bài "${finalCustomTitle}" cho lớp học`,
      assignment,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
