import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().optional(),
  duration_minutes: z.number().int().min(5).max(300).optional(),
  passing_score: z.number().min(0).max(100).optional(),
  point_reward: z.number().int().min(0).max(1000).optional(),
  is_published: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: assessment, error } = await adminSupabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !assessment) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí' }, { status: 404 });
    }

    if (assessment.created_by !== user.id && assessment.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền truy cập đề thi này' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, assessment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: assessment } = await adminSupabase
      .from('assessments')
      .select('id, created_by, owner_user_id')
      .eq('id', id)
      .maybeSingle();

    if (!assessment) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí' }, { status: 404 });
    }

    if (assessment.created_by !== user.id && assessment.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa đề thi này' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = updateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await adminSupabase
      .from('assessments')
      .update({
        ...validated.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Không thể cập nhật bài khảo thí' }, { status: 500 });
    }

    return NextResponse.json({ success: true, assessment: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: assessment } = await adminSupabase
      .from('assessments')
      .select('id, title, created_by, owner_user_id')
      .eq('id', id)
      .maybeSingle();

    if (!assessment) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí' }, { status: 404 });
    }

    if (assessment.created_by !== user.id && assessment.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa đề thi này' },
        { status: 403 }
      );
    }

    // Check if there are candidate submissions
    const { count: submissionCount } = await adminSupabase
      .from('assessment_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('assessment_id', id);

    if (submissionCount && submissionCount > 0) {
      // Soft unpublish / archive to protect learner history integrity
      const { error: archiveError } = await adminSupabase
        .from('assessments')
        .update({
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (archiveError) {
        return NextResponse.json({ error: 'Không thể lưu trữ bài khảo thí' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Bài thi đã có thí sinh nộp bài nên được chuyển sang trạng thái Lưu trữ (Ẩn) thay vì xóa cứng',
        softDeleted: true,
      });
    }

    // Clean delete if no submissions exist
    const { error: deleteError } = await adminSupabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Không thể xóa bài khảo thí' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa bài khảo thí thành công' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
