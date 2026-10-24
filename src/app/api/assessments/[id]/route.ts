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

    // 3. Fetch questions and options via leak-proof RPC (Zero is_correct / explanation leaks)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_assessment_for_candidate', {
      p_assessment_id: assessment.id,
    });

    if (rpcError || !rpcData) {
      return NextResponse.json({ error: 'Không thể tải danh sách câu hỏi' }, { status: 500 });
    }

    return NextResponse.json({
      assessment: {
        ...assessment,
        ...((rpcData as { assessment?: Record<string, unknown> }).assessment || {}),
      },
      items: (rpcData as { items?: unknown[] }).items || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
