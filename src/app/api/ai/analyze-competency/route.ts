import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAIAdapter } from '@/features/ai-gateway/adapters';
import {
  DomainScoreInput,
  SkillScoreInput,
  QuestionMistakeInput,
} from '@/features/ai-gateway/types/competency.types';

const requestSchema = z.object({
  submissionId: z.string().uuid('Mã bài thi (submissionId) không hợp lệ'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { submissionId } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name, credits')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ người dùng' }, { status: 404 });
    }

    // 3. Check if analysis already exists in competency_analyses (prevent duplicate AI charge)
    const { data: existingAnalysis } = await supabase
      .from('competency_analyses')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingAnalysis) {
      return NextResponse.json({
        success: true,
        isCached: true,
        analysis: {
          id: existingAnalysis.id,
          overallLevel: existingAnalysis.overall_level,
          overallSummary: existingAnalysis.pedagogical_feedback,
          radarData: existingAnalysis.radar_data,
          skillGaps: existingAnalysis.skill_gaps,
          strengths: existingAnalysis.strengths,
          weaknesses: existingAnalysis.weaknesses,
          pedagogicalFeedback: existingAnalysis.pedagogical_feedback,
          learningPathway: existingAnalysis.learning_pathway,
          modelName: existingAnalysis.model_name,
        },
      });
    }

    // 4. Verify AI credits for Learner (Evaluators & Admins bypass)
    if (profile.role === 'LEARNER' && (profile.credits ?? 0) <= 0) {
      return NextResponse.json(
        {
          error: 'Bạn đã hết AI credits. Vui lòng nâng cấp gói để nhận thêm credits.',
          code: 'OUT_OF_CREDITS',
        },
        { status: 403 }
      );
    }

    // 5. Fetch submission details
    const { data: submission, error: subError } = await supabase
      .from('assessment_submissions')
      .select(`
        id,
        user_id,
        assessment_id,
        total_score,
        max_score,
        percentage,
        assessments (
          title
        )
      `)
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Không tìm thấy bài làm' }, { status: 404 });
    }

    // 6. Fetch submission answers with item, competency, and domain details
    const { data: answers, error: answersError } = await supabase
      .from('submission_answers')
      .select(`
        id,
        score_awarded,
        is_correct,
        text_response,
        assessment_items (
          id,
          prompt,
          points,
          type,
          competencies (
            id,
            skill_code,
            name,
            competency_domains (
              id,
              domain_code,
              name
            )
          )
        )
      `)
      .eq('submission_id', submissionId);

    if (answersError || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy câu trả lời của bài thi để phân tích' },
        { status: 400 }
      );
    }

    // 7. Aggregate scores by Domain and Skill
    interface AggScore {
      earned: number;
      max: number;
      name: string;
      code: string;
    }

    const domainAgg: Record<string, AggScore> = {
      DOMAIN_1: { earned: 0, max: 0, name: 'Thông tin và dữ liệu', code: 'DOMAIN_1' },
      DOMAIN_2: { earned: 0, max: 0, name: 'Giao tiếp và hợp tác', code: 'DOMAIN_2' },
      DOMAIN_3: { earned: 0, max: 0, name: 'Sáng tạo nội dung số', code: 'DOMAIN_3' },
      DOMAIN_4: { earned: 0, max: 0, name: 'An toàn số', code: 'DOMAIN_4' },
      DOMAIN_5: { earned: 0, max: 0, name: 'Giải quyết vấn đề', code: 'DOMAIN_5' },
    };

    const skillAgg: Record<string, { earned: number; max: number; name: string; domainCode: string }> = {};
    const mistakes: QuestionMistakeInput[] = [];

    answers.forEach((ans) => {
      const rawItem = Array.isArray(ans.assessment_items) ? ans.assessment_items[0] : ans.assessment_items;
      if (!rawItem) return;

      const earned = Number(ans.score_awarded) || 0;
      const maxPts = Number(rawItem.points) || 10;

      const rawComp = Array.isArray(rawItem.competencies) ? rawItem.competencies[0] : rawItem.competencies;
      const skillCode = rawComp?.skill_code || '1.1';
      const skillName = rawComp?.name || 'Năng lực số chung';

      const rawDomain = Array.isArray(rawComp?.competency_domains)
        ? rawComp.competency_domains[0]
        : rawComp?.competency_domains;
      const domainCode = rawDomain?.domain_code || 'DOMAIN_1';
      const domainName = rawDomain?.name || 'Thông tin và dữ liệu';

      // Update Domain
      if (!domainAgg[domainCode]) {
        domainAgg[domainCode] = { earned: 0, max: 0, name: domainName, code: domainCode };
      }
      domainAgg[domainCode].earned += earned;
      domainAgg[domainCode].max += maxPts;

      // Update Skill
      if (!skillAgg[skillCode]) {
        skillAgg[skillCode] = { earned: 0, max: 0, name: skillName, domainCode };
      }
      skillAgg[skillCode].earned += earned;
      skillAgg[skillCode].max += maxPts;

      // Check if mistaken or low score
      if (earned < maxPts) {
        mistakes.push({
          prompt: rawItem.prompt,
          studentAnswer: ans.text_response || 'Chọn sai đáp án trắc nghiệm',
          skillCode,
        });
      }
    });

    const domainScores: DomainScoreInput[] = Object.values(domainAgg).map((d) => {
      const percentage = d.max > 0 ? (d.earned / d.max) * 100 : 70;
      return {
        domainCode: d.code,
        domainName: d.name,
        score: Number(d.earned.toFixed(1)),
        maxScore: Number(d.max.toFixed(1)),
        percentage: Number(percentage.toFixed(1)),
      };
    });

    const skillScores: SkillScoreInput[] = Object.entries(skillAgg).map(([code, s]) => {
      const percentage = s.max > 0 ? (s.earned / s.max) * 100 : 0;
      return {
        skillCode: code,
        skillName: s.name,
        domainCode: s.domainCode,
        score: Number(s.earned.toFixed(1)),
        maxScore: Number(s.max.toFixed(1)),
        percentage: Number(percentage.toFixed(1)),
      };
    });

    const rawAssessment = Array.isArray(submission.assessments) ? submission.assessments[0] : submission.assessments;
    const assessmentTitle = rawAssessment?.title || 'Bài đánh giá năng lực số';

    // 8. Call AI Gateway
    const adapter = getAIAdapter('GOOGLE_GEMINI');
    const aiOutput = await adapter.analyzeCompetencyProfile({
      candidateName: profile.full_name || 'Học viên',
      assessmentTitle,
      overallPercentage: Number(submission.percentage) || 0,
      totalScore: Number(submission.total_score) || 0,
      maxScore: Number(submission.max_score) || 100,
      domainScores,
      skillScores,
      mistakes: mistakes.slice(0, 5), // Top 5 mistakes
    });

    // 9. Store analysis in public.competency_analyses
    const { data: savedRecord, error: saveError } = await supabase
      .from('competency_analyses')
      .insert({
        submission_id: submissionId,
        user_id: user.id,
        overall_level: aiOutput.overallLevel,
        radar_data: aiOutput.radarData,
        skill_gaps: aiOutput.skillGaps,
        strengths: aiOutput.strengths,
        weaknesses: aiOutput.weaknesses,
        pedagogical_feedback: aiOutput.pedagogicalFeedback,
        learning_pathway: aiOutput.learningPathway,
        model_name: adapter.defaultModel,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Error saving competency analysis:', saveError);
    }

    // 10. Deduct 1 credit for Learner
    let remainingCredits = profile.credits;
    if (profile.role === 'LEARNER') {
      remainingCredits = Math.max(0, (profile.credits ?? 1) - 1);
      await supabase
        .from('profiles')
        .update({ credits: remainingCredits })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: savedRecord?.id,
        overallLevel: aiOutput.overallLevel,
        overallSummary: aiOutput.overallSummary,
        radarData: aiOutput.radarData,
        skillGaps: aiOutput.skillGaps,
        strengths: aiOutput.strengths,
        weaknesses: aiOutput.weaknesses,
        pedagogicalFeedback: aiOutput.pedagogicalFeedback,
        learningPathway: aiOutput.learningPathway,
        modelName: adapter.defaultModel,
      },
      creditsRemaining: remainingCredits,
    });
  } catch (err) {
    console.error('Unexpected error in analyze-competency endpoint:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống khi phân tích năng lực';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json({ error: 'Thiếu submissionId' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: analysis } = await supabase
      .from('competency_analyses')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!analysis) {
      return NextResponse.json({ analysis: null });
    }

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        overallLevel: analysis.overall_level,
        overallSummary: analysis.pedagogical_feedback,
        radarData: analysis.radar_data,
        skillGaps: analysis.skill_gaps,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        pedagogicalFeedback: analysis.pedagogical_feedback,
        learningPathway: analysis.learning_pathway,
        modelName: analysis.model_name,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
