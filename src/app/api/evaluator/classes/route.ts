import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';

const createClassSchema = z.object({
  name: z.string().min(2, 'Tên nhóm tối thiểu 2 ký tự'),
  classCode: z.string().min(2, 'Mã nhóm tối thiểu 2 ký tự').optional(),
  description: z.string().optional(),
});

const updateClassSchema = z.object({
  id: z.string().uuid('Mã nhóm không hợp lệ'),
  name: z.string().min(2, 'Tên nhóm tối thiểu 2 ký tự'),
  description: z.string().optional(),
});

async function getEffectiveEvaluatorId(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id || null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const evaluatorId = await getEffectiveEvaluatorId(supabase);

    if (!evaluatorId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // Try fetching from evaluator_classes
    const { data: rawClasses, error: classError } = await supabase
      .from('evaluator_classes')
      .select(`
        id,
        name,
        class_code,
        description,
        created_at,
        class_members ( id ),
        class_assignments (
          id,
          assessment_id,
          deadline,
          assessments ( id, title, duration_minutes, passing_score )
        )
      `)
      .eq('evaluator_id', evaluatorId)
      .order('created_at', { ascending: false });

    if (classError) {
      console.warn('evaluator_classes query note:', classError.message);
      return NextResponse.json({ classes: [] });
    }

    const classes = (rawClasses || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.class_code,
      description: c.description || '',
      memberCount: c.class_members?.length || 0,
      activeExams: c.class_assignments?.length || 0,
      assignments: (c.class_assignments || []).map((a: any) => ({
        id: a.id,
        assessmentId: a.assessment_id,
        title: a.assessments?.title || 'Bài khảo thí',
        deadline: a.deadline,
      })),
      createdAt: c.created_at,
    }));

    return NextResponse.json({ classes });
  } catch (err: any) {
    console.error('Error in GET /api/evaluator/classes:', err);
    return NextResponse.json({ error: err.message || 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const evaluatorId = await getEffectiveEvaluatorId(supabase);

    if (!evaluatorId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // Server-side Quota Enforcement
    const quotaCheck = await QuotaEnforcementService.checkClassCreationQuota(supabase, evaluatorId);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason || 'Đã đạt giới hạn số lượng nhóm/lớp của gói dịch vụ', quota: quotaCheck },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;
    let code = parsed.data.classCode?.trim().toUpperCase();

    if (!code) {
      // Auto-generate clean code NX-XXXX (e.g. NX-4892)
      const rand = Math.floor(1000 + Math.random() * 9000);
      code = `NX-${rand}`;
    }

    const { data: newClass, error: insertError } = await supabase
      .from('evaluator_classes')
      .insert({
        evaluator_id: evaluatorId,
        owner_user_id: evaluatorId,
        visibility: 'PERSONAL',
        name: name.trim(),
        class_code: code,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating class:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Không thể tạo nhóm khảo thí.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, class: newClass });
  } catch (err: any) {
    console.error('Error in POST /api/evaluator/classes:', err);
    return NextResponse.json({ error: err.message || 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const evaluatorId = await getEffectiveEvaluatorId(supabase);

    if (!evaluatorId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { id, name, description } = parsed.data;

    const { data: updated, error: updateError } = await supabase
      .from('evaluator_classes')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .eq('id', id)
      .eq('evaluator_id', evaluatorId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating class:', updateError);
      return NextResponse.json({ error: updateError.message || 'Không thể cập nhật nhóm' }, { status: 500 });
    }

    return NextResponse.json({ success: true, class: updated });
  } catch (err: any) {
    console.error('Error in PUT /api/evaluator/classes:', err);
    return NextResponse.json({ error: err.message || 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const evaluatorId = await getEffectiveEvaluatorId(supabase);

    if (!evaluatorId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu mã nhóm khảo thí cần xóa' }, { status: 400 });
    }

    const { error: delError } = await supabase
      .from('evaluator_classes')
      .delete()
      .eq('id', id)
      .eq('evaluator_id', evaluatorId);

    if (delError) {
      console.error('Error deleting class:', delError);
      return NextResponse.json({ error: delError.message || 'Không thể xóa nhóm' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/evaluator/classes:', err);
    return NextResponse.json({ error: err.message || 'Lỗi máy chủ' }, { status: 500 });
  }
}
