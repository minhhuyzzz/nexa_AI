import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { verifyClassAccess } from '@/lib/classes/access';

const patchPostSchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.string().trim().min(1).optional(),
  isPinned: z.boolean().optional(),
});

export async function PATCH(
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

    const { data: post, error: postError } = await supabase
      .from('class_posts')
      .select('id, author_id, class_id')
      .eq('id', postId)
      .eq('class_id', classId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 });
    }

    const body: unknown = await req.json();
    const parsed = patchPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const updatePayload: { title?: string; content?: string; is_pinned?: boolean; updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.isPinned !== undefined) {
      if (!access.isEvaluator) {
        return NextResponse.json({ error: 'Chỉ Người đánh giá mới có quyền ghim bài' }, { status: 403 });
      }
      updatePayload.is_pinned = parsed.data.isPinned;
    }

    if (parsed.data.title !== undefined || parsed.data.content !== undefined) {
      const isAuthor = post.author_id === currentUser.id;
      if (!isAuthor && !access.isEvaluator) {
        return NextResponse.json({ error: 'Chỉ tác giả mới có quyền sửa nội dung' }, { status: 403 });
      }
      if (parsed.data.title !== undefined) updatePayload.title = parsed.data.title;
      if (parsed.data.content !== undefined) updatePayload.content = parsed.data.content;
    }

    const { data: updated, error: updateError } = await supabase
      .from('class_posts')
      .update(updatePayload)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Không thể cập nhật bài viết' }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    const { data: post, error: postError } = await supabase
      .from('class_posts')
      .select('id, author_id')
      .eq('id', postId)
      .eq('class_id', classId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 });
    }

    // Only author or evaluator/admin can delete
    const isAuthor = post.author_id === currentUser.id;
    if (!isAuthor && !access.isEvaluator) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa bài viết này' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('class_posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      return NextResponse.json({ error: 'Không thể xóa bài viết' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
