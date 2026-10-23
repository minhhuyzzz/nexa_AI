import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { verifyClassAccess } from '@/lib/classes/access';

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Nội dung tin nhắn không được để trống').max(2000, 'Tin nhắn tối đa 2000 ký tự'),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const before = searchParams.get('before');

    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const access = await verifyClassAccess(supabase, classId, currentUser.id, currentUser.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }

    let query = supabase
      .from('class_messages')
      .select(`
        id,
        class_id,
        sender_id,
        content,
        created_at,
        sender:profiles ( id, nickname, avatar_url, role )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching class messages:', error);
      return NextResponse.json({ error: 'Không thể tải tin nhắn' }, { status: 500 });
    }

    // Return in chronological order
    const ordered = (messages || []).reverse();

    return NextResponse.json({ messages: ordered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const access = await verifyClassAccess(supabase, classId, currentUser.id, currentUser.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }

    const body: unknown = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { data: newMessage, error } = await supabase
      .from('class_messages')
      .insert({
        class_id: classId,
        sender_id: currentUser.id,
        content: parsed.data.content,
      })
      .select(`
        id,
        class_id,
        sender_id,
        content,
        created_at,
        sender:profiles ( id, nickname, avatar_url, role )
      `)
      .single();

    if (error || !newMessage) {
      console.error('Error inserting message:', error);
      return NextResponse.json({ error: 'Không thể gửi tin nhắn' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
