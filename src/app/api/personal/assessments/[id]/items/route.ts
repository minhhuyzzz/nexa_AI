import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const saveItemsSchema = z.object({
  totalScale: z.number().optional().default(100),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['MCQ', 'SCENARIO', 'PRACTICAL', 'CHOICE', 'OPEN_RESPONSE']),
      prompt: z.string().default(''),
      points: z.number().min(0).default(1),
      domainCode: z.string().default('01'),
      context: z.string().optional(),
      scenarioContext: z.string().optional(),
      allowedSubmissionModes: z.array(z.string()).optional(),
      practicalGuide: z.string().optional(),
      options: z
        .array(
          z.object({
            id: z.string().optional(),
            text: z.string().default(''),
            isCorrect: z.boolean().default(false),
            explanation: z.string().optional(),
          })
        )
        .optional(),
      rubric: z.any().optional(),
    })
  ),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

    // Verify ownership
    const { data: assessment, error: asmError } = await db
      .from('assessments')
      .select('id, created_by, owner_user_id')
      .eq('id', id)
      .maybeSingle();

    if (asmError || !assessment) {
      return NextResponse.json({ error: 'Không tìm thấy đề đánh giá' }, { status: 404 });
    }

    if (assessment.created_by !== user.id && assessment.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa đề này' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = saveItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dữ liệu câu hỏi không hợp lệ' },
        { status: 400 }
      );
    }

    const { questions } = parsed.data;

    // Remove old items and re-insert updated ones
    await db.from('assessment_items').delete().eq('assessment_id', id);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let dbType = 'MCQ';
      if (q.type === 'SCENARIO') dbType = 'SCENARIO';
      if (q.type === 'PRACTICAL' || q.type === 'OPEN_RESPONSE') dbType = 'PRACTICAL_TASK';
      if (q.type === 'CHOICE') dbType = 'MCQ';

      const questionContext = q.context || q.scenarioContext || null;
      const submissionModes = q.allowedSubmissionModes || ['TEXT', 'FILE', 'URL'];

      const { data: insertedItem, error: itemErr } = await db
        .from('assessment_items')
        .insert({
          assessment_id: id,
          prompt: q.prompt,
          type: dbType,
          points: q.points,
          context: questionContext,
          submission_modes: submissionModes,
          rubric_guide: q.practicalGuide || null,
          order_index: i,
        })
        .select('id')
        .single();

      if (itemErr || !insertedItem) continue;

      // Insert options only for choice / MCQ
      if (dbType !== 'PRACTICAL_TASK' && q.options && q.options.length > 0) {
        const optionRows = q.options.map((opt, oIdx) => ({
          item_id: insertedItem.id,
          content: opt.text,
          is_correct: opt.isCorrect,
          explanation: opt.explanation || null,
          order_index: oIdx,
        }));

        await db.from('item_options').insert(optionRows);
      }
    }

    // Update assessment updated_at
    await db
      .from('assessments')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true, count: questions.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
