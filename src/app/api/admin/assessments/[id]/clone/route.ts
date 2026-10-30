import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // 1. Fetch original assessment
    const { data: orig, error: origErr } = await adminSupabase
      .from('assessments')
      .select(`
        *,
        assessment_items (
          *,
          item_options (*)
        )
      `)
      .eq('id', id)
      .single();

    if (origErr || !orig) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí nguồn để nhân bản' }, { status: 404 });
    }

    // 2. Insert new assessment as DRAFT (is_published = false)
    const newTitle = `${orig.title} (Phiên bản mới / v2)`;
    const { data: newAssessment, error: createErr } = await adminSupabase
      .from('assessments')
      .insert({
        title: newTitle,
        description: orig.description,
        duration_minutes: orig.duration_minutes,
        passing_score: orig.passing_score,
        point_reward: orig.point_reward,
        is_published: false,
        is_vip: orig.is_vip,
        access_tier: orig.access_tier,
        framework_id: orig.framework_id,
        organization_id: orig.organization_id,
        owner_user_id: auth.user!.id,
        created_by: auth.user!.id,
      })
      .select()
      .single();

    if (createErr || !newAssessment) {
      return NextResponse.json({ error: createErr?.message || 'Không thể tạo bản sao đề thi' }, { status: 500 });
    }

    // 3. Clone items and options
    const origItems = orig.assessment_items || [];
    for (const item of origItems) {
      const { data: newItem, error: itemErr } = await adminSupabase
        .from('assessment_items')
        .insert({
          assessment_id: newAssessment.id,
          competency_id: item.competency_id,
          type: item.type,
          prompt: item.prompt,
          points: item.points,
          order_index: item.order_index,
          difficulty_level: item.difficulty_level || 'INTERMEDIATE',
          is_multi_competency: item.is_multi_competency,
          target_competencies: item.target_competencies,
          rubric_guide: item.rubric_guide,
        })
        .select('id')
        .single();

      if (!itemErr && newItem && item.item_options?.length > 0) {
        const newOptions = item.item_options.map((opt: any) => ({
          item_id: newItem.id,
          content: opt.content,
          is_correct: opt.is_correct,
          explanation: opt.explanation,
          order_index: opt.order_index,
        }));
        await adminSupabase.from('item_options').insert(newOptions);
      }
    }

    // 4. Audit Log
    await recordAdminAudit({
      actorId: auth.user!.id,
      action: 'CLONE',
      targetType: 'ASSESSMENT',
      targetId: newAssessment.id,
      newValues: {
        original_assessment_id: id,
        new_assessment_id: newAssessment.id,
        title: newTitle,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã nhân bản đề thi sang phiên bản mới (DRAFT) thành công',
      assessment: newAssessment,
    }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
