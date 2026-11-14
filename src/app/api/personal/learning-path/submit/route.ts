import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  moduleId: z.string().uuid('Mã học phần không hợp lệ'),
  answers: z.record(z.string()),
  practicalAnswers: z.record(
    z.object({
      textResponse: z.string().optional().nullable(),
      evidenceUrl: z.string().optional().nullable(),
      fileName: z.string().optional().nullable(),
    })
  ).optional(),
  tabSwitchCount: z.number().int().min(0).default(0),
  timeSpentSeconds: z.number().int().min(0).default(0),
});

function normalizeDomainCode(code: string | null | undefined): string {
  if (!code) return '01';
  const match = String(code).match(/(\d+)/);
  return match ? match[1].padStart(2, '0') : '01';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để nộp bài' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu nộp bài không hợp lệ' },
        { status: 400 }
      );
    }

    const { moduleId, answers, practicalAnswers, tabSwitchCount, timeSpentSeconds } = parsed.data;

    // 2. Fetch module and linked assessment
    const { data: moduleRecord, error: moduleError } = await adminSupabase
      .from('learning_modules')
      .select(`
        id,
        title,
        domain_code,
        skill_code,
        point_reward,
        duration_minutes,
        assessment_id,
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

    if (moduleError || !moduleRecord) {
      return NextResponse.json({ error: 'Không tìm thấy học phần tương ứng' }, { status: 404 });
    }

    if (!moduleRecord.assessment_id) {
      return NextResponse.json(
        { error: 'Học phần này chưa được liên kết đề kiểm chứng năng lực' },
        { status: 400 }
      );
    }

    const assessment = Array.isArray(moduleRecord.assessments)
      ? moduleRecord.assessments[0]
      : moduleRecord.assessments;

    const passingScore = Number(assessment?.passing_score ?? 100);

    // 3. Check cooldown if user recently failed (based on security_settings)
    const cooldownMinutes = typeof (assessment?.security_settings as any)?.cooldownMinutes === 'number'
      ? Number((assessment?.security_settings as any).cooldownMinutes)
      : 15;

    const { data: recentSubmissions } = await adminSupabase
      .from('assessment_submissions')
      .select('id, is_passed, submitted_at')
      .eq('user_id', user.id)
      .eq('assessment_id', moduleRecord.assessment_id)
      .order('submitted_at', { ascending: false })
      .limit(1);

    const lastSub = recentSubmissions?.[0];
    if (cooldownMinutes > 0 && lastSub && !lastSub.is_passed && lastSub.submitted_at) {
      const lastTime = new Date(lastSub.submitted_at).getTime();
      const cooldownMs = cooldownMinutes * 60 * 1000;
      const elapsed = Date.now() - lastTime;
      if (elapsed < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - elapsed) / 60000);
        return NextResponse.json(
          {
            error: `Bạn cần chờ thêm ${remainingMinutes} phút trước khi làm lại bài kiểm chứng trạm này.`,
            cooldownRemainingSeconds: Math.ceil((cooldownMs - elapsed) / 1000),
          },
          { status: 429 }
        );
      }
    }

    // 4. Load items and options for scoring
    const { data: items, error: itemsError } = await adminSupabase
      .from('assessment_items')
      .select(`
        id,
        type,
        prompt,
        points,
        order_index,
        item_options (
          id,
          content,
          is_correct,
          explanation,
          order_index
        )
      `)
      .eq('assessment_id', moduleRecord.assessment_id)
      .order('order_index', { ascending: true });

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json({ error: 'Đề kiểm chứng chưa có câu hỏi nào' }, { status: 400 });
    }

    // 5. Evaluate answers
    let totalPoints = 0;
    let earnedPoints = 0;
    const breakdown = items.map((item) => {
      const itemMaxPoints = Number(item.points) > 0 ? Number(item.points) : 1;
      totalPoints += itemMaxPoints;

      const userSelectedOptionId = answers[item.id] || null;
      const practicalSub = practicalAnswers?.[item.id];
      const isPracticalType =
        item.type === 'PRACTICAL_TASK' ||
        item.type === 'PRACTICAL' ||
        item.type === 'DIGITAL_EVIDENCE' ||
        item.type === 'ESSAY';

      let isCorrect = false;
      let pointsAwarded = 0;
      let explanation = 'Không có giải thích chi tiết.';
      let correctOptionId: string | null = null;

      if (isPracticalType) {
        // Practical task in learning path is marked as completed if artifact/response is attached
        const hasPracticalSubmission = Boolean(
          practicalSub?.evidenceUrl ||
          practicalSub?.fileName ||
          practicalSub?.textResponse ||
          userSelectedOptionId
        );
        isCorrect = hasPracticalSubmission;
        pointsAwarded = isCorrect ? itemMaxPoints : 0;
        explanation = isCorrect
          ? 'Đã ghi nhận bài thực hành. Bằng chứng số được đính kèm đáp ứng tiêu chí chuẩn đầu ra học phần.'
          : 'Học phần yêu cầu nộp tệp bài làm thực hành (Word/PDF/Excel) hoặc báo cáo để vượt trạm.';
      } else {
        const options = item.item_options || [];
        const correctOption = options.find((opt: any) => opt.is_correct);
        const chosenOption = options.find((opt: any) => opt.id === userSelectedOptionId);
        correctOptionId = correctOption?.id || null;

        isCorrect = Boolean(chosenOption && chosenOption.is_correct);
        pointsAwarded = isCorrect ? itemMaxPoints : 0;
        explanation =
          chosenOption?.explanation ||
          correctOption?.explanation ||
          (isCorrect ? 'Phương án chính xác đáp ứng chuẩn năng lực số.' : 'Phương án chưa đáp ứng đúng tiêu chuẩn năng lực.');
      }

      if (isCorrect) {
        earnedPoints += pointsAwarded;
      }

      return {
        itemId: item.id,
        prompt: item.prompt,
        userSelectedOptionId,
        correctOptionId,
        isCorrect,
        pointsAwarded,
        maxPoints: itemMaxPoints,
        explanation,
      };
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = percentage >= passingScore;

    // 6. Save submission record according to DB schema (total_score, max_score, status: EVALUATED)
    const { data: submission, error: subError } = await adminSupabase
      .from('assessment_submissions')
      .insert({
        assessment_id: moduleRecord.assessment_id,
        user_id: user.id,
        status: 'EVALUATED',
        grading_status: 'COMPLETED',
        total_score: earnedPoints,
        max_score: totalPoints,
        percentage,
        points_awarded: isPassed ? Number(moduleRecord.point_reward) || 30 : 0,
        is_passed: isPassed,
        time_spent_seconds: timeSpentSeconds,
        started_at: new Date(Date.now() - Math.max(1, timeSpentSeconds) * 1000).toISOString(),
        submitted_at: new Date().toISOString(),
        proctoring_summary: {
          tabSwitchCount,
          violationsDetected: tabSwitchCount > 0,
          antiCopyEnforced: true,
        },
      })
      .select()
      .single();

    if (subError) {
      console.error('Error saving submission:', subError);
      return NextResponse.json({ error: 'Lỗi khi lưu kết quả bài làm: ' + (subError.message || subError.details || 'Lỗi DB') }, { status: 500 });
    }

    // Save individual item answers into submission_answers
    if (submission && breakdown.length > 0) {
      const answersToInsert = breakdown.map((b) => {
        const practicalSub = practicalAnswers?.[b.itemId];
        return {
          submission_id: submission.id,
          item_id: b.itemId,
          selected_option_id:
            b.userSelectedOptionId &&
            typeof b.userSelectedOptionId === 'string' &&
            b.userSelectedOptionId.trim() !== ''
              ? b.userSelectedOptionId.trim()
              : null,
          text_response: practicalSub?.textResponse || null,
          evidence_url: practicalSub?.evidenceUrl || practicalSub?.fileName || null,
          score_awarded: b.pointsAwarded,
          is_correct: b.isCorrect,
          auto_graded: true,
        };
      });

      try {
        const answersTable = adminSupabase.from('submission_answers');
        if (answersTable && typeof answersTable.insert === 'function') {
          const { error: answersError } = await answersTable.insert(answersToInsert);
          if (answersError) {
            console.warn('Warning: failed to insert submission answers:', answersError);
          }
        }
      } catch (err) {
        console.warn('Error inserting submission answers:', err);
      }
    }

    let pointsAwarded = 0;
    let domainScoreIncremented = 0;

    // 7. On passing: update progress, reward points, and progressive radar increment
    if (isPassed) {
      pointsAwarded = Number(moduleRecord.point_reward) || 30;

      // Upsert progress
      await adminSupabase
        .from('user_learning_progress')
        .upsert(
          {
            user_id: user.id,
            module_id: moduleId,
            is_completed: true,
            completed_at: new Date().toISOString(),
            points_awarded: pointsAwarded,
          },
          { onConflict: 'user_id,module_id' }
        );

      // Award points to profile
      const { data: currentProfile } = await adminSupabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .maybeSingle();

      const newPoints = (Number(currentProfile?.points) || 0) + pointsAwarded;
      await adminSupabase
        .from('profiles')
        .update({ points: newPoints, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      // Progressive domain competence increment (+2% to current domain)
      const domainNorm = normalizeDomainCode(moduleRecord.domain_code);
      const { data: latestSnapshot } = await adminSupabase
        .from('learner_competency_snapshots')
        .select('id, domain_scores, overall_score, skill_scores')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentDomainScores: Record<string, number | null> =
        (latestSnapshot?.domain_scores as Record<string, number | null>) || {};

      const currentScore = Number(
        currentDomainScores[domainNorm] ?? currentDomainScores[`D${parseInt(domainNorm, 10)}`] ?? 0
      );

      // Increment 2 percentage points, capped at 100
      const incremented = Math.min(100, currentScore + 2);
      domainScoreIncremented = incremented - currentScore;

      const updatedDomainScores = {
        ...currentDomainScores,
        [domainNorm]: incremented,
        [`D${parseInt(domainNorm, 10)}`]: incremented,
      };

      // Recalculate overall score average of 5 domains
      const allCodes = ['01', '02', '03', '04', '05'];
      const validScores = allCodes
        .map((c) => updatedDomainScores[c])
        .filter((s): s is number => typeof s === 'number');

      const newOverall = validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : incremented;

      try {
        await adminSupabase.from('learner_competency_snapshots').insert({
          user_id: user.id,
          domain_scores: updatedDomainScores,
          skill_scores: latestSnapshot?.skill_scores || {},
          overall_score: newOverall,
          snapshot_trigger: 'MODULE_COMPLETED',
          created_at: new Date().toISOString(),
        });
      } catch (snapErr) {
        console.warn('Snapshot error on practice completion:', snapErr);
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      isPassed,
      percentage,
      passingScore,
      score: earnedPoints,
      totalPoints,
      pointsAwarded,
      domainScoreIncremented,
      breakdown,
      tabSwitchCount,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
