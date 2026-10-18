import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch published modules
    const { data: modules, error: modError } = await supabase
      .from('learning_modules')
      .select(`
        id,
        competency_id,
        domain_code,
        skill_code,
        title,
        description,
        duration_minutes,
        point_reward,
        order_index,
        content_markdown,
        competencies (
          name,
          skill_code
        )
      `)
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (modError) {
      console.error('Error fetching learning modules:', modError);
      return NextResponse.json({ error: 'Không thể tải danh sách học liệu' }, { status: 500 });
    }

    // 3. Fetch user progress for these modules
    const { data: progress } = await supabase
      .from('user_learning_progress')
      .select('module_id, is_completed, points_awarded, completed_at')
      .eq('user_id', user.id);

    const progressMap = new Map((progress || []).map((p) => [p.module_id, p]));

    const formattedModules = (modules || []).map((m) => {
      const prog = progressMap.get(m.id);
      const rawComp = Array.isArray(m.competencies) ? m.competencies[0] : m.competencies;

      return {
        id: m.id,
        competencyId: m.competency_id,
        domainCode: m.domain_code,
        skillCode: m.skill_code,
        skillName: rawComp?.name || '',
        title: m.title,
        description: m.description,
        durationMinutes: m.duration_minutes,
        pointReward: m.point_reward,
        orderIndex: m.order_index,
        contentMarkdown: m.content_markdown,
        isCompleted: Boolean(prog?.is_completed),
        completedAt: prog?.completed_at || null,
      };
    });

    return NextResponse.json({ modules: formattedModules });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
