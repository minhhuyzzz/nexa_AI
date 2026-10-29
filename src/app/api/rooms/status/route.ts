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
        access_policy,
        proctoring_profile,
        scheduled_start,
        scheduled_end,
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
      .select('id, user_id, status, joined_at')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true });

    if (pError) {
      console.warn('Could not fetch room participants:', pError);
    }

    // 3. Fetch user profiles for participants
    const userIds = (participants || []).map((p) => p.user_id);
    let profilesMap: Record<string, { full_name?: string; avatar_url?: string }> = {};

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
      const fullName = pr?.full_name || 'Thí sinh ẩn danh';
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
        joinedAt: p.joined_at,
      };
    });

    const rawAssessment = Array.isArray(room.assessments) ? room.assessments[0] : room.assessments;
    const hasStarted = !!room.scheduled_start;
    const startedAt = room.scheduled_start;
    const durationMinutes = rawAssessment?.duration_minutes || 45;

    let elapsedSeconds = 0;
    if (startedAt) {
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
        roomMode: room.room_mode,
        isActive: room.is_active,
        isLocked: room.is_locked,
        accessPolicy: room.access_policy,
        proctoringProfile: room.proctoring_profile,
        hasStarted,
        startedAt,
        elapsedSeconds,
        totalSeconds: durationMinutes * 60,
        remainingSeconds: Math.max(0, durationMinutes * 60 - elapsedSeconds),
      },
      participants: formattedParticipants,
      participantCount: formattedParticipants.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { roomId, isLocked, isActive, hasStarted, proctoringProfile } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Thiếu mã định danh phòng thi (roomId)' }, { status: 400 });
    }

    const supabase = await createClient();

    // Authenticate and authorize evaluator / admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Verify room owner or admin/evaluator authority
    const { data: room } = await supabase
      .from('exam_rooms')
      .select('id, created_by, owner_user_id')
      .eq('id', roomId)
      .single();

    const isRoomOwner = room && (room.owner_user_id === user.id || room.created_by === user.id);
    const isPrivileged = profile?.role === 'ADMIN' || profile?.role === 'EVALUATOR';

    if (!isRoomOwner && !isPrivileged) {
      return NextResponse.json(
        { error: 'Bạn không có quyền điều phối phòng thi này' },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (typeof isLocked === 'boolean') updates.is_locked = isLocked;
    if (typeof isActive === 'boolean') updates.is_active = isActive;
    if (hasStarted === true) updates.scheduled_start = new Date().toISOString();
    if (proctoringProfile) updates.proctoring_profile = proctoringProfile;

    const { error: updateError } = await supabase
      .from('exam_rooms')
      .update(updates)
      .eq('id', roomId);

    if (updateError) {
      return NextResponse.json({ error: 'Không thể cập nhật trạng thái phòng thi' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: updates,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
