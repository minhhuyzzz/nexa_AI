import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để vào phòng kiểm chứng' }, { status: 401 });
    }

    // 2. Fetch module and linked assessment
    const { data: moduleRecord, error: moduleError } = await adminSupabase
      .from('learning_modules')
      .select(`
        id,
        title,
        description,
        content_markdown,
        domain_code,
        skill_code,
        order_index,
        duration_minutes,
        point_reward,
        assessment_id,
        is_published,
        assessments (
          id,
          title,
          passing_score,
          duration_minutes,
          point_reward,
          security_settings
        )
      `)
      .eq('id', moduleId)
      .maybeSingle();

    if (moduleError || !moduleRecord || !moduleRecord.is_published) {
      return NextResponse.json({ error: 'Không tìm thấy học phần kiểm chứng' }, { status: 404 });
    }

    if (!moduleRecord.assessment_id) {
      return NextResponse.json(
        { error: 'Học phần chưa được gán đề kiểm chứng từ Ngân hàng đề' },
        { status: 400 }
      );
    }

    const assessment = Array.isArray(moduleRecord.assessments)
      ? moduleRecord.assessments[0]
      : moduleRecord.assessments;

    // 3. Cooldown: Disabled per system requirements to allow immediate retakes
    const isOnCooldown = false;
    const cooldownRemainingSeconds = 0;

    const { data: recentSubmissions } = await adminSupabase
      .from('assessment_submissions')
      .select('id, is_passed, submitted_at, percentage')
      .eq('user_id', user.id)
      .eq('assessment_id', moduleRecord.assessment_id)
      .order('submitted_at', { ascending: false })
      .limit(1);

    const lastSub = recentSubmissions?.[0];

    // 4. Fetch questions with options and explanations for instant feedback
    const { data: rawItems, error: itemsError } = await adminSupabase
      .from('assessment_items')
      .select(`
        id,
        type,
        prompt,
        points,
        order_index,
        rubric_guide,
        item_options (
          id,
          content,
          order_index,
          is_correct,
          explanation
        )
      `)
      .eq('assessment_id', moduleRecord.assessment_id)
      .order('order_index', { ascending: true });

    if (itemsError || !rawItems || rawItems.length === 0) {
      return NextResponse.json(
        { error: 'Bài kiểm chứng hiện chưa có câu hỏi trong Ngân hàng đề' },
        { status: 400 }
      );
    }

    const shouldShuffle = assessment?.security_settings?.shuffleQuestions !== false;
    const solutionMap: Record<string, { correctOptionId: string; explanation: string }> = {};

    const processedItems = rawItems.map((item) => {
      const opts = [...(item.item_options || [])];
      const correctOpt = opts.find((o: any) => o.is_correct);
      if (correctOpt) {
        solutionMap[item.id] = {
          correctOptionId: correctOpt.id,
          explanation: correctOpt.explanation || 'Đáp án chuẩn xác theo khung năng lực số.',
        };
      }

      if (shouldShuffle) {
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
      } else {
        opts.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
      }

      return {
        id: item.id,
        type: item.type,
        prompt: item.prompt,
        points: Number(item.points) > 0 ? Number(item.points) : 1,
        orderIndex: item.order_index,
        rubricGuide: item.rubric_guide || null,
        options: opts.map((opt: any) => ({
          id: opt.id,
          content: opt.content,
          order_index: opt.order_index,
        })),
      };
    });

    if (shouldShuffle) {
      for (let i = processedItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [processedItems[i], processedItems[j]] = [processedItems[j], processedItems[i]];
      }
    }

    return NextResponse.json({
      success: true,
      module: {
        id: moduleRecord.id,
        title: moduleRecord.title,
        description: moduleRecord.description,
        contentMarkdown: moduleRecord.content_markdown,
        orderIndex: moduleRecord.order_index,
        domainCode: moduleRecord.domain_code,
        skillCode: moduleRecord.skill_code,
        durationMinutes: assessment?.duration_minutes || moduleRecord.duration_minutes || 15,
        pointReward: assessment?.point_reward || moduleRecord.point_reward || 30,
        passingScore: Number(assessment?.passing_score ?? 70),
        securitySettings: (assessment?.security_settings as Record<string, any>) || {
          antiTabSwitch: true,
          maxTabSwitchViolations: 3,
          antiCopy: true,
          cooldownMinutes: 15,
        },
      },
      assessment: {
        id: assessment?.id,
        title: assessment?.title,
        securitySettings: (assessment?.security_settings as Record<string, any>) || {},
      },
      candidate: {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Thí sinh',
        email: user.email || '',
      },
      items: processedItems,
      solutionMap,
      isOnCooldown,
      cooldownRemainingSeconds,
      lastSubmission: lastSub
        ? {
            isPassed: lastSub.is_passed,
            percentage: lastSub.percentage,
            submittedAt: lastSub.submitted_at,
          }
        : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
