import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { calculateTrustScore, ProctoringViolationEvent, ViolationType } from '@/features/assessments/types/security.types';

const proctoringEventSchema = z.object({
  roomId: z.string().uuid('Mã phòng thi không hợp lệ'),
  submissionId: z.string().uuid('Mã bài thi không hợp lệ').optional().nullable(),
  eventType: z.enum([
    'TAB_HIDDEN',
    'FULLSCREEN_EXIT',
    'FOCUS_LOST',
    'DEVTOOLS_OPENED',
    'RECONNECT',
    'WINDOW_RESIZE',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  details: z.record(z.unknown()).default({}),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = proctoringEventSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu sự kiện không hợp lệ' },
        { status: 400 }
      );
    }

    const { roomId, submissionId, eventType, severity, details } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate candidate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Insert proctoring event
    const { data: eventRecord, error: insertError } = await supabase
      .from('proctoring_events')
      .insert({
        room_id: roomId,
        user_id: user.id,
        submission_id: submissionId || null,
        event_type: eventType,
        severity,
        details,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Error inserting proctoring event:', insertError);
      return NextResponse.json({ error: 'Không thể ghi nhận sự kiện giám sát' }, { status: 500 });
    }

    // 3. Chuẩn hóa tính toán Trust Score và cờ liêm chính theo Layer 8
    let updatedTrustScore = 100;
    let updatedIntegrityFlag: 'HIGH_TRUST' | 'SUSPICIOUS' | 'FLAGGED' = 'HIGH_TRUST';

    if (submissionId) {
      // Tải toàn bộ các sự kiện giám sát đã ghi nhận của bài nộp này
      const { data: allEvents } = await supabase
        .from('proctoring_events')
        .select('id, event_type, severity, details, created_at')
        .eq('submission_id', submissionId);

      const mappedEvents: ProctoringViolationEvent[] = (allEvents || []).map((e) => {
        let vType: ViolationType = 'TAB_SWITCH';
        if (e.event_type === 'FULLSCREEN_EXIT') vType = 'FULLSCREEN_EXIT';
        else if (e.event_type === 'DEVTOOLS_OPENED') vType = 'DEVTOOLS_ATTEMPT';
        else if (e.event_type === 'COPY_ATTEMPT') vType = 'COPY_ATTEMPT';

        const d = (e.details as Record<string, any>) || {};
        return {
          id: e.id,
          type: vType,
          timestamp: e.created_at,
          durationSeconds: typeof d.durationSeconds === 'number' ? d.durationSeconds : undefined,
          details: typeof d.message === 'string' ? d.message : undefined,
        };
      });

      const { data: subData } = await supabase
        .from('assessment_submissions')
        .select('id, assessment_id, assessments ( security_settings )')
        .eq('id', submissionId)
        .single();

      const rawAssessment = Array.isArray(subData?.assessments) ? subData?.assessments[0] : subData?.assessments;
      const settings = (rawAssessment as any)?.security_settings || {};

      const trustResult = calculateTrustScore(mappedEvents, settings);
      updatedTrustScore = trustResult.trustScore;
      updatedIntegrityFlag = trustResult.integrityFlag;

      await supabase
        .from('assessment_submissions')
        .update({
          integrity_flag: updatedIntegrityFlag,
          proctoring_summary: {
            trustScore: trustResult.trustScore,
            integrityFlag: trustResult.integrityFlag,
            totalViolations: mappedEvents.length,
            tabSwitchesCount: trustResult.tabSwitchesCount,
            fullscreenExitsCount: trustResult.fullscreenExitsCount,
            copyAttemptsCount: trustResult.copyAttemptsCount,
            devtoolsAttemptsCount: trustResult.devtoolsAttemptsCount,
            totalTimeOutOfFocusSeconds: trustResult.totalTimeOutOfFocusSeconds,
            events: mappedEvents,
            activeWarningMode: settings.active_warning ?? true,
            submittedAt: new Date().toISOString(),
          },
        })
        .eq('id', submissionId);
    }

    return NextResponse.json({
      success: true,
      eventId: eventRecord.id,
      timestamp: eventRecord.created_at,
      trustScore: updatedTrustScore,
      integrityFlag: updatedIntegrityFlag,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const submissionId = searchParams.get('submissionId');

    if (!roomId && !submissionId) {
      return NextResponse.json({ error: 'Cần cung cấp roomId hoặc submissionId' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify evaluator or admin role
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

    // Verify room owner or admin/evaluator
    if (roomId) {
      const { data: room } = await supabase
        .from('exam_rooms')
        .select('id, created_by, owner_user_id')
        .eq('id', roomId)
        .single();

      const isRoomOwner = room && (room.owner_user_id === user.id || room.created_by === user.id);
      const isPrivileged = profile?.role === 'ADMIN' || profile?.role === 'EVALUATOR';

      if (!isRoomOwner && !isPrivileged) {
        return NextResponse.json(
          { error: 'Bạn không có quyền xem dòng sự kiện giám sát của phòng thi này' },
          { status: 403 }
        );
      }
    } else if (profile?.role !== 'ADMIN' && profile?.role !== 'EVALUATOR') {
      return NextResponse.json(
        { error: 'Chỉ Giám thị hoặc Quản trị viên mới có quyền xem toàn bộ dòng sự kiện' },
        { status: 403 }
      );
    }

    let query = supabase
      .from('proctoring_events')
      .select(`
        id,
        room_id,
        user_id,
        submission_id,
        event_type,
        severity,
        details,
        created_at,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (roomId) query = query.eq('room_id', roomId);
    if (submissionId) query = query.eq('submission_id', submissionId);

    const { data: events, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: 'Không thể tải sự kiện giám sát' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      events: (events || []).map((e) => {
        const rawProfile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
        return {
          id: e.id,
          roomId: e.room_id,
          userId: e.user_id,
          userName: rawProfile?.full_name || 'Thí sinh',
          userEmail: rawProfile?.email || '',
          submissionId: e.submission_id,
          eventType: e.event_type,
          severity: e.severity,
          details: e.details,
          createdAt: e.created_at,
        };
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
