import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createItemSchema = z.object({
  type: z.enum(['MCQ', 'SCENARIO', 'PRACTICAL_TASK', 'DIGITAL_EVIDENCE']).default('MCQ'),
  prompt: z.string().min(5, 'Nội dung câu hỏi phải ít nhất 5 ký tự'),
  points: z.number().min(1).max(100).default(10),
  competency_id: z.string().uuid().optional(),
  skill_code: z.string().optional(),
  target_competencies: z.array(z.string()).optional(),
  is_multi_competency: z.boolean().default(false),
  rubric_guide: z.string().optional(),
  options: z
    .array(
      z.object({
        content: z.string().min(1, 'Nội dung lựa chọn không được để trống'),
        is_correct: z.boolean().default(false),
        explanation: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const supabase = await createClient();
    const body = await req.json();

    const parsed = createItemSchema.safeParse(body);
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

    // Resolve competency ID if skill_code is provided
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

    // Default competency if still not found
    if (!competencyId) {
      const { data: defaultComp } = await supabase
        .from('competencies')
        .select('id')
        .limit(1)
        .single();
      competencyId = defaultComp?.id;
    }

    // Get current max order_index
    const { data: existingItems } = await supabase
      .from('assessment_items')
      .select('order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingItems && existingItems.length > 0
      ? (existingItems[0].order_index || 0) + 1
      : 1;

    // Standardize type
    const standardType = type === 'DIGITAL_EVIDENCE' ? 'DIGITAL_EVIDENCE' : type;

    // Insert Item (No difficulty_level requirement!)
    const { data: newItem, error: itemError } = await supabase
      .from('assessment_items')
      .insert({
        assessment_id: assessmentId,
        competency_id: competencyId,
        type: standardType,
        prompt: prompt.trim(),
        points,
        order_index: nextOrderIndex,
        is_multi_competency: Boolean(is_multi_competency || (target_competencies && target_competencies.length > 1)),
        target_competencies: target_competencies || [],
        rubric_guide: rubric_guide?.trim() || null,
        difficulty_level: 'STANDARD',
      })
      .select()
      .single();

    if (itemError || !newItem) {
      console.error('Error inserting assessment item:', itemError);
      return NextResponse.json({ error: 'Không thể thêm câu hỏi mới' }, { status: 500 });
    }

    // If MCQ or Scenario, insert options
    if (options && options.length > 0 && (type === 'MCQ' || type === 'SCENARIO')) {
      const optionsToInsert = options.map((opt, idx) => ({
        item_id: newItem.id,
        content: opt.content.trim(),
        is_correct: Boolean(opt.is_correct),
        explanation: opt.explanation?.trim() || null,
        order_index: idx + 1,
      }));

      const { error: optError } = await supabase
        .from('item_options')
        .insert(optionsToInsert);

      if (optError) {
        console.error('Error inserting item options:', optError);
      }
    }

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
