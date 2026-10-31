import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DomainAssessmentSummaryService } from '@/features/competency/services/domain-assessment-summary.service';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // 2. Compute canonical 5-domain competency summary
    const summary = await DomainAssessmentSummaryService.getUserCompetencySummary(
      supabase,
      user.id
    );

    // 3. Extract assessed domains for diagnostic insights
    const assessedDomains = summary.radarData.filter(
      (d): d is typeof d & { score: number } => d.score !== null
    );

    let insights: {
      strongest: { code: string; name: string; score: number; level: string } | null;
      weakest: { code: string; name: string; score: number; level: string; isGap: boolean } | null;
    } | null = null;

    if (assessedDomains.length > 0) {
      const sorted = [...assessedDomains].sort((a, b) => b.score - a.score);
      const strongest = sorted[0];
      const weakest = sorted[sorted.length - 1];

      insights = {
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
      };
    }

    // 4. Check if AI competency analysis already exists for latest submission
    let latestAnalysis = null;
    if (summary.latestSubmissionId) {
      const { data: analysisData } = await supabase
        .from('competency_analyses')
        .select('id, pedagogical_feedback, strengths, weaknesses, skill_gaps, overall_level, learning_pathway, created_at')
        .eq('submission_id', summary.latestSubmissionId)
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
      hasTakenAssessment: summary.hasTakenAssessment,
      totalAssessmentsCompleted: summary.totalAssessmentsCompleted,
      assessedDomainsCount: summary.assessedDomainsCount,
      totalDomainsCount: summary.totalDomainsCount,
      latestSubmissionId: summary.latestSubmissionId,
      overallScore: summary.overallScore,
      radarData: summary.radarData,
      insights,
      latestAnalysis,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
