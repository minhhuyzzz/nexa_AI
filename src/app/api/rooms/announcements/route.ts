import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const announcementSchema = z.object({
  roomId: z.string().uuid('Mã phòng không hợp lệ'),
  content: z.string().min(1, 'Nội dung thông báo không được để trống').max(500, 'Tối đa 500 ký tự'),
  targetAudience: z.string().default('ALL'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Thiếu roomId' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: announcements, error } = await supabase
      .from('room_announcements')
      .select('id, room_id, created_by, content, target_audience, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json({ error: 'Không thể tải thông báo phòng thi' }, { status: 500 });
    }

    return NextResponse.json({ announcements: announcements || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = announcementSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { roomId, content, targetAudience } = validated.data;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // Verify user is room host
    const { data: room } = await supabase
      .from('exam_rooms')
      .select('id, created_by')
      .eq('id', roomId)
      .single();

    if (!room || room.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Chỉ người tổ chức phòng thi mới có quyền phát thông báo' },
        { status: 403 }
      );
    }

    const { data: announcement, error: insertError } = await supabase
      .from('room_announcements')
      .insert({
        room_id: roomId,
        created_by: user.id,
        content: content.trim(),
        target_audience: targetAudience,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating announcement:', insertError);
      return NextResponse.json({ error: 'Không thể gửi thông báo' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
