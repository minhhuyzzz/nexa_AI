import { use } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Clock, ArrowRight } from 'lucide-react';
import {
  AssessmentResultClientView,
  ResultAnswerItem,
} from '@/components/dashboard/assessments/AssessmentResultClientView';
import { AIEvaluationView } from '@/components/assessment/AIGradingCard';
import { CriterionScore } from '@/features/ai-gateway/types/grading.types';

export default async function AssessmentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submissionId?: string }>;
}) {
  const { id: rawId } = await params;
  const { submissionId } = await searchParams;

  const CANONICAL_BASELINE_ID = 'a0000000-0000-0000-0000-000000000001';
  const assessmentId = rawId === 'baseline' ? CANONICAL_BASELINE_ID : rawId;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/personal/assessments/${assessmentId}/result`);
  }

  // 1. Fetch submission data
  let submissionQuery = supabase
    .from('assessment_submissions')
    .select(`
      id,
      total_score,
      max_score,
      percentage,
      points_awarded,
      is_passed,
      time_spent_seconds,
      submitted_at,
      assessments (
        id,
        title,
        passing_score,
        duration_minutes
      )
    `)
    .eq('user_id', user.id);

  if (submissionId) {
    submissionQuery = submissionQuery.eq('id', submissionId);
  } else {
    submissionQuery = submissionQuery
      .eq('assessment_id', assessmentId)
      .order('submitted_at', { ascending: false })
      .limit(1);
  }

  const { data: submissions } = await submissionQuery;
  const submission = submissions && submissions.length > 0 ? submissions[0] : null;

  if (!submission) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] max-w-md mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-slate-400">
          <Clock className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Chưa có kết quả bài nộp</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            Bạn chưa làm hoặc chưa nộp bài khảo thí này. Hãy bắt đầu làm bài để ghi nhận kết quả và điểm năng lực số.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href={`/personal/take/${assessmentId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <span>Bắt đầu làm bài ngay</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fetch answer details with questions and options
  const { data: dbAnswers } = await supabase
    .from('submission_answers')
    .select(`
      id,
      item_id,
      score_awarded,
      is_correct,
      selected_option_id,
      text_response,
      evidence_url,
      assessment_items (
        id,
        prompt,
        points,
        type,
        order_index,
        competencies (
          skill_code,
          title
        ),
        item_options (
          id,
          content,
          is_correct,
          explanation,
          order_index
        )
      )
    `)
    .eq('submission_id', submission.id);

  const rawAnswers = dbAnswers || [];

  // Deduplicate and sort answers by order_index
  const sortedAnswers = [...rawAnswers].sort((a: any, b: any) => {
    const idxA = a.assessment_items?.order_index ?? 0;
    const idxB = b.assessment_items?.order_index ?? 0;
    return idxA - idxB;
  });

  const formattedAnswers: ResultAnswerItem[] = sortedAnswers.map((ans: any, idx: number) => {
    const item = ans.assessment_items || {};
    const rawOptions = item.item_options || [];
    const sortedOptions = [...rawOptions].sort((o1: any, o2: any) => (o1.order_index ?? 0) - (o2.order_index ?? 0));

    return {
      id: ans.id,
      itemId: ans.item_id,
      scoreAwarded: Number(ans.score_awarded) || 0,
      isCorrect: Boolean(ans.is_correct),
      selectedOptionId: ans.selected_option_id,
      textResponse: ans.text_response,
      evidenceUrl: ans.evidence_url,
      prompt: item.prompt || 'Câu hỏi',
      points: Number(item.points) || 1,
      orderIndex: idx,
      competencyCode: item.competencies?.skill_code,
      competencyTitle: item.competencies?.title,
      options: sortedOptions.map((opt: any) => ({
        id: opt.id,
        content: opt.content,
        isCorrect: Boolean(opt.is_correct),
        explanation: opt.explanation || undefined,
      })),
    };
  });

  // 3. Fetch any existing AI evaluations for this submission
  const { data: aiEvaluations } = await supabase
    .from('ai_evaluations')
    .select(`
      id,
      item_id,
      total_score,
      max_score,
      confidence_score,
      confidence_flag,
      evidence_quote,
      strengths,
      weaknesses,
      feedback,
      criterion_scores,
      model_name
    `)
    .eq('submission_id', submission.id);

  const evalMap: Record<string, AIEvaluationView> = {};
  (aiEvaluations || []).forEach((ev) => {
    evalMap[ev.item_id] = {
      id: ev.id,
      totalScore: Number(ev.total_score),
      maxScore: Number(ev.max_score),
      confidenceScore: Number(ev.confidence_score),
      confidenceFlag: ev.confidence_flag as 'GREEN' | 'AMBER' | 'RED',
      evidenceQuote: ev.evidence_quote,
      strengths: ev.strengths,
      weaknesses: ev.weaknesses,
      feedback: ev.feedback,
      criterionScores: (ev.criterion_scores as unknown as CriterionScore[]) || [],
      modelName: ev.model_name,
    };
  });

  const isPassed = Boolean(submission.is_passed);
  const scoreOn10 =
    submission.max_score > 0
      ? Math.round((Number(submission.total_score) / Number(submission.max_score)) * 100) / 10
      : 0;

  const percentage =
    submission.percentage !== null && submission.percentage !== undefined
      ? Number(submission.percentage)
      : submission.max_score > 0
      ? Math.round((Number(submission.total_score) / Number(submission.max_score)) * 100)
      : 0;

  const assessmentTitle =
    (submission.assessments as any)?.title || 'Bài Khảo Thí Năng Lực Số';

  return (
    <AssessmentResultClientView
      assessmentId={assessmentId}
      assessmentTitle={assessmentTitle}
      isPassed={isPassed}
      scoreOn10={scoreOn10}
      percentage={percentage}
      pointsAwarded={Number(submission.points_awarded) || 0}
      timeSpentSeconds={Number(submission.time_spent_seconds) || 0}
      submittedAt={submission.submitted_at}
      answers={formattedAnswers}
      evalMap={evalMap}
      submissionId={submission.id}
    />
  );
}
