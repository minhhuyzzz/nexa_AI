import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const readySchema = z.object({
  roomId: z.string().uuid('Mã phòng không hợp lệ'),
  isReady: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = readySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { roomId, isReady } = validated.data;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('room_participants')
      .update({
        is_ready: isReady,
        ready_at: isReady ? now : null,
        connection_status: 'ONLINE',
        last_heartbeat_at: now,
      })
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .select('id, room_id, user_id, is_ready, ready_at, status')
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin tham gia phòng thi của bạn' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      participant: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
