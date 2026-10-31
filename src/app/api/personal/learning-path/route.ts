import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const updateStepSchema = z.object({
  analysisId: z.string().uuid('Mã phân tích (analysisId) không hợp lệ'),
  stepNumber: z.number().int().min(1).max(20),
  completed: z.boolean().default(true),
});

interface PathwayStepItem {
  stepNumber: number;
  title: string;
  targetSkill?: string;
  durationHours?: number | string;
  duration?: string;
  objective: string;
  actionText?: string;
  moduleId?: string;
  is_completed?: boolean;
  completed_at?: string | null;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch latest AI analysis with 4-step pathway
    const { data: latestAnalysis } = await adminSupabase
      .from('competency_analyses')
      .select('id, submission_id, overall_level, radar_data, skill_gaps, strengths, weaknesses, pedagogical_feedback, learning_pathway, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch module progress
    const { data: progressList } = await adminSupabase
      .from('user_learning_progress')
      .select('module_id, is_completed, completed_at, points_awarded')
      .eq('user_id', user.id);

    // 4. Fetch published modules
    const { data: modules } = await adminSupabase
      .from('learning_modules')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    return NextResponse.json({
      success: true,
      analysis: latestAnalysis || null,
      progress: progressList || [],
      modules: modules || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateStepSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { analysisId, stepNumber, completed } = validated.data;

    // 2. Load the target analysis record
    const { data: analysis, error: fetchErr } = await adminSupabase
      .from('competency_analyses')
      .select('id, user_id, learning_pathway')
      .eq('id', analysisId)
      .maybeSingle();

    if (fetchErr || !analysis) {
      return NextResponse.json({ error: 'Không tìm thấy lộ trình học tập tương ứng' }, { status: 404 });
    }

    if (analysis.user_id !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa lộ trình này' }, { status: 403 });
    }

    // 3. Update the matching step in learning_pathway JSON
    const pathway = (analysis.learning_pathway as PathwayStepItem[]) || [];
    let updated = false;

    const newPathway = pathway.map((step) => {
      if (step.stepNumber === stepNumber) {
        updated = true;
        return {
          ...step,
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        };
      }
      return step;
    });

    if (!updated) {
      // Step number might not exist in array yet, add or adjust
      return NextResponse.json({ error: `Không tìm thấy bước số ${stepNumber} trong lộ trình` }, { status: 404 });
    }

    const { error: updateErr } = await adminSupabase
      .from('competency_analyses')
      .update({
        learning_pathway: newPathway,
      })
      .eq('id', analysisId);

    if (updateErr) {
      return NextResponse.json({ error: 'Không thể cập nhật tiến độ lộ trình' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: completed ? 'Đã hoàn thành bước học' : 'Đã bỏ đánh dấu hoàn thành',
      learningPathway: newPathway,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
