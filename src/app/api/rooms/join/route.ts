import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const joinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'Mã PIN phòng thi phải gồm đúng 6 chữ số'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = joinSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Mã PIN không hợp lệ' },
        { status: 400 }
      );
    }

    const { pin } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để vào phòng thi' }, { status: 401 });
    }

    // 2. Find active room with this PIN
    const { data: room, error: roomError } = await supabase
      .from('exam_rooms')
      .select(`
        id,
        room_code,
        title,
        assessment_id,
        room_mode,
        is_active,
        is_locked,
        status,
        allow_late_join,
        started_at,
        access_policy,
        proctoring_profile,
        class_id,
        organization_id,
        scheduled_start,
        theme_id,
        results_publish_settings,
        assessments (
          id,
          title,
          duration_minutes,
          passing_score
        )
      `)
      .eq('room_code', pin)
      .eq('is_active', true)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Mã PIN phòng thi không tồn tại hoặc phòng thi đã đóng' },
        { status: 404 }
      );
    }

    // 3. Enforce Server-Side Room Lockdown
    if (room.is_locked) {
      return NextResponse.json(
        {
          error: 'Phòng thi đã bị khóa bởi Giám thị, không nhận thêm thí sinh mới.',
          code: 'ROOM_LOCKED',
        },
        { status: 403 }
      );
    }

    const isExamRunning = room.status === 'IN_PROGRESS' || Boolean(room.started_at);

    // 3.1 Enforce Late Join Lockdown if room has already started
    if (isExamRunning && room.allow_late_join === false) {
      return NextResponse.json(
        {
          error: 'Ca thi đã bắt đầu và không cho phép thí sinh vào muộn.',
          code: 'LATE_JOIN_BLOCKED',
        },
        { status: 403 }
      );
    }

    // 4. Enforce Group / Class Membership if room is bound to a class
    if (room.class_id) {
      const { data: membership } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', room.class_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          {
            error: 'Phòng thi này chỉ dành cho học viên thuộc lớp/nhóm được chỉ định.',
            code: 'GROUP_RESTRICTED',
          },
          { status: 403 }
        );
      }
    }

    // 5. Record participation in room_participants
    const participantStatus = isExamRunning ? 'TAKING' : 'JOINED';

    await supabase
      .from('room_participants')
      .upsert(
        {
          room_id: room.id,
          user_id: user.id,
          status: participantStatus,
        },
        { onConflict: 'room_id,user_id' }
      );

    const rawAssessment = Array.isArray(room.assessments) ? room.assessments[0] : room.assessments;
    const publishSettings = (typeof room.results_publish_settings === 'object' && room.results_publish_settings !== null)
      ? (room.results_publish_settings as any)
      : {};
    const durationMinutes =
      Number(publishSettings?.duration_minutes) ||
      rawAssessment?.duration_minutes ||
      45;

    return NextResponse.json({
      success: true,
      roomId: room.id,
      roomCode: room.room_code,
      roomTitle: room.title,
      assessmentId: room.assessment_id,
      assessmentTitle: rawAssessment?.title || 'Bài thi khảo thí',
      durationMinutes,
      themeId: room.theme_id || 'minimal_white',
      hasStarted: isExamRunning,
      startedAt: room.started_at || null,
      isLocked: room.is_locked,
      accessPolicy: room.access_policy,
      proctoringProfile: room.proctoring_profile,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
