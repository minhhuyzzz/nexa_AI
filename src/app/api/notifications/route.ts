import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ notifications: [] });
    }

    const { data, error } = await supabase
      .from('user_notifications')
      .select('id, title, message, category, link_url, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      // Table may not exist yet in local mock environments
      return NextResponse.json({ notifications: [] });
    }

    return NextResponse.json({ notifications: data || [] });
  } catch (err) {
    return NextResponse.json({ notifications: [] });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const { id, markAll } = body;
    const nowIso = new Date().toISOString();

    if (markAll) {
      await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: nowIso })
        .eq('user_id', user.id)
        .eq('is_read', false);

      return NextResponse.json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
    }

    if (id) {
      await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: nowIso })
        .eq('id', id)
        .eq('user_id', user.id);

      return NextResponse.json({ success: true, message: 'Đã cập nhật trạng thái thông báo.' });
    }

    return NextResponse.json({ error: 'Thiếu id hoặc markAll' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
