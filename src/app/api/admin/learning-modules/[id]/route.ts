import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

const updateModuleSchema = z.object({
  pathId: z.string().uuid().optional().nullable(),
  domainCode: z.string().trim().optional(),
  skillCode: z.string().trim().optional(),
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().optional().nullable(),
  durationMinutes: z.number().int().min(5).max(300).optional(),
  pointReward: z.number().int().min(0).max(1000).optional(),
  contentMarkdown: z.string().optional().nullable(),
  assessmentId: z.string().uuid().optional().nullable(),
  passingScore: z.number().min(0).max(100).optional(),
  securitySettings: z.record(z.any()).optional(),
  accessTier: z.enum(['FREE', 'VIP']).optional(),
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

    const { data: moduleItem, error } = await adminSupabase
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
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!moduleItem) {
      return NextResponse.json({ error: 'Không tìm thấy học phần' }, { status: 404 });
    }

    return NextResponse.json({ success: true, module: moduleItem });
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
    const parsed = updateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.pathId !== undefined) updates.path_id = parsed.data.pathId;
    if (parsed.data.domainCode !== undefined) updates.domain_code = parsed.data.domainCode;
    if (parsed.data.skillCode !== undefined) updates.skill_code = parsed.data.skillCode;
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.durationMinutes !== undefined) updates.duration_minutes = parsed.data.durationMinutes;
    if (parsed.data.pointReward !== undefined) updates.point_reward = parsed.data.pointReward;
    if (parsed.data.contentMarkdown !== undefined) updates.content_markdown = parsed.data.contentMarkdown;
    if (parsed.data.assessmentId !== undefined) updates.assessment_id = parsed.data.assessmentId;
    if (parsed.data.accessTier !== undefined) updates.access_tier = parsed.data.accessTier;
    if (parsed.data.isPublished !== undefined) updates.is_published = parsed.data.isPublished;
    if (parsed.data.orderIndex !== undefined) updates.order_index = parsed.data.orderIndex;

    const adminSupabase = createAdminClient();

    const { data: updated, error: updateError } = await adminSupabase
      .from('learning_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const targetAssessmentId = parsed.data.assessmentId !== undefined ? parsed.data.assessmentId : updated.assessment_id;
    if (targetAssessmentId && (parsed.data.passingScore !== undefined || parsed.data.securitySettings !== undefined || parsed.data.durationMinutes !== undefined || parsed.data.pointReward !== undefined)) {
      const assessmentUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (parsed.data.passingScore !== undefined) assessmentUpdates.passing_score = parsed.data.passingScore;
      if (parsed.data.durationMinutes !== undefined) assessmentUpdates.duration_minutes = parsed.data.durationMinutes;
      if (parsed.data.pointReward !== undefined) assessmentUpdates.point_reward = parsed.data.pointReward;
      if (parsed.data.securitySettings !== undefined) assessmentUpdates.security_settings = parsed.data.securitySettings;

      const assTable = adminSupabase.from('assessments');
      if (assTable && typeof assTable.update === 'function') {
        const updateQuery = assTable.update(assessmentUpdates);
        if (updateQuery && typeof updateQuery.eq === 'function') {
          await updateQuery.eq('id', targetAssessmentId);
        }
      }
    }

    return NextResponse.json({ success: true, module: updated });
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

    const { error: deleteError } = await adminSupabase
      .from('learning_modules')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa học phần thành công' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
