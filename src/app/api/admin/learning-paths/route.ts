import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

const createPathSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề lộ trình tối thiểu 3 ký tự').max(150),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  domainCodes: z.array(z.string()).default([]),
  accessTier: z.enum(['FREE', 'VIP']).default('FREE'),
  pointReward: z.number().int().min(0).max(5000).default(100),
  isPublished: z.boolean().default(false),
  orderIndex: z.number().int().default(1),
});

export async function GET() {
  try {
    const auth = await requirePlatformAdmin('MANAGE_CONTENT');
    if (!auth.isAuthorized) return auth.errorResponse!;

    const adminSupabase = createAdminClient();

    // 1. Fetch paths
    const { data: paths, error: pathsError } = await adminSupabase
      .from('learning_paths')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (pathsError) {
      return NextResponse.json({ error: pathsError.message }, { status: 500 });
    }

    // 2. Fetch module counts per path
    const { data: moduleCounts, error: countError } = await adminSupabase
      .from('learning_modules')
      .select('path_id, id');

    const countsMap = new Map<string, number>();
    if (!countError && Array.isArray(moduleCounts)) {
      moduleCounts.forEach((m) => {
        if (m.path_id) {
          countsMap.set(m.path_id, (countsMap.get(m.path_id) || 0) + 1);
        }
      });
    }

    const formatted = (paths || []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      domainCodes: p.domain_codes || [],
      accessTier: p.access_tier || 'FREE',
      pointReward: p.point_reward ?? 100,
      isPublished: Boolean(p.is_published),
      orderIndex: p.order_index ?? 1,
      modulesCount: countsMap.get(p.id) || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ success: true, paths: formatted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_CONTENT');
    if (!auth.isAuthorized) return auth.errorResponse!;

    const body = await request.json().catch(() => null);
    const parsed = createPathSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const {
      title,
      slug,
      description,
      domainCodes,
      accessTier,
      pointReward,
      isPublished,
      orderIndex,
    } = parsed.data;

    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

    const adminSupabase = createAdminClient();

    const { data: newPath, error: insertError } = await adminSupabase
      .from('learning_paths')
      .insert({
        title,
        slug: generatedSlug,
        description: description || null,
        domain_codes: domainCodes,
        access_tier: accessTier,
        point_reward: pointReward,
        is_published: isPublished,
        order_index: orderIndex,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, path: newPath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
