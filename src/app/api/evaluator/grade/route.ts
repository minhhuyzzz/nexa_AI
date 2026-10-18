import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const evaluatorGradeSchema = z.object({
  submissionId: z.string().uuid(),
  itemId: z.string().uuid(),
  criterionScores: z.array(
    z.object({
      criterionId: z.string().uuid(),
      levelName: z.string(),
      score: z.number().min(0),
    })
  ),
  evaluatorFeedback: z.string().default(''),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = evaluatorGradeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu chấm điểm không hợp lệ' },
        { status: 400 }
      );
    }

    const { submissionId, itemId, criterionScores, evaluatorFeedback } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Verify evaluator or admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'EVALUATOR' && profile.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Chỉ Chuyên gia khảo thí (EVALUATOR) hoặc Quản trị viên mới có quyền thẩm định điểm' },
        { status: 403 }
      );
    }

    // 3. Calculate total score from criteria
    const totalAwarded = criterionScores.reduce((sum, c) => sum + c.score, 0);

    // 4. Update submission_answers
    const { error: updateAnswerError } = await supabase
      .from('submission_answers')
      .update({
        score_awarded: totalAwarded,
        auto_graded: false,
      })
      .eq('submission_id', submissionId)
      .eq('item_id', itemId);

    if (updateAnswerError) {
      return NextResponse.json({ error: 'Không thể cập nhật điểm câu hỏi' }, { status: 500 });
    }

    // 5. Recalculate submission total score
    const { data: allAnswers } = await supabase
      .from('submission_answers')
      .select('score_awarded')
      .eq('submission_id', submissionId);

    const newTotalScore = (allAnswers || []).reduce((acc, curr) => acc + Number(curr.score_awarded), 0);

    const { data: submission } = await supabase
      .from('assessment_submissions')
      .select('max_score, assessments(passing_score)')
      .eq('id', submissionId)
      .single();

    const maxScore = Number(submission?.max_score) || 100;
    const percentage = maxScore > 0 ? (newTotalScore / maxScore) * 100 : 0;
    // @ts-expect-error join
    const passingScore = Number(submission?.assessments?.passing_score) || 70;
    const isPassed = percentage >= passingScore;

    await supabase
      .from('assessment_submissions')
      .update({
        total_score: newTotalScore,
        percentage: Number(percentage.toFixed(2)),
        is_passed: isPassed,
        status: 'EVALUATED',
      })
      .eq('id', submissionId);

    return NextResponse.json({
      success: true,
      newTotalScore,
      percentage: Number(percentage.toFixed(2)),
      isPassed,
      evaluatedBy: user.id,
      evaluatorFeedback,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
