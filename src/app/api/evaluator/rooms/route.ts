import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const createRoomSchema = z.object({
  title: z.string().min(3, 'Tên phòng thi tối thiểu 3 ký tự'),
  assessmentId: z.string().uuid('Mã đề thi không hợp lệ'),
  roomMode: z.enum(['OPEN', 'GROUP_ONLY']).default('OPEN'),
});

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch rooms created by this evaluator
    const { data: rooms, error } = await supabase
      .from('exam_rooms')
      .select(`
        id,
        room_code,
        title,
        assessment_id,
        room_mode,
        is_active,
        created_at,
        assessments (
          title,
          duration_minutes,
          passing_score
        ),
        room_participants (
          id,
          user_id,
          status,
          joined_at
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching exam rooms:', error);
      return NextResponse.json({ error: 'Không thể tải danh sách phòng thi' }, { status: 500 });
    }

    const formattedRooms = (rooms || []).map((r) => ({
      id: r.id,
      roomCode: r.room_code,
      title: r.title,
      assessmentId: r.assessment_id,
      // @ts-expect-error join
      assessmentTitle: r.assessments?.title || 'Đề khảo thí',
      // @ts-expect-error join
      durationMinutes: r.assessments?.duration_minutes || 45,
      roomMode: r.room_mode,
      isActive: r.is_active,
      createdAt: r.created_at,
      participantCount: r.room_participants?.length || 0,
    }));

    return NextResponse.json({ rooms: formattedRooms });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createRoomSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { title, assessmentId, roomMode } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Generate unique 6-digit numeric PIN (e.g. '839210')
    let roomCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      attempts++;
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: existing } = await supabase
        .from('exam_rooms')
        .select('id')
        .eq('room_code', pin)
        .single();

      if (!existing) {
        roomCode = pin;
        isUnique = true;
      }
    }

    if (!roomCode) {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 3. Insert into exam_rooms
    const { data: newRoom, error: insertError } = await supabase
      .from('exam_rooms')
      .insert({
        room_code: roomCode,
        assessment_id: assessmentId,
        created_by: user.id,
        title,
        room_mode: roomMode,
        is_active: true,
      })
      .select(`
        id,
        room_code,
        title,
        assessment_id,
        room_mode,
        is_active,
        created_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating exam room:', insertError);
      return NextResponse.json({ error: 'Không thể tạo phòng thi trực tiếp' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      room: {
        id: newRoom.id,
        roomCode: newRoom.room_code,
        title: newRoom.title,
        assessmentId: newRoom.assessment_id,
        roomMode: newRoom.room_mode,
        isActive: newRoom.is_active,
        createdAt: newRoom.created_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
