import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';

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

    // 2. Fetch learning module with governance & prerequisite fields (UC-A34)
    const { data: moduleData, error: modError } = await supabase
      .from('learning_modules')
      .select('id, title, point_reward, skill_code, is_published, path_id, assessment_id, prerequisite_module_id')
      .eq('id', moduleId)
      .single();

    if (modError || !moduleData) {
      return NextResponse.json({ error: 'Bài học không tồn tại' }, { status: 404 });
    }

    // 2.1. Verify published state of module
    if (moduleData.is_published === false) {
      return NextResponse.json({ error: 'Bài học này chưa được phát hành' }, { status: 403 });
    }

    // 2.2. Verify published state of parent learning path if attached
    if (moduleData.path_id) {
      const { data: pathData } = await supabase
        .from('learning_paths')
        .select('id, is_published')
        .eq('id', moduleData.path_id)
        .maybeSingle();

      if (pathData && pathData.is_published === false) {
        return NextResponse.json({ error: 'Lộ trình học tập của bài học này chưa được mở' }, { status: 403 });
      }
    }

    // 2.3. Check prerequisite module completion (anti-spam gate)
    if (moduleData.prerequisite_module_id) {
      const { data: prereqProgress } = await supabase
        .from('user_learning_progress')
        .select('id, is_completed')
        .eq('user_id', user.id)
        .eq('module_id', moduleData.prerequisite_module_id)
        .maybeSingle();

      if (!prereqProgress?.is_completed) {
        return NextResponse.json(
          {
            error: 'Bạn cần hoàn thành bài học tiên quyết trước khi hoàn thành bài học này',
            code: 'PREREQUISITE_REQUIRED',
          },
          { status: 403 }
        );
      }
    }

    // 2.4. Check required assessment completion if attached
    if (moduleData.assessment_id) {
      const { data: passingSub } = await supabase
        .from('assessment_submissions')
        .select('id, is_passed')
        .eq('user_id', user.id)
        .eq('assessment_id', moduleData.assessment_id)
        .eq('is_passed', true)
        .limit(1)
        .maybeSingle();

      if (!passingSub) {
        return NextResponse.json(
          {
            error: 'Bạn cần làm và đạt bài khảo thí của học phần này trước khi nhận điểm hoàn thành',
            code: 'ASSESSMENT_REQUIRED',
          },
          { status: 403 }
        );
      }
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
      const grantResult = await PointLedgerService.grantPoints(supabase, {
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
