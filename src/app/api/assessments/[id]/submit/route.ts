import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const submitSchema = z.object({
  submissionId: z.string().uuid().optional(),
  timeSpentSeconds: z.number().int().min(0).default(0),
  answers: z.array(
    z.object({
      itemId: z.string().uuid(),
      selectedOptionId: z.string().uuid().nullable().optional(),
      textResponse: z.string().optional(),
      evidenceUrl: z.string().optional().nullable(),
      liveUrl: z.string().optional().nullable(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = performance.now();

  try {
    const { id: assessmentId } = await params;
    const body = await request.json();
    const validated = submitSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu nộp bài không hợp lệ' },
        { status: 400 }
      );
    }

    const { submissionId, timeSpentSeconds, answers } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate candidate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch assessment settings
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, passing_score, point_reward')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Bài đánh giá không tồn tại' }, { status: 404 });
    }

    // 3. Fetch all correct options for instant pure code evaluation (0.01s)
    const { data: items, error: itemsError } = await supabase
      .from('assessment_items')
      .select(`
        id,
        points,
        type,
        competency_id,
        item_options (
          id,
          is_correct
        )
      `)
      .eq('assessment_id', assessmentId);

    if (itemsError || !items) {
      return NextResponse.json({ error: 'Không thể tải đáp án kiểm tra' }, { status: 500 });
    }

    // Map correct option ids
    const itemMap = new Map<string, { points: number; correctOptionId: string | null }>();
    let maxScore = 0;

    for (const item of items) {
      maxScore += Number(item.points);
      const correctOption = item.item_options?.find((opt: { is_correct: boolean }) => opt.is_correct);
      itemMap.set(item.id, {
        points: Number(item.points),
        correctOptionId: correctOption?.id || null,
      });
    }

    // 4. Evaluate each answer using pure algorithmic code (Zero AI calls)
    let totalScore = 0;
    const answerRecords: {
      item_id: string;
      selected_option_id: string | null;
      text_response: string | null;
      evidence_url: string | null;
      live_url: string | null;
      score_awarded: number;
      is_correct: boolean;
      auto_graded: boolean;
    }[] = [];

    const answerMap = new Map(answers.map((a) => [a.itemId, a]));

    for (const [itemId, info] of itemMap.entries()) {
      const candidateAns = answerMap.get(itemId);
      const selectedOptionId = candidateAns?.selectedOptionId || null;
      const textResponse = candidateAns?.textResponse || null;
      const evidenceUrl = candidateAns?.evidenceUrl || null;
      const liveUrl = candidateAns?.liveUrl || null;

      const isCorrect = selectedOptionId !== null && selectedOptionId === info.correctOptionId;
      const scoreAwarded = isCorrect ? info.points : 0;
      totalScore += scoreAwarded;

      answerRecords.push({
        item_id: itemId,
        selected_option_id: selectedOptionId,
        text_response: textResponse,
        evidence_url: evidenceUrl,
        live_url: liveUrl,
        score_awarded: scoreAwarded,
        is_correct: isCorrect,
        auto_graded: true,
      });
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    // Điểm bài thi quy đổi theo Thang điểm 10 chuẩn Việt Nam (0.0 - 10.0)
    const scoreOn10 = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) / 10 : 0;
    // Chuẩn đạt: scoreOn10 >= 7.0 (tương đương >= 70%)
    const isPassed = scoreOn10 >= 7.0;

    // 5. Create or Update submission record in database
    let activeSubmissionId = submissionId;

    // Cơ chế chống farm lặp: Mỗi bài thi đạt chuẩn chỉ được cộng +10 điểm tích lũy 1 lần duy nhất cho mỗi học viên
    let pointsAwarded = 0;
    if (isPassed) {
      let previousQuery = supabase
        .from('assessment_submissions')
        .select('id')
        .eq('assessment_id', assessmentId)
        .eq('user_id', user.id)
        .eq('is_passed', true);

      if (activeSubmissionId) {
        previousQuery = previousQuery.neq('id', activeSubmissionId);
      }

      const { data: previousPassed } = await previousQuery.limit(1);

      if (!previousPassed || previousPassed.length === 0) {
        pointsAwarded = 10;
      }
    }

    // 5. Create or Update submission record in database
    if (activeSubmissionId) {
      await supabase
        .from('assessment_submissions')
        .update({
          status: 'SUBMITTED',
          total_score: totalScore,
          max_score: maxScore,
          percentage: Number(percentage.toFixed(2)),
          points_awarded: pointsAwarded,
          is_passed: isPassed,
          time_spent_seconds: timeSpentSeconds,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', activeSubmissionId);
    } else {
      const { data: newSub, error: subError } = await supabase
        .from('assessment_submissions')
        .insert({
          assessment_id: assessmentId,
          user_id: user.id,
          status: 'SUBMITTED',
          total_score: totalScore,
          max_score: maxScore,
          percentage: Number(percentage.toFixed(2)),
          points_awarded: pointsAwarded,
          is_passed: isPassed,
          time_spent_seconds: timeSpentSeconds,
          submitted_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (subError || !newSub) {
        return NextResponse.json({ error: 'Không thể tạo bản ghi nộp bài' }, { status: 500 });
      }
      activeSubmissionId = newSub.id;
    }

    // 6. Save answer records
    const answersWithSubId = answerRecords.map((ans) => ({
      ...ans,
      submission_id: activeSubmissionId,
    }));

    await supabase.from('submission_answers').insert(answersWithSubId);

    // 7. Award points (+10 điểm tích lũy mở chứng chỉ) to candidate profile
    if (pointsAwarded > 0) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      const currentPoints = currentProfile?.points || 0;
      await supabase
        .from('profiles')
        .update({
          points: currentPoints + pointsAwarded,
          avg_competency_score: Number(percentage.toFixed(2)),
        })
        .eq('id', user.id);
    }

    const executionTimeMs = (performance.now() - startTime).toFixed(2);

    return NextResponse.json({
      success: true,
      submissionId: activeSubmissionId,
      totalScore,
      maxScore,
      scoreOn10,
      percentage: Number(percentage.toFixed(1)),
      pointsAwarded,
      isPassed,
      passingScore: 7.0,
      executionTimeMs: `${executionTimeMs}ms`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi nộp bài';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
