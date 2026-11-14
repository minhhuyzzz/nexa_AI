import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

const createModuleSchema = z.object({
  pathId: z.string().uuid().optional().nullable(),
  domainCode: z.string().trim().default('D1'),
  skillCode: z.string().trim().default('1.1'),
  title: z.string().trim().min(3, 'Tiêu đề học phần tối thiểu 3 ký tự').max(150),
  description: z.string().trim().optional(),
  durationMinutes: z.number().int().min(5).max(300).default(20),
  pointReward: z.number().int().min(0).max(1000).default(30),
  contentMarkdown: z.string().optional(),
  assessmentId: z.string().uuid().optional().nullable(),
  passingScore: z.number().min(0).max(100).optional(),
  securitySettings: z.record(z.any()).optional(),
  accessTier: z.enum(['FREE', 'VIP']).default('FREE'),
  isPublished: z.boolean().default(true),
  orderIndex: z.number().int().default(1),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_CONTENT');
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');

    const adminSupabase = createAdminClient();

    let query = adminSupabase
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
        created_at,
        updated_at,
        assessments (
          id,
          title,
          passing_score,
          duration_minutes,
          point_reward,
          security_settings
        ),
        learning_paths (
          id,
          title
        )
      `)
      .order('order_index', { ascending: true });

    if (pathId) {
      query = query.eq('path_id', pathId);
    }

    const { data: modules, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, modules: modules || [] });
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
    const normalizedBody = body && typeof body === 'object' ? {
      pathId: body.pathId ?? body.path_id,
      domainCode: body.domainCode ?? body.domain_code,
      skillCode: body.skillCode ?? body.skill_code,
      title: body.title,
      description: body.description,
      durationMinutes: body.durationMinutes ?? body.duration_minutes,
      pointReward: body.pointReward ?? body.point_reward,
      contentMarkdown: body.contentMarkdown ?? body.content_markdown,
      assessmentId: body.assessmentId ?? body.assessment_id,
      passingScore: body.passingScore ?? body.passing_score,
      securitySettings: body.securitySettings ?? body.security_settings,
      accessTier: body.accessTier ?? body.access_tier,
      isPublished: body.isPublished ?? body.is_published,
      orderIndex: body.orderIndex ?? body.order_index,
    } : {};

    const parsed = createModuleSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const {
      pathId,
      domainCode,
      skillCode,
      title,
      description,
      durationMinutes,
      pointReward,
      contentMarkdown,
      assessmentId,
      passingScore,
      securitySettings,
      accessTier,
      isPublished,
      orderIndex,
    } = parsed.data;

    const adminSupabase = createAdminClient();

    if (assessmentId && (passingScore !== undefined || securitySettings !== undefined || durationMinutes !== undefined)) {
      const assessmentUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (passingScore !== undefined) assessmentUpdates.passing_score = passingScore;
      if (durationMinutes !== undefined) assessmentUpdates.duration_minutes = durationMinutes;
      if (pointReward !== undefined) assessmentUpdates.point_reward = pointReward;
      if (securitySettings !== undefined) assessmentUpdates.security_settings = securitySettings;

      const assTable = adminSupabase.from('assessments');
      if (assTable && typeof assTable.update === 'function') {
        const updateQuery = assTable.update(assessmentUpdates);
        if (updateQuery && typeof updateQuery.eq === 'function') {
          await updateQuery.eq('id', assessmentId);
        }
      }
    }

    const { data: newModule, error: insertError } = await adminSupabase
      .from('learning_modules')
      .insert({
        path_id: pathId || null,
        domain_code: domainCode,
        skill_code: skillCode,
        title,
        description: description || null,
        duration_minutes: durationMinutes,
        point_reward: pointReward,
        content_markdown: contentMarkdown || null,
        assessment_id: assessmentId || null,
        access_tier: accessTier,
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

    return NextResponse.json({ success: true, module: newModule });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
