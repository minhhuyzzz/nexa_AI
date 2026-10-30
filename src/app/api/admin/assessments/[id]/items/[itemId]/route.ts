import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateItemSchema = z.object({
  type: z.enum(['MCQ', 'SCENARIO', 'PRACTICAL_TASK', 'DIGITAL_EVIDENCE']).optional(),
  prompt: z.string().min(5).optional(),
  points: z.number().min(1).max(100).optional(),
  competency_id: z.string().uuid().optional(),
  skill_code: z.string().optional(),
  target_competencies: z.array(z.string()).optional(),
  is_multi_competency: z.boolean().optional(),
  rubric_guide: z.string().nullable().optional(),
  options: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        content: z.string().min(1),
        is_correct: z.boolean().default(false),
        explanation: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { id: assessmentId, itemId } = await params;
    const supabase = await createClient();
    const body = await req.json();

    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      type,
      prompt,
      points,
      competency_id: rawCompId,
      skill_code,
      target_competencies,
      is_multi_competency,
      rubric_guide,
      options,
    } = parsed.data;

    let competencyId = rawCompId;
    if (!competencyId && skill_code) {
      const { data: comp } = await supabase
        .from('competencies')
        .select('id')
        .eq('skill_code', skill_code.trim())
        .limit(1)
        .maybeSingle();
      if (comp) competencyId = comp.id;
    }

    const itemUpdatePayload: Record<string, any> = {};
    if (type) itemUpdatePayload.type = type;
    if (prompt) itemUpdatePayload.prompt = prompt.trim();
    if (points !== undefined) itemUpdatePayload.points = points;
    if (competencyId) itemUpdatePayload.competency_id = competencyId;
    if (target_competencies !== undefined) {
      itemUpdatePayload.target_competencies = target_competencies;
    }
    if (is_multi_competency !== undefined) {
      itemUpdatePayload.is_multi_competency = is_multi_competency;
    }
    if (rubric_guide !== undefined) {
      itemUpdatePayload.rubric_guide = rubric_guide ? rubric_guide.trim() : null;
    }

    const { data: updatedItem, error: updateErr } = await supabase
      .from('assessment_items')
      .update(itemUpdatePayload)
      .eq('id', itemId)
      .eq('assessment_id', assessmentId)
      .select()
      .single();

    if (updateErr) {
      console.error('Error updating assessment item:', updateErr);
      return NextResponse.json({ error: 'Không thể cập nhật câu hỏi' }, { status: 500 });
    }

    // If options are provided, update them
    if (options && options.length > 0) {
      await supabase.from('item_options').delete().eq('item_id', itemId);

      const optInserts = options.map((opt, idx) => ({
        item_id: itemId,
        content: opt.content.trim(),
        is_correct: Boolean(opt.is_correct),
        explanation: opt.explanation?.trim() || null,
        order_index: idx + 1,
      }));

      await supabase.from('item_options').insert(optInserts);
    }

    return NextResponse.json({ item: updatedItem });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { id: assessmentId, itemId } = await params;
    const supabase = await createClient();

    // Check if this item is part of submitted answers
    const { count } = await supabase
      .from('submission_answers')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId);

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa câu hỏi này vì đã có học viên nộp bài làm liên quan.' },
        { status: 400 }
      );
    }

    // Delete options first (if foreign key doesn't cascade)
    await supabase.from('item_options').delete().eq('item_id', itemId);

    // Delete item
    const { error } = await supabase
      .from('assessment_items')
      .delete()
      .eq('id', itemId)
      .eq('assessment_id', assessmentId);

    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json({ error: 'Không thể xóa câu hỏi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa câu hỏi thành công' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
