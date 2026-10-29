import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Unified Workspace: Any authenticated user has access to question bank
    // Non-admin/evaluator users can see approved items and items they created
    const isCurator = profile && ['ADMIN', 'EVALUATOR'].includes(profile.role);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type')?.trim();
    const competencyId = searchParams.get('competencyId')?.trim();
    const difficulty = searchParams.get('difficulty')?.trim();
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 30));
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('question_bank_items')
      .select(`
        id,
        code,
        prompt,
        type,
        difficulty_level,
        default_points,
        status,
        version,
        created_at,
        competencies (
          id,
          skill_code,
          title
        ),
        question_bank_options (
          id,
          content,
          is_correct,
          explanation,
          order_index
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`prompt.ilike.%${search}%,code.ilike.%${search}%`);
    }

    if (type && type !== 'ALL') {
      query = query.eq('type', type);
    }

    if (competencyId && competencyId !== 'ALL') {
      query = query.eq('competency_id', competencyId);
    }

    if (difficulty && difficulty !== 'ALL') {
      query = query.eq('difficulty_level', difficulty);
    }

    const { data: items, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching question bank items:', error);
      return NextResponse.json({ error: 'Lỗi tải ngân hàng câu hỏi' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      items: items || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const createItemSchema = z.object({
  prompt: z.string().min(3, 'Nội dung câu hỏi quá ngắn'),
  type: z.enum(['MCQ', 'SCENARIO', 'DIGITAL_EVIDENCE', 'PRACTICE_FILE', 'PRACTICE_URL']),
  competency_id: z.string().uuid().optional().nullable(),
  difficulty_level: z.enum(['FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'HIGHLY_SPECIALIZED']).default('INTERMEDIATE'),
  default_points: z.number().min(1).default(10),
  rubric_guide: z.string().optional().nullable(),
  options: z.array(
    z.object({
      content: z.string().min(1),
      is_correct: z.boolean().default(false),
      explanation: z.string().optional().nullable(),
      order_index: z.number().default(0),
    })
  ).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // Unified Workspace: Any authenticated user can create questions in question bank

    const body = await request.json();
    const validated = createItemSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const data = validated.data;
    const itemCode = `QB-${Date.now().toString(36).toUpperCase()}`;

    const { data: insertedItem, error: insertError } = await supabase
      .from('question_bank_items')
      .insert({
        code: itemCode,
        prompt: data.prompt.trim(),
        type: data.type,
        competency_id: data.competency_id || null,
        difficulty_level: data.difficulty_level,
        default_points: data.default_points,
        created_by: user.id,
        status: 'APPROVED',
      })
      .select()
      .single();

    if (insertError || !insertedItem) {
      return NextResponse.json({ error: 'Không thể tạo câu hỏi trong ngân hàng' }, { status: 500 });
    }

    // Insert options if MCQ or SCENARIO
    if (data.options && data.options.length > 0) {
      const optInserts = data.options.map((opt, idx) => ({
        item_id: insertedItem.id,
        content: opt.content.trim(),
        is_correct: Boolean(opt.is_correct),
        explanation: opt.explanation?.trim() || null,
        order_index: opt.order_index || idx + 1,
      }));

      await supabase.from('question_bank_options').insert(optInserts);
    }

    return NextResponse.json({
      success: true,
      item: insertedItem,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
