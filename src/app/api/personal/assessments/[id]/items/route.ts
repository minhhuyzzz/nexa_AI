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

    // Verify ownership or org role
    const { data: assessment, error: asmError } = await db
      .from('assessments')
      .select('id, created_by, owner_user_id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (asmError || !assessment) {
      return NextResponse.json({ error: 'Không tìm thấy đề đánh giá' }, { status: 404 });
    }

    let hasAccess = assessment.created_by === user.id || assessment.owner_user_id === user.id;

    if (!hasAccess && assessment.organization_id) {
      const { data: membership } = await db
        .from('user_organizations')
        .select('org_role, status')
        .eq('organization_id', assessment.organization_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (
        membership &&
        membership.status === 'ACTIVE' &&
        ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(membership.org_role)
      ) {
        hasAccess = true;
      }
    }

    // Platform Admin has global access to system canonical assessments
    if (!hasAccess && assessment.organization_id === null) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const profileRole = userProfile?.role;
      if (profileRole === 'ADMIN') {
        hasAccess = true;
      } else {
        const { data: adminProfile } = await db
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (adminProfile?.role === 'ADMIN') {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
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

    // Mapping 5 standard DigComp domain codes to canonical primary competencies
    const DOMAIN_COMPETENCY_MAP: Record<string, string> = {
      '01': '6c475f25-7c43-4a43-888f-450c0d103d44',
      '02': '6f292fe4-93cc-4679-b611-031b63b00298',
      '03': '40bf0ca8-e831-4b08-a017-26d087895e19',
      '04': '202b3822-953d-4675-ad29-45c1ecc22789',
      '05': '4f90cac7-901f-40be-a292-d9670b16baa5',
    };

    // 1. Remove old items (item_options will CASCADE on delete)
    await db.from('assessment_items').delete().eq('assessment_id', id);

    if (questions.length === 0) {
      await db
        .from('assessments')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);
      return NextResponse.json({ success: true, count: 0 });
    }

    // 2. Prepare items with valid difficulty_level and competency mapping
    const itemRows = questions.map((q, idx) => {
      let dbType = 'MCQ';
      if (q.type === 'SCENARIO') dbType = 'SCENARIO';
      if (q.type === 'PRACTICAL' || q.type === 'OPEN_RESPONSE') dbType = 'PRACTICAL_TASK';
      if (q.type === 'CHOICE') dbType = 'MCQ';

      const questionContext = q.context || q.scenarioContext || null;
      const submissionModes = q.allowedSubmissionModes || ['TEXT', 'FILE', 'URL'];
      const compId = DOMAIN_COMPETENCY_MAP[q.domainCode] || DOMAIN_COMPETENCY_MAP['01'];

      return {
        assessment_id: id,
        prompt: q.prompt || 'Câu hỏi chưa có nội dung',
        type: dbType,
        points: q.points ?? 10,
        difficulty_level: 'INTERMEDIATE',
        competency_id: compId,
        context: questionContext,
        submission_modes: submissionModes,
        rubric_guide: q.practicalGuide || null,
        order_index: idx,
      };
    });

    // 3. Batch insert assessment items in a single query
    const { data: insertedItems, error: itemsErr } = await db
      .from('assessment_items')
      .insert(itemRows)
      .select('id, order_index');

    if (itemsErr || !insertedItems) {
      console.error('[BATCH_INSERT_ITEMS_ERROR]:', itemsErr);
      return NextResponse.json({ error: 'Không thể lưu câu hỏi' }, { status: 500 });
    }

    // 4. Batch insert options for MCQ / CHOICE items in a single query
    const optionRows: any[] = [];
    const itemsList = Array.isArray(insertedItems) ? insertedItems : [insertedItems];
    itemsList.forEach((item) => {
      const q = questions[item.order_index ?? 0];
      if (q && q.type !== 'PRACTICAL' && q.type !== 'OPEN_RESPONSE' && q.options && q.options.length > 0) {
        q.options.forEach((opt, oIdx) => {
          optionRows.push({
            item_id: item.id,
            content: opt.text || `Phương án ${String.fromCharCode(65 + oIdx)}`,
            is_correct: Boolean(opt.isCorrect),
            explanation: opt.explanation || (Boolean(opt.isCorrect) && q.practicalGuide ? q.practicalGuide : null),
            order_index: oIdx,
          });
        });
      }
    });

    if (optionRows.length > 0) {
      const { error: optErr } = await db.from('item_options').insert(optionRows);
      if (optErr) {
        console.error('[BATCH_INSERT_OPTIONS_ERROR]:', optErr);
      }
    }

    // 5. Update assessment updated_at
    await db
      .from('assessments')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true, count: itemsList.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
