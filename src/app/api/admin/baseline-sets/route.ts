import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

const CANONICAL_BASELINE_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * GET /api/admin/baseline-sets
 * Lấy danh sách tất cả các bộ khảo sát đầu vào
 */
export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    // Query các bài khảo thí thuộc nhóm baseline (canonical ID, system_code BASELINE%, hoặc is_system_baseline)
    const { data: sets, error } = await adminSupabase
      .from('assessments')
      .select(`
        id,
        title,
        description,
        is_published,
        is_system_baseline,
        system_code,
        created_at,
        assessment_items (id)
      `)
      .or(`id.eq.${CANONICAL_BASELINE_ID},is_system_baseline.eq.true,system_code.ilike.BASELINE%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BASELINE_SETS_LIST_ERROR]', error);
      return NextResponse.json({ error: 'Lỗi khi tải danh sách bộ khảo sát' }, { status: 500 });
    }

    const formatted = (sets || []).map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      isPublished: s.is_published,
      isActive: s.is_system_baseline === true,
      systemCode: s.system_code,
      questionCount: Array.isArray(s.assessment_items) ? s.assessment_items.length : 0,
      createdAt: s.created_at,
    }));

    return NextResponse.json({ sets: formatted });
  } catch (err) {
    console.error('[BASELINE_SETS_ERROR]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi máy chủ' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/baseline-sets
 * Tạo một bộ khảo sát đầu vào mới (trạng thái Nháp, chưa kích hoạt)
 */
export async function POST(req: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const title = (body.title || '').trim();

    if (!title || title.length < 3) {
      return NextResponse.json(
        { error: 'Tên bộ khảo sát phải có ít nhất 3 ký tự' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const uniqueSystemCode = `BASELINE_${Date.now()}`;

    const { data: newSet, error } = await adminSupabase
      .from('assessments')
      .insert({
        title,
        description: body.description || 'Bộ khảo thí đánh giá đầu vào năng lực số',
        duration_minutes: 25,
        passing_score: 70,
        point_reward: 0,
        is_published: false,
        is_system_baseline: false,
        system_code: uniqueSystemCode,
        access_tier: 'FREE',
        visibility: 'PUBLIC',
      })
      .select('id, title, is_published, is_system_baseline, system_code, created_at')
      .single();

    if (error) {
      console.error('[BASELINE_SETS_CREATE_ERROR]', error);
      return NextResponse.json({ error: 'Lỗi khi tạo bộ khảo sát mới' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      set: {
        id: newSet.id,
        title: newSet.title,
        isPublished: newSet.is_published,
        isActive: false,
        systemCode: newSet.system_code,
        questionCount: 0,
        createdAt: newSet.created_at,
      },
    });
  } catch (err) {
    console.error('[BASELINE_SETS_CREATE_ERROR]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi máy chủ' },
      { status: 500 }
    );
  }
}
