import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateAssessmentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(5).max(300).optional(),
  passing_score: z.number().min(0).max(100).optional(),
  point_reward: z.number().int().min(0).max(1000).optional(),
  is_published: z.boolean().optional(),
  is_vip: z.boolean().optional(),
  access_tier: z.enum(['FREE', 'VIP']).optional(),
  target_domain: z.string().optional(),
  security_settings: z.record(z.any()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: assessment, error } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        passing_score,
        point_reward,
        is_published,
        is_vip,
        access_tier,
        security_settings,
        created_at,
        updated_at,
        assessment_items (
          id,
          type,
          prompt,
          points,
          order_index,
          competency_id,
          is_multi_competency,
          target_competencies,
          rubric_guide,
          competencies (
            id,
            skill_code,
            title,
            domain_id,
            competency_domains (
              code,
              title
            )
          ),
          item_options (
            id,
            content,
            is_correct,
            explanation,
            order_index
          ),
          rubrics (
            id,
            title,
            max_points,
            rubric_criteria (
              id,
              name,
              description,
              max_points,
              weight_percent,
              order_index,
              rubric_levels (
                id,
                name,
                score_percent,
                description,
                order_index
              )
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    let resolvedAssessment: any = assessment;

    if (error || !resolvedAssessment) {
      console.warn('[ADMIN_GET_ASSESSMENT_RLS_FALLBACK]', error?.message || 'Assessment null, attempting admin client');
      const adminClient = createAdminClient();
      const { data: adminAssessment, error: adminErr } = await adminClient
        .from('assessments')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          passing_score,
          point_reward,
          is_published,
          is_vip,
          access_tier,
          security_settings,
          created_at,
          updated_at,
          assessment_items (
            id,
            type,
            prompt,
            points,
            order_index,
            competency_id,
            is_multi_competency,
            target_competencies,
            rubric_guide,
            competencies (
              id,
              skill_code,
              title,
              domain_id,
              competency_domains (
                code,
                title
              )
            ),
            item_options (
              id,
              content,
              is_correct,
              explanation,
              order_index
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (adminErr || !adminAssessment) {
        console.error('[ADMIN_GET_ASSESSMENT_FINAL_ERROR]:', adminErr);
        return NextResponse.json({ error: 'Không tìm thấy bài khảo thí' }, { status: 404 });
      }
      resolvedAssessment = adminAssessment;
    }

    return NextResponse.json({ assessment: resolvedAssessment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { id } = await params;
    const supabase = await createClient();
    const body = await req.json();

    const parsed = updateAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const needsScoreOrDurationCheck =
      parsed.data.passing_score !== undefined || parsed.data.duration_minutes !== undefined;

    if (needsScoreOrDurationCheck) {
      const { data: existingAssessment } = await supabase
        .from('assessments')
        .select('duration_minutes, passing_score')
        .eq('id', id)
        .maybeSingle();

      const isDurationChanged =
        parsed.data.duration_minutes !== undefined &&
        existingAssessment &&
        Number(existingAssessment.duration_minutes) !== Number(parsed.data.duration_minutes);

      const isPassingScoreChanged =
        parsed.data.passing_score !== undefined &&
        existingAssessment &&
        Number(existingAssessment.passing_score) !== Number(parsed.data.passing_score);

      if (isDurationChanged || isPassingScoreChanged) {
        const { count: submissionCount } = await supabase
          .from('assessment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', id);

        if (submissionCount && submissionCount > 0) {
          return NextResponse.json(
            {
              error:
                'Đề thi đã có học viên nộp bài làm. Không được phép thay đổi điểm đạt hoặc thời gian làm bài. Vui lòng tạo phiên bản mới (Clone as Version).',
            },
            { status: 400 }
          );
        }
      }
    }

    const updatePayload: Record<string, any> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.access_tier) {
      updatePayload.is_vip = parsed.data.access_tier === 'VIP';
    } else if (parsed.data.is_vip !== undefined) {
      updatePayload.access_tier = parsed.data.is_vip ? 'VIP' : 'FREE';
    }

    if (parsed.data.is_published === true) {
      // Build immutable snapshot of items and options (NEXA-18)
      const { data: fullItems } = await supabase
        .from('assessment_items')
        .select(`
          id, type, prompt, points, order_index, competency_id, rubric_guide,
          item_options ( id, content, is_correct, explanation, order_index )
        `)
        .eq('assessment_id', id)
        .order('order_index', { ascending: true });

      updatePayload.snapshot_data = {
        published_at: new Date().toISOString(),
        published_by: auth.user!.id,
        item_count: fullItems?.length || 0,
        items: fullItems || [],
      };
    }

    let updated = null;
    const { data: userUpdated, error } = await supabase
      .from('assessments')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !userUpdated) {
      console.warn('[ADMIN_UPDATE_ASSESSMENT_FALLBACK] User client update failed or RLS blocked, trying adminClient:', error?.message);
      const adminClient = createAdminClient();
      const { data: adminUpdated, error: adminErr } = await adminClient
        .from('assessments')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (adminErr || !adminUpdated) {
        console.error('Error updating assessment via adminClient:', adminErr);
        return NextResponse.json({ error: 'Không thể cập nhật bài khảo thí' }, { status: 500 });
      }
      updated = adminUpdated;
    } else {
      updated = userUpdated;
    }

    await recordAdminAudit({
      actorId: auth.user!.id,
      action: 'UPDATE',
      targetType: 'ASSESSMENT',
      targetId: id,
      newValues: updatePayload,
    });

    return NextResponse.json({ assessment: updated });
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
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { id } = await params;
    const adminSupabase = createAdminClient();

    // 1. Fetch current assessment to verify existence and retrieve existing settings
    const { data: existingAssessment } = await adminSupabase
      .from('assessments')
      .select('id, title, security_settings')
      .eq('id', id)
      .maybeSingle();

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí để xóa' }, { status: 404 });
    }

    // 2. Check if there are active submissions
    const { count: submissionCount } = await adminSupabase
      .from('assessment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', id);

    if (submissionCount && submissionCount > 0) {
      // Soft-delete / Archive: update is_published: false and persist is_archived in security_settings
      const currentSecurity =
        existingAssessment.security_settings && typeof existingAssessment.security_settings === 'object'
          ? existingAssessment.security_settings
          : {};

      const { error: archiveError } = await adminSupabase
        .from('assessments')
        .update({
          is_published: false,
          security_settings: {
            ...currentSecurity,
            is_archived: true,
            archived_at: new Date().toISOString(),
            archived_by: auth.user!.id,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (archiveError) {
        console.error('Error archiving assessment:', archiveError);
        return NextResponse.json({ error: 'Không thể lưu trữ bài khảo thí' }, { status: 500 });
      }

      await recordAdminAudit({
        actorId: auth.user!.id,
        action: 'UPDATE',
        targetType: 'ASSESSMENT',
        targetId: id,
        newValues: { is_published: false, is_archived: true, reason: 'Archived due to existing submissions' },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa và lưu trữ bài khảo thí (bảo toàn lịch sử thi của thí sinh)',
        softDeleted: true,
      });
    }

    // 3. Clean hard delete when no submissions exist
    const { error: deleteError } = await adminSupabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting assessment:', deleteError);
      return NextResponse.json({ error: 'Không thể xóa bài khảo thí: ' + deleteError.message }, { status: 500 });
    }

    await recordAdminAudit({
      actorId: auth.user!.id,
      action: 'DELETE',
      targetType: 'ASSESSMENT',
      targetId: id,
      newValues: { softDeleted: false },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa vĩnh viễn bài khảo thí thành công' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
