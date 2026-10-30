import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';
import { createAdminClient } from '@/lib/supabase/admin';

const completeSchema = z.object({
  moduleId: z.string().uuid('Mã bài học (moduleId) không hợp lệ'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = completeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { moduleId } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch learning module
    const { data: moduleData, error: modError } = await supabase
      .from('learning_modules')
      .select('id, title, point_reward, skill_code')
      .eq('id', moduleId)
      .single();

    if (modError || !moduleData) {
      return NextResponse.json({ error: 'Bài học không tồn tại' }, { status: 404 });
    }

    const pointsToAward = moduleData.point_reward ?? 30; // Standard +30 điểm (point)

    // 3. Check existing progress
    const { data: existingProgress } = await supabase
      .from('user_learning_progress')
      .select('id, is_completed')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .single();

    if (existingProgress?.is_completed) {
      return NextResponse.json({
        alreadyCompleted: true,
        message: 'Bạn đã hoàn thành bài học này trước đó.',
        pointsAwarded: 0,
      });
    }

    // 4. Record completion in user_learning_progress
    const { error: upsertError } = await supabase
      .from('user_learning_progress')
      .upsert(
        {
          user_id: user.id,
          module_id: moduleId,
          is_completed: true,
          points_awarded: pointsToAward,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id' }
      );

    if (upsertError) {
      console.error('Error saving learning progress:', upsertError);
      return NextResponse.json({ error: 'Không thể ghi nhận tiến độ học tập' }, { status: 500 });
    }

    // 5. Award points through immutable Point Ledger (Atomic & Idempotent)
    let newTotalPoints = 0;
    if (pointsToAward > 0) {
      const grantResult = await PointLedgerService.grantPoints(createAdminClient(), {
        userId: user.id,
        delta: pointsToAward,
        eventType: 'MODULE_COMPLETED',
        sourceType: 'MODULE',
        sourceId: moduleId,
        idempotencyKey: `MODULE_COMPLETION_${user.id}_${moduleId}`,
        metadata: {
          module_id: moduleId,
          skill_code: moduleData.skill_code,
          title: moduleData.title,
        },
      });
      newTotalPoints = grantResult.points;
    }

    return NextResponse.json({
      success: true,
      pointsAwarded: pointsToAward,
      newTotalPoints,
      skillCode: moduleData.skill_code,
      message: `Chúc mừng bạn đã hoàn thành bài học và nhận +${pointsToAward} điểm (point)! Đã mở khóa quyền đánh giá lại kỹ năng.`,
    });
  } catch (err) {
    console.error('Error in complete module endpoint:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
