import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface DomainAggregation {
  index: number;
  code: string;
  name: string;
  earned: number;
  max: number;
  count: number;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const effectiveUserId = user?.id;

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch completed submissions for this learner
    const { data: submissions, error: subError } = await supabase
      .from('assessment_submissions')
      .select('id, assessment_id, total_score, max_score, percentage, is_passed, submitted_at')
      .eq('user_id', effectiveUserId)
      .eq('status', 'SUBMITTED')
      .order('submitted_at', { ascending: false });

    if (subError) {
      return NextResponse.json(
        { error: 'Lỗi khi tải lịch sử khảo thí', details: subError.message },
        { status: 500 }
      );
    }

    const defaultDomains: Record<number, DomainAggregation> = {
      1: { index: 1, code: 'D1', name: 'Thông tin & Dữ liệu', earned: 0, max: 0, count: 0 },
      2: { index: 2, code: 'D2', name: 'Giao tiếp & Hợp tác', earned: 0, max: 0, count: 0 },
      3: { index: 3, code: 'D3', name: 'Sáng tạo Nội dung số', earned: 0, max: 0, count: 0 },
      4: { index: 4, code: 'D4', name: 'An toàn & Bảo mật', earned: 0, max: 0, count: 0 },
      5: { index: 5, code: 'D5', name: 'Giải quyết Vấn đề', earned: 0, max: 0, count: 0 },
    };

    const submissionIds = (submissions || []).map((s) => s.id);
    const hasTakenAssessment = submissionIds.length > 0;
    const latestSubmissionId = submissions?.[0]?.id ?? null;

    // 3. If user has NOT completed any assessment, return pure 0% baseline
    if (!hasTakenAssessment) {
      const radarData = [1, 2, 3, 4, 5].map((idx) => {
        const dom = defaultDomains[idx];
        return {
          code: dom.code,
          name: dom.name,
          score: 0,
          target: 70,
          level: 'Chưa khảo thí',
          questionsCount: 0,
        };
      });

      return NextResponse.json({
        success: true,
        hasTakenAssessment: false,
        totalAssessmentsCompleted: 0,
        latestSubmissionId: null,
        overallScore: 0,
        radarData,
        insights: null,
        latestAnalysis: null,
      });
    }

    // 4. Aggregate question-level scores by domain from real submissions
    const { data: answers, error: ansError } = await supabase
      .from('submission_answers')
      .select(`
        id,
        score_awarded,
        is_correct,
        assessment_items (
          id,
          points,
          competencies (
            id,
            skill_code,
            competency_domains (
              id,
              domain_index,
              title
            )
          )
        )
      `)
      .in('submission_id', submissionIds);

    if (!ansError && answers) {
      for (const ans of answers) {
        const item = ans.assessment_items as {
          id?: string;
          points?: number;
          competencies?: {
            id?: string;
            skill_code?: string;
            competency_domains?: {
              id?: string;
              domain_index?: number;
              title?: string;
            } | null;
          } | null;
        } | null;

        const domainIndex = item?.competencies?.competency_domains?.domain_index ?? 0;
        const points = Number(item?.points || 1);
        const scoreAwarded = Number(ans.score_awarded || 0);

        if (domainIndex >= 1 && domainIndex <= 5) {
          defaultDomains[domainIndex].earned += scoreAwarded;
          defaultDomains[domainIndex].max += points;
          defaultDomains[domainIndex].count += 1;
        }
      }
    }

    // 5. Calculate real percentages for each domain (NO mock baseline!)
    const radarData = [1, 2, 3, 4, 5].map((idx) => {
      const dom = defaultDomains[idx];
      const score = dom.max > 0 ? Math.min(100, Math.max(0, Math.round((dom.earned / dom.max) * 100))) : 0;

      let level = 'Level 1: Cơ bản';
      if (score >= 85) level = 'Level 4: Rất nâng cao';
      else if (score >= 70) level = 'Level 3: Nâng cao';
      else if (score >= 55) level = 'Level 2: Trung cấp';
      else if (score === 0) level = 'Chưa khảo thí';

      return {
        code: dom.code,
        name: dom.name,
        score,
        target: 70,
        level,
        questionsCount: dom.count,
      };
    });

    // 6. Determine Strengths and Skill Gaps (< 70%)
    const sortedDomains = [...radarData].sort((a, b) => b.score - a.score);
    const strongest = sortedDomains[0];
    const weakest = sortedDomains[sortedDomains.length - 1];

    const overallScore = Math.round(
      radarData.reduce((acc, curr) => acc + curr.score, 0) / radarData.length
    );

    // 7. Check if AI competency analysis already exists for latest submission
    let latestAnalysis = null;
    if (latestSubmissionId) {
      const { data: analysisData } = await supabase
        .from('competency_analyses')
        .select('id, pedagogical_feedback, strengths, weaknesses, skill_gaps, overall_level, learning_pathway, created_at')
        .eq('submission_id', latestSubmissionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysisData) {
        latestAnalysis = {
          id: analysisData.id,
          pedagogicalFeedback: analysisData.pedagogical_feedback,
          strengths: analysisData.strengths || [],
          weaknesses: analysisData.weaknesses || [],
          skillGaps: analysisData.skill_gaps || [],
          overallLevel: analysisData.overall_level,
          learningPathway: analysisData.learning_pathway || [],
          createdAt: analysisData.created_at,
        };
      }
    }

    return NextResponse.json({
      success: true,
      hasTakenAssessment: true,
      totalAssessmentsCompleted: submissions.length,
      latestSubmissionId,
      overallScore,
      radarData,
      insights: {
        strongest: {
          code: strongest.code,
          name: strongest.name,
          score: strongest.score,
          level: strongest.level,
        },
        weakest: {
          code: weakest.code,
          name: weakest.name,
          score: weakest.score,
          level: weakest.level,
          isGap: weakest.score < 70,
        },
      },
      latestAnalysis,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
