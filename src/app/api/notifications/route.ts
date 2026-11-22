import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ notifications: [] });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam, 10))) : 50;

    const { data, error } = await supabase
      .from('user_notifications')
      .select('id, title, message, category, link_url, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

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

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paramId = searchParams.get('id');
    const paramClearAll = searchParams.get('clearAll') === 'true';
    const paramClearRead = searchParams.get('clearRead') === 'true';

    let bodyId: string | undefined;
    let bodyClearAll = false;
    let bodyClearRead = false;

    try {
      const body = await request.json();
      bodyId = body?.id;
      bodyClearAll = Boolean(body?.clearAll || body?.deleteAll);
      bodyClearRead = Boolean(body?.clearRead || body?.deleteAllRead);
    } catch {
      // Body may be empty if params used
    }

    const id = paramId || bodyId;
    const clearAll = paramClearAll || bodyClearAll;
    const clearRead = paramClearRead || bodyClearRead;

    if (clearAll) {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: 'Không thể xóa thông báo' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Đã xóa tất cả thông báo.' });
    }

    if (clearRead) {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);

      if (error) {
        return NextResponse.json({ error: 'Không thể xóa thông báo đã đọc' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Đã xóa tất cả thông báo đã đọc.' });
    }

    if (id) {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: 'Không thể xóa thông báo' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Đã xóa thông báo.' });
    }

    return NextResponse.json({ error: 'Thiếu tham số xóa (id hoặc clearAll hoặc clearRead)' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
