import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';
import { createAdminClient } from '@/lib/supabase/admin';

const submitSchema = z.object({
  submissionId: z.string().uuid().optional(),
  classAssignmentId: z.string().uuid().optional(),
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

    const { submissionId, classAssignmentId, timeSpentSeconds, answers } = validated.data;
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

    const passingScore = Number(assessment.passing_score) || 70.0;
    const pointReward = Number(assessment.point_reward) || 10;

    // 3. Verify or initialize active submission with strict ownership check
    let activeSubmissionId = submissionId;

    if (activeSubmissionId) {
      const { data: existingSub, error: existingSubError } = await supabase
        .from('assessment_submissions')
        .select('id, user_id, status')
        .eq('id', activeSubmissionId)
        .single();

      if (existingSubError || !existingSub) {
        return NextResponse.json({ error: 'Bài nộp không tồn tại' }, { status: 404 });
      }

      if (existingSub.user_id !== user.id) {
        return NextResponse.json({ error: 'Bạn không có quyền nộp bài thi này' }, { status: 403 });
      }

      if (classAssignmentId) {
        await supabase
          .from('assessment_submissions')
          .update({ class_assignment_id: classAssignmentId })
          .eq('id', activeSubmissionId);
      }
    } else {
      const { data: newSub, error: subError } = await supabase
        .from('assessment_submissions')
        .insert({
          assessment_id: assessmentId,
          user_id: user.id,
          class_assignment_id: classAssignmentId || null,
          status: 'IN_PROGRESS',
        })
        .select('id')
        .single();

      if (subError || !newSub) {
        return NextResponse.json({ error: 'Không thể tạo bản ghi nộp bài' }, { status: 500 });
      }
      activeSubmissionId = newSub.id;
    }

    // 4. Fetch all correct options via secure RPC (Zero AI calls, pure algorithmic evaluation)
    const { data: items, error: itemsError } = await supabase.rpc(
      'get_assessment_answer_keys_for_submission',
      {
        p_assessment_id: assessmentId,
        p_submission_id: activeSubmissionId,
      }
    );

    if (itemsError || !items) {
      return NextResponse.json({ error: 'Không thể tải đáp án kiểm tra' }, { status: 500 });
    }

    // Map correct option ids
    const itemMap = new Map<string, { points: number; correctOptionId: string | null }>();
    let maxScore = 0;

    for (const item of items as { item_id: string; points: number; correct_option_id: string | null }[]) {
      const pts = Number(item.points);
      maxScore += pts;
      itemMap.set(item.item_id, {
        points: pts,
        correctOptionId: item.correct_option_id || null,
      });
    }

    // 5. Evaluate each answer using pure algorithmic code (0.01s instant response)
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
    // Chuẩn đạt ĐỘNG theo cấu hình đề thi (passing_score)
    const isPassed = percentage >= passingScore;

    // 6. Anti-farming check: Each passed assessment only awards points once per candidate
    let pointsAwarded = 0;
    if (isPassed && pointReward > 0) {
      const { data: previousPassed } = await supabase
        .from('assessment_submissions')
        .select('id')
        .eq('assessment_id', assessmentId)
        .eq('user_id', user.id)
        .eq('is_passed', true)
        .neq('id', activeSubmissionId)
        .limit(1);

      if (!previousPassed || previousPassed.length === 0) {
        pointsAwarded = pointReward;
      }
    }

    // 7. Update submission record to SUBMITTED
    await supabase
      .from('assessment_submissions')
      .update({
        status: 'SUBMITTED',
        grading_status: 'PENDING_REVIEW',
        total_score: totalScore,
        max_score: maxScore,
        percentage: Number(percentage.toFixed(2)),
        points_awarded: pointsAwarded,
        is_passed: isPassed,
        time_spent_seconds: timeSpentSeconds,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', activeSubmissionId);

    // 8. Save candidate answer records
    const answersWithSubId = answerRecords.map((ans) => ({
      ...ans,
      submission_id: activeSubmissionId,
    }));

    await supabase.from('submission_answers').insert(answersWithSubId);

    // 9. Atomic Point Ledger Grant (Eliminates race conditions & client buffing)
    if (pointsAwarded > 0) {
      await PointLedgerService.grantPoints(createAdminClient(), {
        userId: user.id,
        delta: pointsAwarded,
        eventType: 'ASSESSMENT_PASSED',
        sourceType: 'ASSESSMENT',
        sourceId: assessmentId,
        idempotencyKey: `SUBMISSION_REWARD_${activeSubmissionId}`,
        metadata: {
          assessment_id: assessmentId,
          submission_id: activeSubmissionId,
          score_percentage: Number(percentage.toFixed(2)),
        },
      });
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
      passingScore,
      executionTimeMs: `${executionTimeMs}ms`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi nộp bài';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
