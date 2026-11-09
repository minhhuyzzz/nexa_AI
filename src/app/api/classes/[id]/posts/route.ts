import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { verifyClassAccess } from '@/lib/classes/access';

const createPostSchema = z.object({
  title: z.string().trim().max(200, 'Tiêu đề tối đa 200 ký tự').optional(),
  content: z.string().trim().min(1, 'Nội dung bài viết không được để trống'),
  postType: z.enum(['POST', 'ANNOUNCEMENT']).default('POST'),
  isPinned: z.boolean().default(false),
  linkedAssignmentId: z.string().uuid().optional().nullable(),
  linkedFileId: z.string().uuid().optional().nullable(),
});

export async function GET(
  _req: Request,
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
      return NextResponse.json({ error: 'Bạn không thuộc nhóm này' }, { status: 403 });
    }

    // 1. Fetch manager user IDs for accurate author badges
    const { data: cls } = await supabase
      .from('evaluator_classes')
      .select('id, evaluator_id, owner_user_id, organization_id, instructor_id, settings')
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

    // 2. Query class posts
    const { data: posts, error } = await supabase
      .from('class_posts')
      .select(`
        id,
        class_id,
        author_id,
        title,
        content,
        post_type,
        is_pinned,
        linked_assignment_id,
        linked_file_id,
        created_at,
        updated_at,
        author:profiles ( id, nickname, email, avatar_url, role ),
        linked_assignment:class_assignments (
          id,
          deadline,
          assessment:assessments ( id, title, duration_minutes, passing_score )
        ),
        linked_file:class_files (
          id,
          file_name,
          file_url,
          file_size_bytes,
          file_type
        ),
        replies:class_post_replies (
          id,
          author_id,
          content,
          created_at,
          author:profiles ( id, nickname, email, avatar_url, role )
        )
      `)
      .eq('class_id', classId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching class posts:', error);
      return NextResponse.json({ error: 'Không thể tải bảng tin' }, { status: 500 });
    }

    const enrichedPosts = (posts || []).map((p: any) => ({
      ...p,
      is_author_manager: managerIds.has(p.author_id),
      replies: (p.replies || []).map((r: any) => ({
        ...r,
        is_author_manager: managerIds.has(r.author_id),
      })),
    }));

    const allowMemberPosts = (cls?.settings as Record<string, any>)?.allow_member_posts !== false;

    return NextResponse.json({
      posts: enrichedPosts,
      allowMemberPosts,
    });
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
      return NextResponse.json({ error: 'Bạn không có quyền đăng bài vào nhóm này' }, { status: 403 });
    }

    // Check if member posts are allowed
    if (!access.isEvaluator) {
      const { data: cls } = await supabase
        .from('evaluator_classes')
        .select('settings')
        .eq('id', classId)
        .maybeSingle();

      const allowMemberPosts = (cls?.settings as Record<string, any>)?.allow_member_posts !== false;
      if (!allowMemberPosts) {
        return NextResponse.json(
          { error: 'Quản trị viên đã tắt tính năng đăng thảo luận cho thành viên trong lớp học này' },
          { status: 403 }
        );
      }
    }

    const body: unknown = await req.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { title, content, postType, isPinned, linkedAssignmentId, linkedFileId } = parsed.data;

    // Learner can only create regular 'POST', not 'ANNOUNCEMENT', and cannot pin
    const finalPostType = access.isEvaluator ? postType : 'POST';
    const finalIsPinned = access.isEvaluator ? isPinned : false;

    const { data: newPost, error } = await supabase
      .from('class_posts')
      .insert({
        class_id: classId,
        author_id: currentUser.id,
        title: title || null,
        content,
        post_type: finalPostType,
        is_pinned: finalIsPinned,
        linked_assignment_id: linkedAssignmentId || null,
        linked_file_id: linkedFileId || null,
      })
      .select(`
        id,
        class_id,
        author_id,
        title,
        content,
        post_type,
        is_pinned,
        linked_assignment_id,
        linked_file_id,
        created_at,
        updated_at,
        author:profiles ( id, nickname, email, avatar_url, role )
      `)
      .single();

    if (error || !newPost) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: error?.message || 'Không thể đăng bài viết' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      post: {
        ...newPost,
        is_author_manager: access.isEvaluator,
        replies: [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
