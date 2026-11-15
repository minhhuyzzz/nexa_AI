import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const leaveSchema = z.object({
  roomId: z.string().uuid().optional(),
  pin: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      const rawText = await request.text();
      if (rawText) {
        body = JSON.parse(rawText);
      }
    } catch {
      body = {};
    }

    const validated = leaveSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const { roomId, pin } = validated.data;
    if (!roomId && !pin) {
      return NextResponse.json({ error: 'Cần cung cấp roomId hoặc mã PIN' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Resolve room ID
    let targetRoomId = roomId;
    let roomStatus = 'WAITING';

    if (!targetRoomId && pin) {
      const { data: room } = await admin
        .from('exam_rooms')
        .select('id, status')
        .eq('room_code', pin)
        .maybeSingle();

      if (room) {
        targetRoomId = room.id;
        roomStatus = room.status;
      }
    } else if (targetRoomId) {
      const { data: room } = await admin
        .from('exam_rooms')
        .select('id, status')
        .eq('id', targetRoomId)
        .maybeSingle();

      if (room) {
        roomStatus = room.status;
      }
    }

    if (!targetRoomId) {
      return NextResponse.json({ error: 'Không tìm thấy phòng thi' }, { status: 404 });
    }

    // 2. If room is still in waiting room/lobby, remove candidate row entirely
    if (roomStatus !== 'IN_PROGRESS') {
      await admin
        .from('room_participants')
        .delete()
        .eq('room_id', targetRoomId)
        .eq('user_id', user.id);
    } else {
      // If already in progress, mark offline instead of deleting exam progress
      await admin
        .from('room_participants')
        .update({
          connection_status: 'OFFLINE',
          last_heartbeat_at: new Date().toISOString(),
        })
        .eq('room_id', targetRoomId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true, left: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Lỗi xử lý rời phòng' }, { status: 500 });
  }
}
