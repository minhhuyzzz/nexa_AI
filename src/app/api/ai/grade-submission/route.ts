import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAIAdapter } from '@/features/ai-gateway/adapters';
import { RubricDef } from '@/features/ai-gateway/types/grading.types';
import { AIUsageLoggerService } from '@/features/ai-gateway/services/ai-usage-logger.service';

const requestSchema = z.object({
  submissionId: z.string().uuid('Mã bài nộp (submissionId) không hợp lệ'),
  itemId: z.string().uuid('Mã câu hỏi/tình huống (itemId) không hợp lệ'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu yêu cầu không hợp lệ' },
        { status: 400 }
      );
    }

    const { submissionId, itemId } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để chấm AI' }, { status: 401 });
    }

    // 2. Query user profile to verify role and check AI credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ người dùng' }, { status: 404 });
    }

    // Learners must have at least 1 credit (Evaluators & Admins have institutional quota)
    if (profile.role === 'LEARNER' && (profile.credits ?? 0) <= 0) {
      return NextResponse.json(
        {
          error: 'Bạn đã hết AI credits. Vui lòng nâng cấp gói để nhận thêm credits.',
          code: 'OUT_OF_CREDITS',
        },
        { status: 403 }
      );
    }

    // 3. Verify submission existence and strict resource-level authorization
    const { data: submission, error: subError } = await supabase
      .from('assessment_submissions')
      .select('id, user_id, status, assessment_id, class_assignment_id')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Bài nộp không tồn tại' }, { status: 404 });
    }

    // Kiểm tra quyền hạn theo tài nguyên (Resource-Level Authorization):
    if (submission.user_id !== user.id && profile.role !== 'ADMIN') {
      // Người gọi là Giảng viên/Chuyên gia khảo thí: phải phụ trách đề thi hoặc lớp học của học viên
      const { data: asm } = await supabase
        .from('assessments')
        .select('created_by, owner_user_id')
        .eq('id', submission.assessment_id)
        .single();

      const isAssessmentOwner =
        asm && (asm.created_by === user.id || asm.owner_user_id === user.id);

      let isClassEvaluator = false;
      if (!isAssessmentOwner) {
        const { data: classRows } = await supabase
          .from('evaluator_classes')
          .select('id, class_members!inner(user_id)')
          .or(`evaluator_id.eq.${user.id},owner_user_id.eq.${user.id}`)
          .eq('class_members.user_id', submission.user_id)
          .limit(1);

        isClassEvaluator = Boolean(classRows && classRows.length > 0);
      }

      if (!isAssessmentOwner && !isClassEvaluator) {
        return NextResponse.json(
          { error: 'Bạn không có thẩm quyền yêu cầu chấm bài thi của học viên này' },
          { status: 403 }
        );
      }
    }

    // 4. Fetch candidate's response
    const { data: answer, error: answerError } = await supabase
      .from('submission_answers')
      .select('id, text_response, evidence_url')
      .eq('submission_id', submissionId)
      .eq('item_id', itemId)
      .single();

    if (answerError || !answer || !answer.text_response?.trim()) {
      return NextResponse.json(
        { error: 'Không tìm thấy câu trả lời tự luận/minh chứng của bài làm này để chấm' },
        { status: 400 }
      );
    }

    // 4. Fetch Question Item and its Rubric definition
    const { data: item, error: itemError } = await supabase
      .from('assessment_items')
      .select('id, prompt, points')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi tương ứng' }, { status: 404 });
    }

    const { data: rubrics, error: rubricError } = await supabase
      .from('rubrics')
      .select(`
        id,
        title,
        description,
        rubric_criteria (
          id,
          name,
          weight_percent,
          max_points,
          order_index,
          rubric_levels (
            level_name,
            score_percent,
            description
          )
        )
      `)
      .eq('item_id', itemId);

    if (rubricError || !rubrics || rubrics.length === 0) {
      return NextResponse.json(
        { error: 'Câu hỏi này chưa được thiết lập Rubric chuẩn để chấm AI' },
        { status: 400 }
      );
    }

    interface RawRubricLevel {
      level_name: string;
      score_percent: number;
      description: string;
    }

    interface RawRubricCriterion {
      id: string;
      name: string;
      weight_percent: number;
      max_points: number;
      rubric_levels: RawRubricLevel[];
    }

    const rawRubric = rubrics[0] as unknown as {
      title: string;
      description?: string | null;
      rubric_criteria: RawRubricCriterion[];
    };

    const rubricDef: RubricDef = {
      title: rawRubric.title,
      description: rawRubric.description || undefined,
      criteria: (rawRubric.rubric_criteria || []).map((crit: RawRubricCriterion) => ({
        id: crit.id,
        name: crit.name,
        weightPercent: Number(crit.weight_percent),
        maxPoints: Number(crit.max_points),
        levels: (crit.rubric_levels || []).map((lvl: RawRubricLevel) => ({
          levelName: lvl.level_name,
          scorePercent: Number(lvl.score_percent),
          description: lvl.description,
        })),
      })),
    };

    // 5. Invoke AI Gateway via GeminiAdapter
    const startTime = performance.now();
    const adapter = getAIAdapter('GOOGLE_GEMINI');
    let evaluation;
    let evalError: unknown = null;

    try {
      evaluation = await adapter.gradeRubricSubmission({
        taskPrompt: item.prompt,
        studentResponse: answer.text_response,
        rubric: rubricDef,
      });
    } catch (err) {
      evalError = err;
    }

    const latencyMs = Math.round(performance.now() - startTime);

    // Log AI Usage Event
    await AIUsageLoggerService.logUsage(supabase, {
      userId: user.id,
      feature: 'RUBRIC_GRADING',
      provider: 'GOOGLE_GEMINI',
      model: adapter.defaultModel,
      latencyMs,
      status: evalError ? 'FAILED' : 'SUCCESS',
      errorMessage: evalError ? (evalError instanceof Error ? evalError.message : String(evalError)) : null,
      promptTokens: Math.round((item.prompt.length + (answer.text_response?.length || 0) + 500) / 4),
      completionTokens: evaluation ? Math.round(JSON.stringify(evaluation).length / 4) : 0,
    });

    if (evalError || !evaluation) {
      throw evalError;
    }

    // 6. Save AI evaluation result into public.ai_evaluations as DRAFT for Evaluator review
    const { data: evalRecord, error: saveError } = await supabase
      .from('ai_evaluations')
      .insert({
        submission_id: submissionId,
        item_id: itemId,
        model_name: adapter.defaultModel,
        total_score: evaluation.totalScore,
        max_score: evaluation.maxScore,
        confidence_score: evaluation.confidenceScore,
        confidence_flag: evaluation.confidenceFlag,
        evidence_quote: evaluation.evidenceQuote,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        feedback: evaluation.feedback,
        criterion_scores: evaluation.criterionScores,
        status: 'DRAFT',
      })
      .select('id, created_at')
      .single();

    if (saveError) {
      console.error('Failed to save AI evaluation:', saveError);
    }

    // 7. Update answer score in submission_answers and mark submission as AI_DRAFT
    await supabase
      .from('submission_answers')
      .update({
        score_awarded: evaluation.totalScore,
        auto_graded: false, // Mark as AI graded with Rubric
      })
      .eq('id', answer.id);

    await supabase
      .from('assessment_submissions')
      .update({
        grading_status: 'AI_DRAFT',
      })
      .eq('id', submissionId);

    // 8. Atomic Credit Deduction for Learner (Zero race conditions, enforced by DB trigger)
    let remainingCredits = profile.credits;
    if (profile.role === 'LEARNER') {
      const { data: newCredits, error: deductError } = await supabase.rpc('deduct_ai_credits', {
        p_user_id: user.id,
        p_amount: 1,
      });

      if (!deductError && typeof newCredits === 'number') {
        remainingCredits = newCredits;
      } else {
        remainingCredits = Math.max(0, (profile.credits ?? 1) - 1);
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: {
        id: evalRecord?.id,
        totalScore: evaluation.totalScore,
        maxScore: evaluation.maxScore,
        confidenceScore: evaluation.confidenceScore,
        confidenceFlag: evaluation.confidenceFlag, // 'GREEN' | 'AMBER' | 'RED'
        evidenceQuote: evaluation.evidenceQuote,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        feedback: evaluation.feedback,
        criterionScores: evaluation.criterionScores,
        modelName: adapter.defaultModel,
      },
      creditsRemaining: remainingCredits,
    });
  } catch (err) {
    console.error('Error in AI grading endpoint:', err);
    const message = err instanceof Error ? err.message : 'Lỗi trong quá trình chấm AI';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
