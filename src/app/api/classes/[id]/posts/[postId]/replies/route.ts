import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { verifyClassAccess } from '@/lib/classes/access';

const createReplySchema = z.object({
  content: z.string().trim().min(1, 'Nội dung phản hồi không được để trống').max(1000, 'Nội dung tối đa 1000 ký tự'),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: classId, postId } = await params;
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const access = await verifyClassAccess(supabase, classId, currentUser.id, currentUser.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }

    const { data: replies, error } = await supabase
      .from('class_post_replies')
      .select(`
        id,
        post_id,
        author_id,
        content,
        created_at,
        author:profiles ( id, nickname, email, avatar_url, role )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Không thể tải phản hồi' }, { status: 500 });
    }

    return NextResponse.json({ replies: replies || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: classId, postId } = await params;
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
    const parsed = createReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { data: newReply, error } = await supabase
      .from('class_post_replies')
      .insert({
        post_id: postId,
        author_id: currentUser.id,
        content: parsed.data.content,
      })
      .select(`
        id,
        post_id,
        author_id,
        content,
        created_at,
        author:profiles ( id, nickname, email, avatar_url, role )
      `)
      .single();

    if (error || !newReply) {
      return NextResponse.json({ error: 'Không thể gửi phản hồi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reply: newReply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
