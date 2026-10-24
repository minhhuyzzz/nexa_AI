import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
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
        { error: 'Chỉ Chuyên gia khảo thí (EVALUATOR) hoặc Quản trị viên mới có quyền truy cập bàn chấm' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId') || searchParams.get('classId');

    // 3. Fetch evaluator's classes to build student-to-group map
    const { data: rawClasses } = await supabase
      .from('evaluator_classes')
      .select(`
        id,
        name,
        class_code,
        class_members ( user_id )
      `)
      .eq('evaluator_id', user.id);

    const groupMap = new Map<string, { id: string; name: string; code: string }>();
    (rawClasses || []).forEach((c: any) => {
      (c.class_members || []).forEach((m: any) => {
        groupMap.set(m.user_id, { id: c.id, name: c.name, code: c.class_code });
      });
    });

    let filterUserIds: string[] | null = null;
    if (groupId) {
      const matchedClass = (rawClasses || []).find((c: any) => c.id === groupId);
      if (matchedClass) {
        filterUserIds = (matchedClass.class_members || []).map((m: any) => m.user_id);
      } else {
        filterUserIds = [];
      }
    }

    if (filterUserIds !== null && filterUserIds.length === 0) {
      return NextResponse.json({
        submissions: [],
        classes: (rawClasses || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.class_code,
        })),
      });
    }

    // 4. Fetch submissions (latest first)
    let subQuery = supabase
      .from('assessment_submissions')
      .select(`
        id,
        user_id,
        assessment_id,
        status,
        grading_status,
        integrity_flag,
        evaluator_notes,
        total_score,
        max_score,
        percentage,
        is_passed,
        time_spent_seconds,
        submitted_at,
        created_at,
        assessments (
          id,
          title,
          passing_score
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (filterUserIds && filterUserIds.length > 0) {
      subQuery = subQuery.in('user_id', filterUserIds);
    }

    const { data: rawSubmissions, error: subError } = await subQuery;

    if (subError) {
      console.error('Error fetching submissions:', subError);
      return NextResponse.json({ error: 'Không thể tải danh sách bài làm' }, { status: 500 });
    }

    if (!rawSubmissions || rawSubmissions.length === 0) {
      return NextResponse.json({
        submissions: [],
        classes: (rawClasses || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.class_code,
        })),
      });
    }

    // 4. Fetch candidate profiles
    const userIds = Array.from(new Set(rawSubmissions.map((s) => s.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // 5. Fetch all answers for these submissions that have text responses or evidence
    const submissionIds = rawSubmissions.map((s) => s.id);
    const { data: answers, error: answersError } = await supabase
      .from('submission_answers')
      .select(`
        id,
        submission_id,
        item_id,
        text_response,
        evidence_url,
        score_awarded,
        auto_graded,
        assessment_items (
          id,
          prompt,
          points,
          type,
          order_index
        )
      `)
      .in('submission_id', submissionIds);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
    }

    interface AssessmentItemRaw {
      id: string;
      prompt: string;
      points: number;
      type: string;
      order_index: number;
    }

    // Filter to only items needing human or rubric evaluation: SCENARIO, PRACTICAL_TASK, DIGITAL_EVIDENCE or text_response
    const relevantAnswers = (answers || []).filter((ans) => {
      const rawItem = Array.isArray(ans.assessment_items)
        ? (ans.assessment_items[0] as AssessmentItemRaw | undefined)
        : (ans.assessment_items as AssessmentItemRaw | null);
      const itemType = rawItem?.type;
      return (
        itemType === 'SCENARIO' ||
        itemType === 'PRACTICAL_TASK' ||
        itemType === 'DIGITAL_EVIDENCE' ||
        Boolean(ans.text_response?.trim()) ||
        Boolean(ans.evidence_url)
      );
    });

    // 6. Fetch Rubrics for relevant items
    const relevantItemIds = Array.from(
      new Set(relevantAnswers.map((a) => a.item_id).filter(Boolean))
    );

    interface CriterionLevel {
      id: string;
      level_name: string;
      score_percent: number;
      description: string;
    }

    interface RubricCriterionItem {
      id: string;
      name: string;
      weight_percent: number;
      max_points: number;
      order_index: number;
      rubric_levels: CriterionLevel[];
    }

    interface RubricItem {
      id: string;
      item_id: string;
      title: string;
      description: string | null;
      rubric_criteria: RubricCriterionItem[];
    }

    const { data: rubrics } = await supabase
      .from('rubrics')
      .select(`
        id,
        item_id,
        title,
        description,
        rubric_criteria (
          id,
          name,
          weight_percent,
          max_points,
          order_index,
          rubric_levels (
            id,
            level_name,
            score_percent,
            description
          )
        )
      `)
      .in('item_id', relevantItemIds);

    const rubricMap = new Map<string, RubricItem>();
    (rubrics || []).forEach((r) => {
      rubricMap.set(r.item_id, r as unknown as RubricItem);
    });

    // 7. Fetch existing AI evaluations
    const { data: aiEvals } = await supabase
      .from('ai_evaluations')
      .select('*')
      .in('submission_id', submissionIds)
      .order('created_at', { ascending: false });

    const aiEvalMap = new Map<string, Record<string, unknown>>();
    (aiEvals || []).forEach((e) => {
      const key = `${e.submission_id}_${e.item_id}`;
      if (!aiEvalMap.has(key)) {
        aiEvalMap.set(key, e as Record<string, unknown>);
      }
    });

    interface AssessmentInfoRaw {
      id: string;
      title: string;
      passing_score: number;
    }

    // 8. Assemble combined data structure
    const formattedSubmissions = rawSubmissions.map((sub) => {
      const candidateProfile = profileMap.get(sub.user_id);
      const rawAssessment = Array.isArray(sub.assessments)
        ? (sub.assessments[0] as AssessmentInfoRaw | undefined)
        : (sub.assessments as AssessmentInfoRaw | null);

      const subAnswers = relevantAnswers
        .filter((a) => a.submission_id === sub.id)
        .map((ans) => {
          const rawItem = Array.isArray(ans.assessment_items)
            ? (ans.assessment_items[0] as AssessmentItemRaw | undefined)
            : (ans.assessment_items as AssessmentItemRaw | null);
          const rubric = rubricMap.get(ans.item_id);
          const aiEval = aiEvalMap.get(`${sub.id}_${ans.item_id}`);

          return {
            id: ans.id,
            itemId: ans.item_id,
            itemType: rawItem?.type || 'PRACTICAL_TASK',
            orderIndex: rawItem?.order_index ?? 0,
            prompt: rawItem?.prompt || '',
            maxPoints: Number(rawItem?.points) || 10,
            textResponse: ans.text_response || '',
            evidenceUrl: ans.evidence_url || null,
            scoreAwarded: Number(ans.score_awarded) || 0,
            autoGraded: ans.auto_graded,
            rubric: rubric
              ? {
                  id: rubric.id,
                  title: rubric.title,
                  description: rubric.description,
                  criteria: (rubric.rubric_criteria || [])
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((c) => ({
                      id: c.id,
                      name: c.name,
                      weightPercent: Number(c.weight_percent),
                      maxPoints: Number(c.max_points),
                      levels: (c.rubric_levels || []).sort(
                        (a, b) => b.score_percent - a.score_percent
                      ),
                    })),
                }
              : null,
            aiEvaluation: aiEval
              ? {
                  id: String(aiEval.id),
                  totalScore: Number(aiEval.total_score),
                  maxScore: Number(aiEval.max_score),
                  confidenceScore: Number(aiEval.confidence_score),
                  confidenceFlag: String(aiEval.confidence_flag),
                  evidenceQuote: (aiEval.evidence_quote as string) || null,
                  strengths: (aiEval.strengths as string) || null,
                  weaknesses: (aiEval.weaknesses as string) || null,
                  feedback: String(aiEval.feedback || ''),
                  criterionScores: aiEval.criterion_scores,
                }
              : null,
          };
        });

      const userGroup = groupMap.get(sub.user_id);

      return {
        id: sub.id,
        userId: sub.user_id,
        candidateName: candidateProfile?.full_name || 'Học viên ẩn danh',
        candidateEmail: candidateProfile?.email || 'N/A',
        assessmentTitle: rawAssessment?.title || 'Bài đánh giá năng lực số',
        passingScore: Number(rawAssessment?.passing_score) || 70,
        status: sub.status,
        gradingStatus: sub.grading_status || 'PENDING_REVIEW',
        integrityFlag: sub.integrity_flag || 'NORMAL',
        evaluatorNotes: sub.evaluator_notes || null,
        totalScore: Number(sub.total_score) || 0,
        maxScore: Number(sub.max_score) || 100,
        percentage: Number(sub.percentage) || 0,
        isPassed: Boolean(sub.is_passed),
        submittedAt: sub.submitted_at || sub.created_at,
        timeSpentSeconds: sub.time_spent_seconds || 0,
        items: subAnswers,
        groupId: userGroup?.id || null,
        groupName: userGroup?.name || null,
        groupCode: userGroup?.code || null,
      };
    });

    return NextResponse.json({
      submissions: formattedSubmissions,
      classes: (rawClasses || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.class_code,
      })),
    });
  } catch (err) {
    console.error('Unexpected error in evaluator submissions:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
