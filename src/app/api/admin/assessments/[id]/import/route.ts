import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface ImportItemRow {
  skill_code?: string;
  type?: string;
  prompt: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  explanation?: string;
  rubric_guide?: string;
  points?: number;
  is_multi_competency?: boolean;
  target_competencies?: string[];
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const supabase = await createClient();
    const body = await req.json();

    const items: ImportItemRow[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: 'Danh sách câu hỏi nạp vào không được để trống' }, { status: 400 });
    }

    // 1. Fetch competencies map (skill_code -> id)
    const { data: allCompetencies } = await supabase
      .from('competencies')
      .select('id, skill_code');

    const compMap = new Map<string, string>();
    (allCompetencies || []).forEach((c) => {
      compMap.set(c.skill_code.trim(), c.id);
    });

    const defaultCompId = allCompetencies?.[0]?.id;

    // 2. Fetch current max order index
    const { data: existingItems } = await supabase
      .from('assessment_items')
      .select('order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index', { ascending: false })
      .limit(1);

    let currentOrder = existingItems && existingItems.length > 0
      ? (existingItems[0].order_index || 0)
      : 0;

    let successCount = 0;
    const errorLogs: Array<{ row: number; error: string }> = [];

    // 3. Process each item
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const rowNum = i + 1;

      if (!row.prompt || typeof row.prompt !== 'string' || row.prompt.trim().length < 3) {
        errorLogs.push({ row: rowNum, error: 'Thiếu nội dung câu hỏi (prompt)' });
        continue;
      }

      // Determine type
      let cleanType = (row.type || 'MCQ').toUpperCase().trim();
      if (cleanType === 'PRACTICAL' || cleanType === 'THỰC HÀNH') {
        cleanType = 'DIGITAL_EVIDENCE';
      } else if (cleanType === 'TÌNH HUỐNG' || cleanType === 'SCENARIO') {
        cleanType = 'SCENARIO';
      } else {
        cleanType = 'MCQ';
      }

      // Map competency
      let compId = defaultCompId;
      if (row.skill_code && compMap.has(row.skill_code.trim())) {
        compId = compMap.get(row.skill_code.trim());
      }

      let cleanPrompt = row.prompt.trim();
      if (cleanType === 'SCENARIO' && (row as any).scenario_context && typeof (row as any).scenario_context === 'string' && (row as any).scenario_context.trim()) {
        const ctx = (row as any).scenario_context.trim();
        if (!cleanPrompt.includes(ctx)) {
          cleanPrompt = `[Bối cảnh]: ${ctx}\n\n[Câu hỏi]: ${cleanPrompt}`;
        }
      }

      currentOrder++;

      // Insert question item (no difficulty level)
      const { data: insertedItem, error: itemErr } = await supabase
        .from('assessment_items')
        .insert({
          assessment_id: assessmentId,
          competency_id: compId,
          type: cleanType,
          prompt: cleanPrompt,
          points: Number(row.points) || 10,
          order_index: currentOrder,
          difficulty_level: 'STANDARD',
          is_multi_competency: Boolean(row.is_multi_competency),
          target_competencies: row.target_competencies || [],
          rubric_guide: row.rubric_guide?.trim() || row.explanation?.trim() || null,
        })
        .select()
        .single();

      if (itemErr || !insertedItem) {
        errorLogs.push({ row: rowNum, error: `Lỗi ghi CSDL: ${itemErr?.message || 'Không thể lưu'}` });
        continue;
      }

      // If MCQ or Scenario, insert options
      if (cleanType === 'MCQ' || cleanType === 'SCENARIO') {
        const rawOptions = [
          { key: 'A', text: row.option_a },
          { key: 'B', text: row.option_b },
          { key: 'C', text: row.option_c },
          { key: 'D', text: row.option_d },
        ].filter((o) => o.text && typeof o.text === 'string' && o.text.trim().length > 0);

        const correctKey = (row.correct_answer || 'A').toUpperCase().trim();

        if (rawOptions.length >= 2) {
          const optInserts = rawOptions.map((opt, idx) => ({
            item_id: insertedItem.id,
            content: opt.text!.trim(),
            is_correct: opt.key === correctKey || opt.text!.trim() === correctKey,
            explanation: opt.key === correctKey ? row.explanation?.trim() || null : null,
            order_index: idx + 1,
          }));

          await supabase.from('item_options').insert(optInserts);
        }
      }

      successCount++;
    }

    return NextResponse.json({
      success: true,
      totalReceived: items.length,
      successCount,
      failedCount: errorLogs.length,
      errors: errorLogs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
