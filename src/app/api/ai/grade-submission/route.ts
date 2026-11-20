import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAIAdapter } from '@/features/ai-gateway/adapters';
import { RubricDef } from '@/features/ai-gateway/types/grading.types';
import { AIUsageLoggerService } from '@/features/ai-gateway/services/ai-usage-logger.service';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';
import { GradingValidatorService } from '@/features/ai-gateway/services/grading-validator.service';

const requestSchema = z.object({
  submissionId: z.string().uuid('Mã bài nộp (submissionId) không hợp lệ'),
  itemId: z.string().uuid('Mã câu hỏi/tình huống (itemId) không hợp lệ').optional(),
  mode: z.enum(['SYNC', 'ASYNC', 'HITL']).optional().default('SYNC'),
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

    const { submissionId, itemId, mode } = validated.data;
    const isHitlMode = mode === 'HITL' || mode === 'ASYNC';
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

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



    // 3. Verify submission existence and strict resource-level authorization
    const { data: submission, error: subError } = await adminSupabase
      .from('assessment_submissions')
      .select('id, user_id, status, assessment_id, class_assignment_id, campaign_id')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Bài nộp không tồn tại' }, { status: 404 });
    }

    // ANTI SELF-GRADING GUARD (SEC-02 / Migration 50):
    // Examinee/Learner CANNOT grade their own submission or trigger AI grading on their own submission!
    if (submission.user_id === user.id) {
      return NextResponse.json(
        { error: 'Thí sinh không được phép tự chấm hoặc yêu cầu AI chấm bài thi của chính mình.' },
        { status: 403 }
      );
    }

    // AI-01: Xác định chủ thể chi trả AI Credits (Tổ chức vs Cá nhân)
    const payer = await QuotaEnforcementService.resolveSubmissionPayer(supabase, submissionId);
    if (payer.isOrg && payer.organizationId) {
      const orgQuota = await QuotaEnforcementService.checkOrgAICreditsQuota(supabase, payer.organizationId, 1);
      if (!orgQuota.allowed) {
        return NextResponse.json(
          {
            error: orgQuota.reason || 'Hạn mức AI Credits của tổ chức không đủ.',
            code: 'OUT_OF_ORG_CREDITS',
          },
          { status: 403 }
        );
      }
    } else {
      if (profile.role === 'LEARNER') {
        const userQuota = await QuotaEnforcementService.checkAICreditsQuota(supabase, user.id, 1);
        if (!userQuota.allowed) {
          return NextResponse.json(
            {
              error: userQuota.reason || 'Bạn đã hết AI credits. Vui lòng nâng cấp gói để nhận thêm credits.',
              code: 'OUT_OF_CREDITS',
            },
            { status: 403 }
          );
        }
      }
    }

    // Kiểm tra quyền hạn theo tài nguyên (Resource-Level Authorization & ASSESSOR Verification):
    let isAuthorized = false;

    // 1. Resolve organization if any
    const { data: asm } = await adminSupabase
      .from('assessments')
      .select('organization_id, created_by, owner_user_id')
      .eq('id', submission.assessment_id)
      .maybeSingle();

    let orgId = asm?.organization_id || null;

    if (!orgId && submission.campaign_id) {
      const { data: cmp } = await adminSupabase
        .from('assessment_campaigns')
        .select('organization_id')
        .eq('id', submission.campaign_id)
        .maybeSingle();
      orgId = cmp?.organization_id || null;
    }

    if (!orgId && submission.class_assignment_id) {
      const { data: ca } = await adminSupabase
        .from('class_assignments')
        .select('evaluator_classes(organization_id)')
        .eq('id', submission.class_assignment_id)
        .maybeSingle();
      const ec = ca?.evaluator_classes as unknown as { organization_id?: string | null } | null;
      orgId = ec?.organization_id || null;
    }

    if (orgId) {
      // Caller must have active membership in this organization as ORG_OWNER, ORG_ADMIN, or assigned ASSESSOR
      const { data: userOrg } = await adminSupabase
        .from('user_organizations')
        .select('org_role, status')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (userOrg) {
        if (userOrg.org_role === 'ORG_OWNER' || userOrg.org_role === 'ORG_ADMIN') {
          isAuthorized = true;
        } else if (userOrg.org_role === 'ASSESSOR' || (userOrg.org_role as string) === 'EVALUATOR') {
          // If ASSESSOR, check campaign assignment or class assignment
          if (submission.campaign_id) {
            const { data: cmpData } = await adminSupabase
              .from('assessment_campaigns')
              .select('assessor_ids')
              .eq('id', submission.campaign_id)
              .maybeSingle();
            const assessorIds = Array.isArray(cmpData?.assessor_ids) ? cmpData.assessor_ids : [];
            if (assessorIds.includes(user.id)) {
              isAuthorized = true;
            }
          }
          if (!isAuthorized && submission.class_assignment_id) {
            const { data: caData } = await adminSupabase
              .from('class_assignments')
              .select('class_id, evaluator_classes(owner_user_id, instructor_id, evaluator_id)')
              .eq('id', submission.class_assignment_id)
              .maybeSingle();
            const ec = caData?.evaluator_classes as unknown as {
              owner_user_id?: string;
              instructor_id?: string;
              evaluator_id?: string;
            } | null;
            if (ec && (ec.owner_user_id === user.id || ec.instructor_id === user.id || ec.evaluator_id === user.id)) {
              isAuthorized = true;
            }
          }
          if (!submission.campaign_id && !submission.class_assignment_id) {
            isAuthorized = true;
          }
        }
      }
    } else {
      // Personal assessment or personal class
      if (asm && (asm.created_by === user.id || asm.owner_user_id === user.id)) {
        isAuthorized = true;
      }
      if (!isAuthorized && submission.class_assignment_id) {
        const { data: caData } = await adminSupabase
          .from('class_assignments')
          .select('class_id, evaluator_classes(owner_user_id, instructor_id, evaluator_id)')
          .eq('id', submission.class_assignment_id)
          .maybeSingle();
        const ec = caData?.evaluator_classes as unknown as {
          owner_user_id?: string;
          instructor_id?: string;
          evaluator_id?: string;
        } | null;
        if (ec && (ec.owner_user_id === user.id || ec.instructor_id === user.id || ec.evaluator_id === user.id)) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có thẩm quyền khảo thí/chấm điểm cho bài nộp này' },
        { status: 403 }
      );
    }

    // 4. Resolve target open-ended item
    let targetItemId = itemId;
    if (!targetItemId) {
      const { data: firstAnswer } = await supabase
        .from('submission_answers')
        .select('item_id')
        .eq('submission_id', submissionId)
        .not('text_response', 'is', null)
        .limit(1)
        .maybeSingle();

      if (!firstAnswer?.item_id) {
        return NextResponse.json(
          { error: 'Không tìm thấy câu trả lời tự luận/minh chứng nào trong bài làm để chấm' },
          { status: 400 }
        );
      }
      targetItemId = firstAnswer.item_id;
    }

    // 4. Fetch candidate's response
    const { data: answer, error: answerError } = await supabase
      .from('submission_answers')
      .select('id, text_response, evidence_url')
      .eq('submission_id', submissionId)
      .eq('item_id', targetItemId)
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
      .eq('id', targetItemId)
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
      .eq('item_id', targetItemId);

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

    // 5. Reserve Credits Fail-Closed (MOD-02 / AI-07 / AI-12)
    // Use adminSupabase (service_role) to execute atomic deduction and ledger persistence
    const requestId = `grade_${submissionId}_${targetItemId}_${Date.now()}`;
    const reservation = await QuotaEnforcementService.reserveCredits(
      adminSupabase,
      {
        isOrg: payer.isOrg,
        organizationId: payer.organizationId,
        userId: user.id,
      },
      1,
      requestId
    );

    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Số dư AI credits không đủ cho tác vụ chấm Rubric' },
        { status: 402 }
      );
    }

    // Nếu kích hoạt HITL Async Job Dispatch: tạo bản ghi ai_grading_jobs với status PENDING
    let hitlJobId: string | null = null;
    if (isHitlMode && orgId) {
      const { data: jobRecord } = await adminSupabase
        .from('ai_grading_jobs')
        .insert({
          submission_id: submissionId,
          assessment_id: submission.assessment_id,
          org_id: orgId,
          assigned_assessor_id: user.id,
          job_status: 'RUNNING',
          rubric_snapshot: rubricDef,
          model_used: 'gemini-2.5-flash',
          credit_reservation_id: reservation.reservationId || null,
          request_id: requestId,
        })
        .select('id')
        .maybeSingle();

      if (jobRecord) {
        hitlJobId = jobRecord.id;
      }
    }

    // 6. Invoke AI Gateway via GeminiAdapter
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
      await QuotaEnforcementService.settleOrReleaseCredits(adminSupabase, reservation, 'RELEASE');
      throw evalError;
    }

    // 6. Recalculate deterministic scores & verify evidence quotes (MOD-03 / Task 3.2)
    const validatedEvaluation = GradingValidatorService.validateAndRecalculateScores(
      evaluation,
      rubricDef,
      answer.text_response
    );

    // 7. Save AI evaluation result into public.ai_evaluations as DRAFT for Evaluator review (P1-02)
    // Uses adminSupabase (service_role) as direct authenticated INSERT is revoked in Migration 50
    const { data: evalRecord, error: saveError } = await adminSupabase
      .from('ai_evaluations')
      .insert({
        submission_id: submissionId,
        item_id: targetItemId,
        model_name: adapter.defaultModel,
        total_score: validatedEvaluation.totalScore,
        max_score: validatedEvaluation.maxScore,
        confidence_score: validatedEvaluation.confidenceScore,
        confidence_flag: validatedEvaluation.confidenceFlag,
        evidence_quote: validatedEvaluation.evidenceQuote,
        strengths: validatedEvaluation.strengths,
        weaknesses: validatedEvaluation.weaknesses,
        feedback: validatedEvaluation.feedback,
        criterion_scores: validatedEvaluation.criterionScores,
        status: 'DRAFT',
      })
      .select('id, created_at')
      .single();

    if (saveError || !evalRecord) {
      console.error('Failed to save AI evaluation:', saveError);
      // Rollback reservation and release credits (Fail-closed)
      await QuotaEnforcementService.settleOrReleaseCredits(adminSupabase, reservation, 'RELEASE');
      return NextResponse.json(
        { error: 'Không thể lưu kết quả chấm bài AI vào cơ sở dữ liệu. Lượt credits đã được hoàn trả an toàn.' },
        { status: 500 }
      );
    }

    // Settle credits only after evaluation record is successfully persisted
    const settleResult = await QuotaEnforcementService.settleOrReleaseCredits(adminSupabase, reservation, 'SETTLE', 1);

    // 8. GRADE-01: Keep AI score in ai_evaluations as DRAFT only.
    // Do NOT write to submission_answers.score_awarded or assessment_submissions.final_score.
    // Mark submission grading_status as AI_DRAFT so evaluators see that an AI suggestion is ready for review.
    await adminSupabase
      .from('assessment_submissions')
      .update({
        grading_status: 'AI_DRAFT',
      })
      .eq('id', submissionId);

    // Cập nhật job nếu đang chạy ở chế độ HITL
    if (hitlJobId) {
      await adminSupabase
        .from('ai_grading_jobs')
        .update({
          job_status: 'AWAITING_HITL',
          ai_draft_scores: validatedEvaluation,
          model_used: adapter.defaultModel,
        })
        .eq('id', hitlJobId);
    }

    const remainingCredits = settleResult.remainingCredits ?? reservation.remainingCredits ?? profile.credits ?? 0;

    return NextResponse.json({
      success: true,
      job_id: hitlJobId,
      evaluation: {
        id: evalRecord?.id,
        totalScore: validatedEvaluation.totalScore,
        maxScore: validatedEvaluation.maxScore,
        confidenceScore: validatedEvaluation.confidenceScore,
        confidenceFlag: validatedEvaluation.confidenceFlag, // 'GREEN' | 'AMBER' | 'RED'
        evidenceQuote: validatedEvaluation.evidenceQuote,
        citationStatus: validatedEvaluation.citationStatus,
        strengths: validatedEvaluation.strengths,
        weaknesses: validatedEvaluation.weaknesses,
        feedback: validatedEvaluation.feedback,
        criterionScores: validatedEvaluation.criterionScores,
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
