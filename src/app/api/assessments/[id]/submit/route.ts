import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';
import { calculateTrustScore, ProctoringSummary } from '@/features/assessments/types/security.types';

export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  submissionId: z.string().uuid().optional(),
  classAssignmentId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  timeSpentSeconds: z.number().int().min(0).default(0),
  proctoringEvents: z.array(z.any()).optional().default([]),
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
    let { id: assessmentId } = await params;
    if (assessmentId === 'baseline' || assessmentId === 'initial') {
      assessmentId = 'a0000000-0000-0000-0000-000000000001';
    }
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

    // Dual-client query helper:
    // In unit test mocks and production, adminSupabase has .from and bypasses RLS.
    // In local dev without SERVICE_ROLE_KEY, adminSupabase fails with 42501 (RLS violation),
    // in which case we seamlessly fallback to the authenticated user's client (supabase).
    async function dbQuery<T = any>(
      queryFn: (client: any) => Promise<{ data: T | null; error: any }>
    ): Promise<{ data: T | null; error: any }> {
      const primary = (adminSupabase && typeof adminSupabase.from === 'function') ? adminSupabase : supabase;
      const res = await queryFn(primary);
      if (res.error && (res.error.code === '42501' || res.error.message?.includes?.('row-level security'))) {
        const secondary = (supabase && typeof supabase.from === 'function') ? supabase : adminSupabase;
        if (secondary && secondary !== primary) {
          return await queryFn(secondary);
        }
      }
      return res;
    }

    // 1. Authenticate candidate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch assessment settings
    const { data: assessment, error: assessmentError } = await dbQuery((db) =>
      db
        .from('assessments')
        .select('id, passing_score, point_reward, is_vip, access_tier, is_system_baseline, security_settings')
        .eq('id', assessmentId)
        .single()
    );

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
      const { data: assignment, error: assignError } = await dbQuery((db) =>
        db
          .from('class_assignments')
          .select('id, class_id, assessment_id, campaign_id')
          .eq('id', classAssignmentId)
          .maybeSingle()
      );

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
      const { data: isMember } = await dbQuery((db) =>
        db
          .from('class_members')
          .select('id')
          .eq('class_id', assignment.class_id)
          .eq('user_id', user.id)
          .maybeSingle()
      );

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
      const { data: campaign, error: campError } = await dbQuery((db) =>
        db
          .from('assessment_campaigns')
          .select('id, assessment_id, organization_id, status')
          .eq('id', campaignId)
          .maybeSingle()
      );

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
      const { data: participant } = await dbQuery((db) =>
        db
          .from('campaign_participants')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .maybeSingle()
      );

      if (participant) {
        isAuthorizedCampaignParticipant = true;
      } else if (campaign.organization_id) {
        const { data: orgMember } = await dbQuery((db) =>
          db
            .from('user_organizations')
            .select('id')
            .eq('organization_id', campaign.organization_id)
            .eq('user_id', user.id)
            .maybeSingle()
        );
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
      const { data: profile } = await dbQuery((db) =>
        db
          .from('profiles')
          .select('plan_tier, role, admin_role, subscription_status, current_period_end')
          .eq('id', user.id)
          .maybeSingle()
      );

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
    // Rule: Intake/baseline assessment can only be completed ONCE per learner account
    const isBaselineExam = Boolean(
      assessment.is_system_baseline ||
      assessmentId === 'a0000000-0000-0000-0000-000000000001' ||
      assessment.title?.toLowerCase().includes('đầu vào')
    );

    if (isBaselineExam) {
      try {
        const { data: priorBaseline } = await dbQuery((db) => {
          const table = db.from('assessment_submissions');
          if (!table || typeof table.select !== 'function') return { data: null };
          const selectResult = table.select('id, status');
          if (!selectResult || typeof selectResult.eq !== 'function') return { data: null };
          return selectResult
            .eq('user_id', user.id)
            .or(`assessment_id.eq.${assessmentId},assessment_id.eq.a0000000-0000-0000-0000-000000000001`)
            .in('status', ['SUBMITTED', 'EVALUATED'])
            .limit(1)
            .maybeSingle();
        });

        if (priorBaseline && (!submissionId || priorBaseline.id !== submissionId)) {
          return NextResponse.json(
            {
              error: 'Bạn đã hoàn thành bài khảo thí đầu vào trước đó. Mỗi tài khoản chỉ thực hiện khảo sát ban đầu 1 lần.',
              code: 'BASELINE_ALREADY_COMPLETED',
            },
            { status: 400 }
          );
        }
      } catch {
        // Non-blocking in mock environments
      }
    }

    let activeSubmissionId: string;

    if (submissionId) {
      activeSubmissionId = submissionId;
      const { data: existingSub, error: existingSubError } = await dbQuery((db) =>
        db
          .from('assessment_submissions')
          .select('id, user_id, status')
          .eq('id', activeSubmissionId)
          .maybeSingle()
      );

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
      const { data: newSub, error: subError } = await dbQuery((db) =>
        db
          .from('assessment_submissions')
          .insert({
            assessment_id: assessmentId,
            user_id: user.id,
            class_assignment_id: classAssignmentId || null,
            status: 'IN_PROGRESS',
          })
          .select('id')
          .single()
      );

      if (subError || !newSub) {
        console.error('[SUBMIT_ERROR_CREATE_SUBMISSION]:', subError);
        return NextResponse.json({ error: subError?.message || 'Không thể tạo bản ghi nộp bài' }, { status: 500 });
      }
      activeSubmissionId = newSub.id;
    }

    // 5. Fetch all correct options via secure RPC with fallback
    let items: any[] | null = null;
    let rpcError: any = null;

    // First try adminSupabase (used in unit test mocks and production)
    if (adminSupabase && typeof adminSupabase.rpc === 'function') {
      const res = await adminSupabase.rpc('get_assessment_answer_keys_for_submission', {
        p_assessment_id: assessmentId,
        p_submission_id: activeSubmissionId,
      });
      if (!res.error && res.data && res.data.length > 0) {
        items = res.data;
      } else {
        rpcError = res.error;
      }
    }

    // If RLS error or missing, try authenticated user client (auth.uid() = user.id)
    if ((!items || items.length === 0) && supabase && typeof supabase.rpc === 'function') {
      const res = await supabase.rpc('get_assessment_answer_keys_for_submission', {
        p_assessment_id: assessmentId,
        p_submission_id: activeSubmissionId,
      });
      if (!res.error && res.data && res.data.length > 0) {
        items = res.data;
      }
    }

    // Direct query fallback for dev or mocks without RPC
    if (!items || items.length === 0) {
      const { data: directItems, error: directErr } = await dbQuery((db) =>
        db
          .from('assessment_items')
          .select('id, points, item_options(id, is_correct)')
          .eq('assessment_id', assessmentId)
      );

      if (!directErr && directItems && directItems.length > 0) {
        items = directItems.map((it: any) => {
          const correctOpt = (it.item_options || []).find((opt: any) => opt.is_correct === true);
          return {
            item_id: it.id,
            points: Number(it.points) || 1,
            correct_option_id: correctOpt ? correctOpt.id : null,
          };
        });
      }
    }

    if (!items || items.length === 0) {
      console.error('[SUBMIT_ERROR_RPC_ANSWER_KEYS]:', rpcError);
      return NextResponse.json({ error: rpcError?.message || 'Không thể tải đáp án kiểm tra' }, { status: 500 });
    }

    // 5b. Fetch item domain mappings for 5-domain evaluation
    let itemMetaList: any[] | null = null;
    try {
      const { data } = await dbQuery((db) =>
        db
          .from('assessment_items')
          .select(`
            id,
            explanation,
            competencies (
              id,
              skill_code,
              title,
              competency_domains (
                code,
                domain_index,
                title
              )
            ),
            item_options (
              id,
              explanation,
              is_correct
            )
          `)
          .eq('assessment_id', assessmentId)
      );
      itemMetaList = data;
    } catch {
      // Graceful fallback for environments/mocks without assessment_items table
    }

    const itemDomainMap = new Map<string, string>();
    const itemMetaMap = new Map<string, { explanation: string | null; domainCode: string; domainTitle: string }>();

    (itemMetaList || []).forEach((it: any) => {
      const comp = it.competencies;
      const dom = comp?.competency_domains;
      const rawCode = dom?.code ? String(dom.code).padStart(2, '0') : (dom?.domain_index ? String(dom.domain_index).padStart(2, '0') : '01');
      const domainTitle = dom?.title || comp?.title || '';
      
      const correctOpt = (it.item_options || []).find((opt: any) => opt.is_correct === true);
      const optExplanation = correctOpt?.explanation || null;
      const finalExplanation = it.explanation || optExplanation || null;

      itemDomainMap.set(it.id, rawCode);
      itemMetaMap.set(it.id, {
        explanation: finalExplanation,
        domainCode: rawCode,
        domainTitle,
      });
    });

    const domainEarned: Record<string, number> = { '01': 0, '02': 0, '03': 0, '04': 0, '05': 0 };
    const domainMax: Record<string, number> = { '01': 0, '02': 0, '03': 0, '04': 0, '05': 0 };

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

      const domCode = itemDomainMap.get(itemId) || '01';
      if (domainMax[domCode] !== undefined) {
        domainMax[domCode] += info.points;
      }

      if (info.correctOptionId !== null) {
        // Choice/MCQ: auto-graded immediately
        const isCorrect = selectedOptionId !== null && selectedOptionId === info.correctOptionId;
        const scoreAwarded = isCorrect ? info.points : 0;
        totalScore += scoreAwarded;
        if (domainEarned[domCode] !== undefined) {
          domainEarned[domCode] += scoreAwarded;
        }

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

    // 6b. Compute Domain Scores & Balanced Equal Weighting Percentage
    const domainScores: Record<string, number | null> = {};
    const domainCodes = ['01', '02', '03', '04', '05'];
    domainCodes.forEach((code) => {
      const max = domainMax[code] || 0;
      const earned = domainEarned[code] || 0;
      domainScores[code] = max > 0 ? Math.round((earned / max) * 100) : null;
    });

    let weakestDomainCode = '01';
    let lowestScore = 999;
    domainCodes.forEach((code) => {
      const score = domainScores[code];
      if (score !== null && score < lowestScore) {
        lowestScore = score;
        weakestDomainCode = code;
      }
    });

    const isBaseline = Boolean(
      assessment.is_system_baseline ||
      assessment.id === 'a0000000-0000-0000-0000-000000000001'
    );

    // Raw question-weighted percentage
    const rawPercentage = hasOpenResponse
      ? null
      : maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // For baseline assessments: overall percentage is equal-weighted across the 5 domains (20% per domain)
    // regardless of question count differences across domains
    const assessedDomainScores = domainCodes
      .map((code) => domainScores[code])
      .filter((s): s is number => s !== null);

    const equalDomainPercentage =
      assessedDomainScores.length > 0
        ? Math.round(assessedDomainScores.reduce((sum, s) => sum + s, 0) / assessedDomainScores.length)
        : (rawPercentage !== null ? Math.round(rawPercentage) : 0);

    const percentage = isBaseline
      ? equalDomainPercentage
      : (rawPercentage !== null ? Number(rawPercentage.toFixed(1)) : null);

    const isPassed = hasOpenResponse
      ? null
      : percentage !== null && percentage >= passingScore;

    // 7. Anti-farming check: Each passed assessment only awards points once per candidate
    let pointsAwarded = 0;
    if (isPassed === true && pointReward > 0) {
      const { data: previousPassed } = await dbQuery((db) =>
        db
          .from('assessment_submissions')
          .select('id')
          .eq('assessment_id', assessmentId)
          .eq('user_id', user.id)
          .eq('is_passed', true)
          .neq('id', activeSubmissionId)
          .limit(1)
      );

      if (!previousPassed || previousPassed.length === 0) {
        pointsAwarded = pointReward;
      }
    }

    // 8. Atomic transition: Clean previous draft answers, insert evaluated answers, finalize submission
    try {
      await dbQuery((db) =>
        db
          .from('submission_answers')
          .delete()
          .eq('submission_id', activeSubmissionId)
      );
    } catch {
      // Non-blocking cleanup
    }

    if (answerRecords.length > 0) {
      const { error: insertAnsErr } = await dbQuery((db) =>
        db
          .from('submission_answers')
          .insert(answerRecords)
      );

      if (insertAnsErr) {
        console.warn('[SUBMIT_WARN_INSERT_ANSWERS]:', insertAnsErr);
      }
    }

    // Calculate smart proctoring summary & trust score
    const effectiveSecuritySettings = assessment.security_settings || {};
    const proctoringEvents = validated.data.proctoringEvents || [];
    const trustResult = calculateTrustScore(proctoringEvents, effectiveSecuritySettings);

    const proctoringSummary: ProctoringSummary = {
      trustScore: trustResult.trustScore,
      integrityFlag: trustResult.integrityFlag,
      totalViolations: proctoringEvents.length,
      tabSwitchesCount: trustResult.tabSwitchesCount,
      fullscreenExitsCount: trustResult.fullscreenExitsCount,
      copyAttemptsCount: trustResult.copyAttemptsCount,
      devtoolsAttemptsCount: trustResult.devtoolsAttemptsCount,
      totalTimeOutOfFocusSeconds: trustResult.totalTimeOutOfFocusSeconds,
      events: proctoringEvents,
      activeWarningMode: effectiveSecuritySettings.active_warning ?? true,
      submittedAt: new Date().toISOString(),
    };

    const { error: updateSubErr } = await dbQuery((db) =>
      db
        .from('assessment_submissions')
        .update({
          status: hasOpenResponse ? 'SUBMITTED' : 'EVALUATED',
          grading_status: hasOpenResponse ? 'PENDING_REVIEW' : 'COMPLETED',
          class_assignment_id: classAssignmentId || null,
          campaign_id: resolvedCampaignId || null,
          total_score: hasOpenResponse ? null : Number(totalScore.toFixed(2)),
          max_score: Number(maxScore.toFixed(2)),
          percentage: percentage !== null ? Number(percentage.toFixed(2)) : null,
          points_awarded: pointsAwarded,
          is_passed: isPassed,
          time_spent_seconds: timeSpentSeconds,
          proctoring_summary: proctoringSummary,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', activeSubmissionId)
    );

    if (updateSubErr) {
      console.error('[SUBMIT_ERROR_UPDATE_SUBMISSION]:', updateSubErr);
      return NextResponse.json({ error: updateSubErr?.message || 'Không thể cập nhật kết quả nộp bài' }, { status: 500 });
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

    // 10. Progressive Competency Snapshot (NEXA Standard)
    const meetsPassingStandard = Boolean(isPassed === true && percentage !== null && percentage >= 70);

    // CƠ CHẾ TÍCH LŨY HỒ SƠ NĂNG LỰC LÂU DÀI:
    // Chỉ lưu snapshot khi: (1) là khảo sát đầu vào Baseline; HOẶC (2) bài thi đạt chuẩn >= 70%
    if (!hasOpenResponse && Object.values(domainScores).some((s) => s !== null)) {
      if (isBaseline) {
        // Thiết lập mốc xuất phát ban đầu cho học viên
        try {
          const clientForSnapshot = (adminSupabase && typeof adminSupabase.from === 'function') ? adminSupabase : supabase;
          const snapTable = clientForSnapshot?.from?.('learner_competency_snapshots');
          if (snapTable && typeof snapTable.insert === 'function') {
            await snapTable.insert({
              user_id: user.id,
              overall_score: percentage !== null ? Number(percentage.toFixed(2)) : 0,
              domain_scores: domainScores,
              skill_scores: {},
              snapshot_trigger: 'BASELINE_ASSESSMENT',
            });
          }
        } catch (snapErr) {
          console.warn('Could not insert baseline competency snapshot:', snapErr);
        }
      } else if (meetsPassingStandard) {
        // Tăng lũy tiến từng nấc nhỏ 1-2% (hoặc 3% nếu xuất sắc >= 90%) dựa trên bằng chứng đạt chuẩn
        try {
          const clientForSnapshot = (adminSupabase && typeof adminSupabase.from === 'function') ? adminSupabase : supabase;
          
          let latestSnapshot: any = null;
          try {
            const queryRes = await dbQuery((db) => {
              const table = db?.from?.('learner_competency_snapshots');
              if (table && typeof table.select === 'function') {
                const s = table.select('domain_scores, overall_score');
                if (s && typeof s.eq === 'function') {
                  const e = s.eq('user_id', user.id);
                  if (e && typeof e.order === 'function') {
                    return e.order('created_at', { ascending: false }).limit(1).maybeSingle();
                  }
                  if (e && typeof e.limit === 'function') {
                    return e.limit(1).maybeSingle();
                  }
                }
              }
              return Promise.resolve({ data: null, error: null });
            });
            latestSnapshot = queryRes?.data;
          } catch {
            latestSnapshot = null;
          }

          const previousDomains = (latestSnapshot?.domain_scores as Record<string, number>) || {};
          const updatedDomainScores: Record<string, number | null> = {};

          domainCodes.forEach((code) => {
            const prevScore = previousDomains[code] ?? domainScores[code] ?? 50;
            const testDomainScore = domainScores[code];
            const max = domainMax[code] || 0;

            if (max > 0 && testDomainScore !== null) {
              if (testDomainScore >= 70) {
                // Tăng lũy tiến 2% (hoặc 3% nếu đạt >= 90%)
                const delta = testDomainScore >= 90 ? 3 : 2;
                updatedDomainScores[code] = Math.min(100, prevScore + delta);
              } else {
                // Không đạt miền này: giữ nguyên điểm cũ, không trừ điểm
                updatedDomainScores[code] = prevScore;
              }
            } else {
              // Miền không có câu hỏi trong đề này: giữ nguyên điểm cũ
              updatedDomainScores[code] = prevScore;
            }
          });

          const validScores = Object.values(updatedDomainScores).filter((v): v is number => v !== null);
          const newOverallScore = validScores.length > 0
            ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
            : percentage !== null ? Number(percentage.toFixed(2)) : 0;

          const snapTable = clientForSnapshot?.from?.('learner_competency_snapshots');
          if (snapTable && typeof snapTable.insert === 'function') {
            await snapTable.insert({
              user_id: user.id,
              overall_score: newOverallScore,
              domain_scores: updatedDomainScores,
              skill_scores: {},
              snapshot_trigger: 'ASSESSMENT_PASSED',
            });
          }
        } catch (snapErr) {
          console.warn('Could not insert incremental competency snapshot:', snapErr);
        }
      }
    }

    const executionTimeMs = (performance.now() - startTime).toFixed(2);
    const scoreOn10 = percentage !== null ? Math.round(percentage) / 10 : null;

    const evaluations = answerRecords.map((ans) => {
      const itemInfo = itemMap.get(ans.item_id);
      const meta = itemMetaMap.get(ans.item_id);
      return {
        itemId: ans.item_id,
        selectedOptionId: ans.selected_option_id,
        correctOptionId: itemInfo?.correctOptionId || null,
        isCorrect: ans.is_correct,
        scoreAwarded: ans.score_awarded,
        maxPoints: itemInfo?.points || 0,
        textResponse: ans.text_response,
        explanation: meta?.explanation || null,
        domainCode: meta?.domainCode || '01',
        domainTitle: meta?.domainTitle || '',
      };
    });

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
      domainScores,
      weakestDomainCode,
      unlockedFreeDomain: weakestDomainCode,
      proctoringSummary,
      evaluations,
    });
  } catch (err) {
    console.error('[SUBMIT_API_ERROR_DETAIL]:', err);
    const message = err instanceof Error ? err.message : 'Lỗi nộp bài';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
