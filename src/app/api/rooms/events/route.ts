import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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

    // 3. Check if tab switching threshold is crossed to flag submission integrity
    if (submissionId && (eventType === 'TAB_HIDDEN' || eventType === 'FULLSCREEN_EXIT')) {
      const { count } = await supabase
        .from('proctoring_events')
        .select('id', { count: 'exact', head: true })
        .eq('submission_id', submissionId)
        .in('event_type', ['TAB_HIDDEN', 'FULLSCREEN_EXIT']);

      if ((count || 0) >= 2) {
        await supabase
          .from('assessment_submissions')
          .update({
            integrity_flag: 'TAB_SWITCH_SUSPICIOUS',
          })
          .eq('id', submissionId);
      }
    }

    return NextResponse.json({
      success: true,
      eventId: eventRecord.id,
      timestamp: eventRecord.created_at,
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

    if (!profile || (profile.role !== 'EVALUATOR' && profile.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Chỉ Giám thị hoặc Quản trị viên mới có quyền xem dòng sự kiện giám sát' },
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
