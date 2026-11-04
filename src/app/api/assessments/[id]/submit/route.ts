import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';

export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  submissionId: z.string().uuid().optional(),
  classAssignmentId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
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

    const { submissionId, classAssignmentId, campaignId, timeSpentSeconds, answers } = validated.data;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate candidate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch assessment settings
    const { data: assessment, error: assessmentError } = await adminSupabase
      .from('assessments')
      .select('id, passing_score, point_reward, is_vip, access_tier')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Bài đánh giá không tồn tại' }, { status: 404 });
    }

    const passingScore = Number(assessment.passing_score) || 70.0;
    const pointReward = Number(assessment.point_reward) || 10;

    let resolvedCampaignId = campaignId || null;
    let isAuthorizedClassAssignment = false;
    let isAuthorizedCampaignParticipant = false;

    // 3. SEC-03: Validate classAssignmentId if provided
    if (classAssignmentId) {
      const { data: assignment, error: assignError } = await adminSupabase
        .from('class_assignments')
        .select('id, class_id, assessment_id, campaign_id')
        .eq('id', classAssignmentId)
        .maybeSingle();

      if (assignError || !assignment) {
        return NextResponse.json(
          { error: 'Nhiệm vụ bài tập không tồn tại' },
          { status: 404 }
        );
      }

      if (assignment.assessment_id !== assessmentId) {
        return NextResponse.json(
          { error: 'Nhiệm vụ bài tập không khớp với đề thi này' },
          { status: 400 }
        );
      }

      if (assignment.campaign_id && !resolvedCampaignId) {
        resolvedCampaignId = assignment.campaign_id;
      }

      // Check candidate is actively enrolled in the assigned class
      const { data: isMember } = await adminSupabase
        .from('class_members')
        .select('id')
        .eq('class_id', assignment.class_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMember) {
        return NextResponse.json(
          { error: 'Bạn không phải là thành viên của lớp học được giao bài tập này' },
          { status: 403 }
        );
      }

      isAuthorizedClassAssignment = true;
    }

    // 4. SEC-03: Validate campaignId if provided
    if (campaignId) {
      const { data: campaign, error: campError } = await adminSupabase
        .from('assessment_campaigns')
        .select('id, assessment_id, organization_id, status')
        .eq('id', campaignId)
        .maybeSingle();

      if (campError || !campaign) {
        return NextResponse.json(
          { error: 'Đợt khảo thí không tồn tại hoặc đã bị hủy' },
          { status: 404 }
        );
      }

      if (campaign.assessment_id && campaign.assessment_id !== assessmentId) {
        return NextResponse.json(
          { error: 'Đợt khảo thí không khớp với đề thi này' },
          { status: 400 }
        );
      }

      // Verify participant in campaign_participants or org membership
      const { data: participant } = await adminSupabase
        .from('campaign_participants')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (participant) {
        isAuthorizedCampaignParticipant = true;
      } else if (campaign.organization_id) {
        const { data: orgMember } = await adminSupabase
          .from('user_organizations')
          .select('id')
          .eq('organization_id', campaign.organization_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (orgMember) {
          isAuthorizedCampaignParticipant = true;
        }
      }

      // If user is also enrolled in an assignment linked to this campaign, allow
      if (isAuthorizedClassAssignment && resolvedCampaignId === campaignId) {
        isAuthorizedCampaignParticipant = true;
      }

      if (!isAuthorizedCampaignParticipant) {
        return NextResponse.json(
          { error: 'Bạn không thuộc danh sách thí sinh của đợt khảo thí này' },
          { status: 403 }
        );
      }
    }

    // 5. SEC-03: Validate Access Tier on Submit (VIP / Premium paywall & entitlement expiry)
    const isVipAssessment = Boolean(assessment.is_vip || assessment.access_tier === 'VIP');
    if (isVipAssessment) {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('plan_tier, role, admin_role, subscription_status, current_period_end')
        .eq('id', user.id)
        .maybeSingle();

      const isPaidTier = Boolean(profile?.plan_tier && profile.plan_tier !== 'FREE');
      const isPeriodActive = !profile?.current_period_end || new Date(profile.current_period_end).getTime() > Date.now();
      const isPaidUser = isPaidTier && isPeriodActive;
      const isPlatformStaff = profile?.role === 'ADMIN' || profile?.admin_role === 'SUPER_ADMIN';

      if (!isPaidUser && !isPlatformStaff && !isAuthorizedClassAssignment && !isAuthorizedCampaignParticipant) {
        return NextResponse.json(
          {
            error: 'Bài khảo thí này thuộc phân hạng VIP / Premium. Vui lòng nâng cấp tài khoản để nộp bài.',
            code: 'UPGRADE_REQUIRED',
          },
          { status: 403 }
        );
      }
    }

    // 4. SEC-03: Verify active submission with strict state & anti-resubmission checks
    let activeSubmissionId: string;

    if (submissionId) {
      activeSubmissionId = submissionId;
      const { data: existingSub, error: existingSubError } = await adminSupabase
        .from('assessment_submissions')
        .select('id, user_id, status')
        .eq('id', activeSubmissionId)
        .maybeSingle();

      if (existingSubError || !existingSub) {
        return NextResponse.json({ error: 'Bài nộp không tồn tại' }, { status: 404 });
      }

      if (existingSub.user_id !== user.id) {
        return NextResponse.json({ error: 'Bạn không có quyền nộp bài thi này' }, { status: 403 });
      }

      // Block resubmission of already submitted or evaluated attempts
      if (existingSub.status === 'SUBMITTED' || existingSub.status === 'EVALUATED') {
        return NextResponse.json(
          {
            error: 'Bài thi này đã được nộp hoặc đã hoàn thành đánh giá, không thể nộp lại',
            code: 'ALREADY_SUBMITTED',
          },
          { status: 409 }
        );
      }
    } else {
      // Create new submission record
      const { data: newSub, error: subError } = await adminSupabase
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

    // 5. Fetch all correct options via secure RPC (pure algorithmic evaluation, 0.01s)
    const { data: items, error: itemsError } = await adminSupabase.rpc(
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

    // 6. Evaluate each answer using pure algorithmic code
    let totalScore = 0;
    let hasOpenResponse = false;
    const answerRecords: {
      submission_id: string;
      item_id: string;
      selected_option_id: string | null;
      text_response: string | null;
      evidence_url: string | null;
      live_url: string | null;
      score_awarded: number | null;
      is_correct: boolean | null;
      auto_graded: boolean;
    }[] = [];

    const answerMap = new Map(answers.map((a) => [a.itemId, a]));

    for (const [itemId, info] of itemMap.entries()) {
      const candidateAns = answerMap.get(itemId);
      const selectedOptionId = candidateAns?.selectedOptionId || null;
      const textResponse = candidateAns?.textResponse || null;
      const evidenceUrl = candidateAns?.evidenceUrl || null;
      const liveUrl = candidateAns?.liveUrl || null;

      if (info.correctOptionId !== null) {
        // Choice/MCQ: auto-graded immediately
        const isCorrect = selectedOptionId !== null && selectedOptionId === info.correctOptionId;
        const scoreAwarded = isCorrect ? info.points : 0;
        totalScore += scoreAwarded;

        answerRecords.push({
          submission_id: activeSubmissionId,
          item_id: itemId,
          selected_option_id: selectedOptionId,
          text_response: textResponse,
          evidence_url: evidenceUrl,
          live_url: liveUrl,
          score_awarded: scoreAwarded,
          is_correct: isCorrect,
          auto_graded: true,
        });
      } else {
        // Open Response / Practical: pending manual Rubric grading
        hasOpenResponse = true;
        answerRecords.push({
          submission_id: activeSubmissionId,
          item_id: itemId,
          selected_option_id: null,
          text_response: textResponse,
          evidence_url: evidenceUrl,
          live_url: liveUrl,
          score_awarded: null,
          is_correct: null,
          auto_graded: false,
        });
      }
    }

    const percentage = hasOpenResponse
      ? null
      : maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = hasOpenResponse
      ? null
      : percentage !== null && percentage >= passingScore;

    // 7. Anti-farming check: Each passed assessment only awards points once per candidate
    let pointsAwarded = 0;
    if (isPassed === true && pointReward > 0) {
      const { data: previousPassed } = await adminSupabase
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

    // 8. Atomic transition: Clean previous draft answers, insert evaluated answers, finalize submission
    await adminSupabase
      .from('submission_answers')
      .delete()
      .eq('submission_id', activeSubmissionId);

    if (answerRecords.length > 0) {
      const { error: insertAnsErr } = await adminSupabase
        .from('submission_answers')
        .insert(answerRecords);

      if (insertAnsErr) {
        return NextResponse.json({ error: 'Không thể lưu bài làm của thí sinh' }, { status: 500 });
      }
    }

    const { error: updateSubErr } = await adminSupabase
      .from('assessment_submissions')
      .update({
        status: hasOpenResponse ? 'SUBMITTED' : 'EVALUATED',
        grading_status: hasOpenResponse ? 'PENDING_REVIEW' : 'COMPLETED',
        class_assignment_id: classAssignmentId || null,
        campaign_id: resolvedCampaignId || null,
        total_score: hasOpenResponse ? null : totalScore,
        max_score: maxScore,
        percentage: percentage !== null ? Number(percentage.toFixed(2)) : null,
        points_awarded: pointsAwarded,
        is_passed: isPassed,
        time_spent_seconds: timeSpentSeconds,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', activeSubmissionId);

    if (updateSubErr) {
      return NextResponse.json({ error: 'Không thể cập nhật kết quả nộp bài' }, { status: 500 });
    }

    // 9. Atomic Point Ledger Grant
    if (pointsAwarded > 0) {
      await PointLedgerService.grantPoints(supabase, {
        userId: user.id,
        delta: pointsAwarded,
        eventType: 'ASSESSMENT_PASSED',
        sourceType: 'ASSESSMENT',
        sourceId: assessmentId,
        idempotencyKey: `SUBMISSION_REWARD_${activeSubmissionId}`,
        metadata: {
          assessment_id: assessmentId,
          submission_id: activeSubmissionId,
          score_percentage: percentage !== null ? Number(percentage.toFixed(2)) : 0,
        },
      });
    }

    const executionTimeMs = (performance.now() - startTime).toFixed(2);
    const scoreOn10 = percentage !== null ? Math.round(percentage) / 10 : null;

    return NextResponse.json({
      success: true,
      submissionId: activeSubmissionId,
      totalScore: hasOpenResponse ? null : totalScore,
      maxScore,
      scoreOn10,
      percentage: percentage !== null ? Number(percentage.toFixed(1)) : null,
      pointsAwarded,
      isPassed,
      passingScore,
      hasOpenResponse,
      executionTimeMs: `${executionTimeMs}ms`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi nộp bài';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
