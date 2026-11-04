import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

const updatePathSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  domainCodes: z.array(z.string()).optional(),
  accessTier: z.enum(['FREE', 'VIP']).optional(),
  pointReward: z.number().int().min(0).max(5000).optional(),
  isPublished: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_CONTENT');
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { id } = await params;
    const adminSupabase = createAdminClient();

    const { data: path, error: pathError } = await adminSupabase
      .from('learning_paths')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (pathError) {
      return NextResponse.json({ error: pathError.message }, { status: 500 });
    }
    if (!path) {
      return NextResponse.json({ error: 'Không tìm thấy lộ trình' }, { status: 404 });
    }

    // Fetch associated modules
    const { data: modules, error: modulesError } = await adminSupabase
      .from('learning_modules')
      .select(`
        id,
        path_id,
        domain_code,
        skill_code,
        title,
        description,
        duration_minutes,
        point_reward,
        content_markdown,
        is_published,
        order_index,
        assessment_id,
        access_tier,
        assessments (
          id,
          title,
          passing_score
        )
      `)
      .eq('path_id', id)
      .order('order_index', { ascending: true });

    if (modulesError) {
      return NextResponse.json({ error: modulesError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: {
        ...path,
        modules: modules || [],
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_CONTENT');
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updatePathSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.slug !== undefined) updates.slug = parsed.data.slug;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.domainCodes !== undefined) updates.domain_codes = parsed.data.domainCodes;
    if (parsed.data.accessTier !== undefined) updates.access_tier = parsed.data.accessTier;
    if (parsed.data.pointReward !== undefined) updates.point_reward = parsed.data.pointReward;
    if (parsed.data.isPublished !== undefined) updates.is_published = parsed.data.isPublished;
    if (parsed.data.orderIndex !== undefined) updates.order_index = parsed.data.orderIndex;

    const adminSupabase = createAdminClient();

    const { data: updated, error: updateError } = await adminSupabase
      .from('learning_paths')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, path: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_CONTENT');
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Detach modules before deletion
    await adminSupabase
      .from('learning_modules')
      .update({ path_id: null })
      .eq('path_id', id);

    const { error: deleteError } = await adminSupabase
      .from('learning_paths')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa lộ trình thành công' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
