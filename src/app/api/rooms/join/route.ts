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

    // 3. Record participation in room_participants
    await supabase
      .from('room_participants')
      .upsert(
        {
          room_id: room.id,
          user_id: user.id,
          status: 'JOINED',
        },
        { onConflict: 'room_id,user_id' }
      );

    const rawAssessment = Array.isArray(room.assessments) ? room.assessments[0] : room.assessments;

    return NextResponse.json({
      success: true,
      roomId: room.id,
      roomCode: room.room_code,
      roomTitle: room.title,
      assessmentId: room.assessment_id,
      assessmentTitle: rawAssessment?.title || 'Bài thi khảo thí',
      durationMinutes: rawAssessment?.duration_minutes || 45,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
