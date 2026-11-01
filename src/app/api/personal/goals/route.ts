import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const goalSchema = z.object({
  title: z.string().min(3, 'Mục tiêu phải có ít nhất 3 ký tự').max(200, 'Mục tiêu tối đa 200 ký tự'),
  track: z.string().min(2).max(50).default('Lộ trình cơ bản'),
  pace: z.string().min(2).max(50).default('Học theo tốc độ riêng'),
});

const DEFAULT_GOAL = {
  title: 'Nâng cao kỹ năng sử dụng công nghệ trong học tập và công việc',
  track: 'Lộ trình cơ bản',
  pace: 'Học theo tốc độ riêng',
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const savedGoal = user.user_metadata?.learning_goal || DEFAULT_GOAL;

    return NextResponse.json({
      success: true,
      goal: savedGoal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi lấy mục tiêu học tập';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu mục tiêu không hợp lệ' },
        { status: 400 }
      );
    }

    const updatedGoal = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        learning_goal: updatedGoal,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi cập nhật mục tiêu';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
