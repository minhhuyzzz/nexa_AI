import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export const dynamic = 'force-dynamic';

const evaluatorGradeSchema = z.object({
  submissionId: z.string().uuid('Mã bài nộp không hợp lệ'),
  itemId: z.string().uuid('Mã câu hỏi không hợp lệ'),
  criterionScores: z.array(
    z.object({
      criterionId: z.string().uuid('Mã tiêu chí không hợp lệ'),
      levelName: z.string(),
      score: z.number().min(0, 'Điểm tiêu chí không được nhỏ hơn 0'),
    })
  ).min(1, 'Vui lòng cung cấp điểm cho ít nhất 1 tiêu chí Rubric'),
  evaluatorFeedback: z.string().default(''),
});

interface AssessmentJoin {
  id: string;
  created_by?: string | null;
  owner_user_id?: string | null;
  organization_id?: string | null;
  passing_score?: number | null;
}

interface CriterionRecord {
  id: string;
  name: string;
  max_points: number;
  weight_percent: number;
}

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
    const adminSupabase = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const isSuper = isSuperadminEmail(user.email);
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    // 2. Fetch submission and related assessment
    const { data: submission, error: subError } = await adminSupabase
      .from('assessment_submissions')
      .select(`
        id,
        user_id,
        assessment_id,
        max_score,
        assessments (
          id,
          created_by,
          owner_user_id,
          organization_id,
          passing_score
        )
      `)
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Bài nộp không tồn tại' }, { status: 404 });
    }

    const asm = submission.assessments as unknown as AssessmentJoin | null;

    // 3. Verify grading authority
    let hasAuthority = isSuper || profile?.role === 'ADMIN';

    if (!hasAuthority && asm) {
      // Author / Owner of assessment
      if (asm.owner_user_id === user.id || asm.created_by === user.id) {
        hasAuthority = true;
      }

      // Organization Assessor / Evaluator
      if (!hasAuthority && asm.organization_id) {
        const { data: orgMember } = await adminSupabase
          .from('user_organizations')
          .select('org_role, status')
          .eq('user_id', user.id)
          .eq('organization_id', asm.organization_id)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (
          orgMember &&
          ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(orgMember.org_role)
        ) {
          hasAuthority = true;
        }
      }

      // Assigned class evaluator for the student
      if (!hasAuthority) {
        const { data: classRows } = await adminSupabase
          .from('evaluator_classes')
          .select('id, class_members!inner(user_id)')
          .or(`evaluator_id.eq.${user.id},owner_user_id.eq.${user.id}`)
          .eq('class_members.user_id', submission.user_id)
          .limit(1);

        if (classRows && classRows.length > 0) {
          hasAuthority = true;
        }
      }
    }

    if (!hasAuthority) {
      return NextResponse.json(
        { error: 'Bạn không có thẩm quyền chấm bài thi này' },
        { status: 403 }
      );
    }

    // 4. SEC-02: Validate Rubric Criteria against Database
    const { data: dbRubric } = await adminSupabase
      .from('rubrics')
      .select(`
        id,
        rubric_criteria (
          id,
          name,
          max_points,
          weight_percent
        )
      `)
      .eq('item_id', itemId)
      .maybeSingle();

    if (dbRubric && dbRubric.rubric_criteria && dbRubric.rubric_criteria.length > 0) {
      const criteriaList = dbRubric.rubric_criteria as unknown as CriterionRecord[];
      const criteriaMap = new Map<string, CriterionRecord>(
        criteriaList.map((c) => [c.id, c])
      );

      for (const cs of criterionScores) {
        const dbCriterion = criteriaMap.get(cs.criterionId);
        if (!dbCriterion) {
          return NextResponse.json(
            { error: `Tiêu chí chấm điểm (${cs.criterionId}) không thuộc Rubric của câu hỏi này` },
            { status: 400 }
          );
        }

        const maxPoints = Number(dbCriterion.max_points);
        if (cs.score < 0 || cs.score > maxPoints) {
          return NextResponse.json(
            {
              error: `Điểm tiêu chí "${dbCriterion.name}" (${cs.score}) vượt quá giới hạn cho phép (0 - ${maxPoints})`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 5. Calculate total awarded score on server
    const totalAwarded = criterionScores.reduce((sum, c) => sum + Number(c.score), 0);

    // 6. Update submission_answers with officially verified score
    const { error: updateAnswerError } = await adminSupabase
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

    // 7. Update AI evaluation audit status if AI previously evaluated this item
    const { data: existingAiEval } = await adminSupabase
      .from('ai_evaluations')
      .select('id, total_score')
      .eq('submission_id', submissionId)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let isOverridden = false;
    if (existingAiEval) {
      isOverridden = Math.abs(Number(existingAiEval.total_score) - totalAwarded) > 0.01;
      await adminSupabase
        .from('ai_evaluations')
        .update({
          status: isOverridden ? 'OVERRIDDEN' : 'ACCEPTED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          override_score: isOverridden ? totalAwarded : null,
          override_feedback: evaluatorFeedback || null,
        })
        .eq('id', existingAiEval.id);
    }

    // 8. Recalculate submission total score & percentage
    const { data: allAnswers } = await adminSupabase
      .from('submission_answers')
      .select('score_awarded')
      .eq('submission_id', submissionId);

    const newTotalScore = (allAnswers || []).reduce(
      (acc, curr) => acc + (Number(curr.score_awarded) || 0),
      0
    );

    const maxScore = Number(submission.max_score) || 100;
    const percentage = maxScore > 0 ? (newTotalScore / maxScore) * 100 : 0;
    const passingScore = Number(asm?.passing_score) || 70;
    const isPassed = percentage >= passingScore;

    await adminSupabase
      .from('assessment_submissions')
      .update({
        total_score: newTotalScore,
        percentage: Number(percentage.toFixed(2)),
        is_passed: isPassed,
        status: 'EVALUATED',
        grading_status: isOverridden ? 'EVALUATOR_OVERRIDDEN' : 'EVALUATOR_APPROVED',
        evaluated_by: user.id,
        evaluated_at: new Date().toISOString(),
        evaluator_notes: evaluatorFeedback || null,
      })
      .eq('id', submissionId);

    // 9. GRADE-02: Idempotent Competency Evidence
    const { data: itemData } = await adminSupabase
      .from('assessment_items')
      .select('competency_id, points')
      .eq('id', itemId)
      .single();

    if (itemData?.competency_id && submission.user_id) {
      const itemMaxPoints = Number(itemData.points) || 10;
      const competencyScore = Math.min(100, Math.max(0, Math.round((totalAwarded / itemMaxPoints) * 100)));

      // Delete prior evidence for this source and competency to prevent duplicate accumulation
      await adminSupabase
        .from('competency_evidence')
        .delete()
        .eq('source_id', submissionId)
        .eq('competency_id', itemData.competency_id)
        .eq('source_type', 'EVALUATOR_VERIFIED');

      // Insert fresh verified evidence record
      await adminSupabase.from('competency_evidence').insert({
        user_id: submission.user_id,
        competency_id: itemData.competency_id,
        source_type: 'EVALUATOR_VERIFIED',
        source_id: submissionId,
        score: competencyScore,
        weight: 2.0,
        evidence_text: evaluatorFeedback || 'Điểm được thẩm định và phê duyệt bởi Chuyên gia khảo thí',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      });
    }

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
