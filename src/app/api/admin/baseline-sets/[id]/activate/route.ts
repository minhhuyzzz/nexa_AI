import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

const CANONICAL_BASELINE_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * PUT /api/admin/baseline-sets/[id]/activate
 * Kích hoạt một bộ khảo sát đầu vào — hủy kích hoạt các bộ khác và đặt bộ này làm baseline chính thức
 */
export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { id } = await params;
    const adminSupabase = createAdminClient();

    // 1. Kiểm tra bộ khảo sát mục tiêu tồn tại
    const { data: target, error: targetErr } = await adminSupabase
      .from('assessments')
      .select('id, title, system_code, is_system_baseline, is_published')
      .eq('id', id)
      .single();

    if (targetErr || !target) {
      return NextResponse.json(
        { error: 'Không tìm thấy bộ khảo sát này' },
        { status: 404 }
      );
    }

    // 2. Kiểm tra bộ đề có ít nhất 1 câu hỏi
    const { count } = await adminSupabase
      .from('assessment_items')
      .select('id', { count: 'exact', head: true })
      .eq('assessment_id', id);

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'Bộ khảo sát phải có ít nhất 1 câu hỏi mới có thể kích hoạt' },
        { status: 400 }
      );
    }

    // 3. Hủy kích hoạt tất cả các bài baseline khác
    await adminSupabase
      .from('assessments')
      .update({ is_system_baseline: false })
      .eq('is_system_baseline', true);

    // 4. Kích hoạt bài khảo sát mục tiêu và xuất bản
    const { error: activateErr } = await adminSupabase
      .from('assessments')
      .update({
        is_system_baseline: true,
        is_published: true,
      })
      .eq('id', id);

    if (activateErr) {
      console.error('[BASELINE_ACTIVATE_ERROR]', activateErr);
      return NextResponse.json(
        { error: 'Lỗi khi kích hoạt bộ khảo sát' },
        { status: 500 }
      );
    }

    // 5. Cập nhật platform_settings để đồng bộ cấu hình hệ thống
    await adminSupabase
      .from('platform_settings')
      .upsert(
        {
          key: 'baseline_assessment_config',
          value: {
            assessment_id: id,
            is_active: true,
            title: target.title,
          },
          description: 'Cấu hình đề khảo thí đầu vào đang kích hoạt',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt "${target.title}" làm khảo sát đầu vào chính thức!`,
    });
  } catch (err) {
    console.error('[BASELINE_ACTIVATE_ERROR]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi máy chủ' },
      { status: 500 }
    );
  }
}
