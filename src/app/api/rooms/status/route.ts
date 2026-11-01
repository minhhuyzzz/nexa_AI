import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const pin = searchParams.get('pin');

    if (!roomId && !pin) {
      return NextResponse.json(
        { error: 'Cần cung cấp roomId hoặc mã PIN phòng thi' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch room
    let query = supabase
      .from('exam_rooms')
      .select(`
        id,
        room_code,
        title,
        assessment_id,
        room_mode,
        is_active,
        is_locked,
        theme_id,
        status,
        allow_late_join,
        auto_submit_on_timeout,
        show_pin,
        system_notifications_enabled,
        results_published,
        results_publish_settings,
        max_participants,
        room_description,
        access_policy,
        proctoring_profile,
        scheduled_start,
        scheduled_end,
        started_at,
        ended_at,
        created_at,
        assessments (
          id,
          title,
          duration_minutes,
          passing_score
        )
      `);

    if (roomId) {
      query = query.eq('id', roomId);
    } else if (pin) {
      query = query.eq('room_code', pin);
    }

    const { data: room, error: roomError } = await query.single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng thi hoặc phòng thi đã kết thúc' },
        { status: 404 }
      );
    }

    // 2. Fetch participants for this room
    const { data: participants, error: pError } = await supabase
      .from('room_participants')
      .select(`
        id,
        user_id,
        status,
        is_ready,
        ready_at,
        connection_status,
        score,
        submitted_at,
        answers_count,
        total_questions,
        joined_at
      `)
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true });

    if (pError) {
      console.warn('Could not fetch room participants:', pError);
    }

    // 3. Fetch user profiles for participants
    const userIds = (participants || []).map((p) => p.user_id);
    let profilesMap: Record<string, { full_name?: string; avatar_url?: string; student_code?: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map((pr) => [pr.id, pr]));
      }
    }

    const formattedParticipants = (participants || []).map((p) => {
      const pr = profilesMap[p.user_id];
      const fullName = pr?.full_name || 'Thí sinh';
      const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0].toUpperCase())
        .join('');

      return {
        id: p.id,
        userId: p.user_id,
        fullName,
        initials: initials || 'TS',
        avatarUrl: pr?.avatar_url || null,
        status: p.status,
        isReady: p.is_ready || false,
        readyAt: p.ready_at,
        connectionStatus: p.connection_status || 'ONLINE',
        score: p.score,
        submittedAt: p.submitted_at,
        answersCount: p.answers_count || 0,
        totalQuestions: p.total_questions || 0,
        joinedAt: p.joined_at,
      };
    });

    const rawAssessment = Array.isArray(room.assessments) ? room.assessments[0] : room.assessments;
    const hasStarted = room.status === 'IN_PROGRESS' || !!room.started_at || !!room.scheduled_start;
    const startedAt = room.started_at || room.scheduled_start;
    const durationMinutes = rawAssessment?.duration_minutes || 45;

    let elapsedSeconds = 0;
    if (startedAt && (room.status === 'IN_PROGRESS' || !room.status)) {
      elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        roomCode: room.room_code,
        title: room.title,
        assessmentId: room.assessment_id,
        assessmentTitle: rawAssessment?.title || 'Bài thi khảo thí',
        durationMinutes,
        passingScore: rawAssessment?.passing_score || 70,
        roomMode: room.room_mode,
        isActive: room.is_active,
        isLocked: room.is_locked,
        themeId: room.theme_id || 'minimal_white',
        status: room.status || (room.is_active ? (hasStarted ? 'IN_PROGRESS' : 'WAITING') : 'ENDED'),
        allowLateJoin: room.allow_late_join ?? false,
        autoSubmitOnTimeout: room.auto_submit_on_timeout ?? true,
        showPin: room.show_pin ?? true,
        systemNotificationsEnabled: room.system_notifications_enabled ?? true,
        resultsPublished: room.results_published ?? false,
        resultsPublishSettings: room.results_publish_settings || {
          show_score: true,
          show_ranking: true,
          show_answers: false,
          scope: 'ALL',
        },
        maxParticipants: room.max_participants || 40,
        roomDescription: room.room_description || '',
        accessPolicy: room.access_policy,
        proctoringProfile: room.proctoring_profile,
        hasStarted,
        startedAt,
        scheduledStart: room.scheduled_start,
        elapsedSeconds,
        totalSeconds: durationMinutes * 60,
        remainingSeconds: Math.max(0, durationMinutes * 60 - elapsedSeconds),
      },
      participants: formattedParticipants,
      participantCount: formattedParticipants.length,
      readyCount: formattedParticipants.filter((p) => p.isReady).length,
      submittedCount: formattedParticipants.filter((p) => p.status === 'SUBMITTED').length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { roomId, isLocked, isActive, status, proctoringProfile, themeId } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Thiếu mã định danh phòng thi (roomId)' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const updateData: Record<string, any> = {};
    if (typeof isLocked === 'boolean') updateData.is_locked = isLocked;
    if (typeof isActive === 'boolean') updateData.is_active = isActive;
    if (status) updateData.status = status;
    if (proctoringProfile) updateData.proctoring_profile = proctoringProfile;
    if (themeId) updateData.theme_id = themeId;

    const { data: updatedRoom, error: updateError } = await supabase
      .from('exam_rooms')
      .update(updateData)
      .eq('id', roomId)
      .eq('created_by', user.id)
      .select()
      .single();

    if (updateError || !updatedRoom) {
      return NextResponse.json(
        { error: 'Không thể cập nhật cấu hình phòng thi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room: updatedRoom,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
