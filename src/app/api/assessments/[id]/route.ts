import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch assessment details
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase
      .from('assessments')
      .select('id, title, description, duration_minutes, passing_score, point_reward, is_vip, access_tier')
      .eq('is_published', true);

    if (isUUID) {
      query = query.eq('id', id);
    }

    const { data: assessment, error: assessmentError } = await query.limit(1).maybeSingle();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài đánh giá hoặc bài chưa được công bố' },
        { status: 404 }
      );
    }

    // 3. Fetch questions and options (SECURITY: strictly omit is_correct)
    const { data: items, error: itemsError } = await supabase
      .from('assessment_items')
      .select(`
        id,
        prompt,
        points,
        type,
        order_index,
        difficulty_level,
        competency_id,
        competencies (
          skill_code,
          title
        ),
        item_options (
          id,
          content,
          order_index
        )
      `)
      .eq('assessment_id', assessment.id)
      .order('order_index', { ascending: true });

    if (itemsError) {
      return NextResponse.json({ error: 'Không thể tải danh sách câu hỏi' }, { status: 500 });
    }

    // Sort options by order_index
    const sanitizedItems = (items || []).map((item) => ({
      ...item,
      options: (item.item_options || []).sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
      ),
      item_options: undefined,
    }));

    return NextResponse.json({
      assessment,
      items: sanitizedItems,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
