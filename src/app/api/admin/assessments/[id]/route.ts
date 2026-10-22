import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      .single();

    if (error || !assessment) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí' }, { status: 404 });
    }

    return NextResponse.json({ assessment });
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

    const updatePayload: Record<string, any> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.access_tier) {
      updatePayload.is_vip = parsed.data.access_tier === 'VIP';
    } else if (parsed.data.is_vip !== undefined) {
      updatePayload.access_tier = parsed.data.is_vip ? 'VIP' : 'FREE';
    }

    const { data: updated, error } = await supabase
      .from('assessments')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assessment:', error);
      return NextResponse.json({ error: 'Không thể cập nhật bài khảo thí' }, { status: 500 });
    }

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
    const { id } = await params;
    const supabase = await createClient();

    // Check if there are active submissions
    const { count: submissionCount } = await supabase
      .from('assessment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', id);

    if (submissionCount && submissionCount > 0) {
      // Soft unpublish to protect submission history integrity
      const { error } = await supabase
        .from('assessments')
        .update({ is_published: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: 'Không thể ẩn bài khảo thí' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Bài thi đã có thí sinh nộp bài nên được chuyển sang trạng thái Ẩn thay vì xóa cứng',
        softDeleted: true,
      });
    }

    // Otherwise, clean delete
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assessment:', error);
      return NextResponse.json({ error: 'Không thể xóa bài khảo thí' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa bài khảo thí thành công' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
