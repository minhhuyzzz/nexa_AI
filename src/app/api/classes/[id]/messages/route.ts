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

    // 1. Fetch manager user IDs for accurate author badges
    const { data: cls } = await supabase
      .from('evaluator_classes')
      .select('id, evaluator_id, owner_user_id, organization_id, instructor_id')
      .eq('id', classId)
      .maybeSingle();

    const managerIds = new Set<string>();
    if (cls) {
      if (cls.evaluator_id) managerIds.add(cls.evaluator_id);
      if (cls.owner_user_id) managerIds.add(cls.owner_user_id);
      if (cls.instructor_id) managerIds.add(cls.instructor_id);

      if (cls.organization_id) {
        const { data: orgAdmins } = await supabase
          .from('user_organizations')
          .select('user_id')
          .eq('organization_id', cls.organization_id)
          .in('org_role', ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR'])
          .eq('status', 'ACTIVE');

        (orgAdmins || []).forEach((oa: any) => managerIds.add(oa.user_id));
      }
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

    // Return in chronological order with manager badge
    const ordered = (messages || []).reverse().map((m: any) => ({
      ...m,
      is_author_manager: managerIds.has(m.sender_id),
    }));

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

    return NextResponse.json({
      success: true,
      message: {
        ...newMessage,
        is_author_manager: access.isEvaluator,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Thiếu mã tin nhắn' }, { status: 400 });
    }

    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const access = await verifyClassAccess(supabase, classId, currentUser.id, currentUser.role);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 });
    }

    const { data: msg } = await supabase
      .from('class_messages')
      .select('id, sender_id, created_at')
      .eq('id', messageId)
      .maybeSingle();

    if (!msg) {
      return NextResponse.json({ error: 'Tin nhắn không tồn tại' }, { status: 404 });
    }

    if (msg.sender_id !== currentUser.id && !access.isEvaluator) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa tin nhắn này' }, { status: 403 });
    }

    // Quy định thời gian thu hồi: Thành viên chỉ được xóa trong vòng 15 phút kể từ lúc gửi
    // Quản trị viên (Evaluator/Admin) được quyền xóa mọi lúc để kiểm duyệt
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const msgAge = Date.now() - new Date(msg.created_at).getTime();
    if (!access.isEvaluator && msgAge > FIFTEEN_MINUTES_MS) {
      return NextResponse.json(
        { error: 'Đã quá 15 phút kể từ lúc gửi, bạn không thể thu hồi tin nhắn này nữa.' },
        { status: 400 }
      );
    }

    await supabase.from('class_messages').delete().eq('id', messageId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
