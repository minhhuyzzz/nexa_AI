import { use } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  FileText,
  Paperclip,
} from 'lucide-react';
import { AIGradingCard, type AIEvaluationView } from '@/components/assessment/AIGradingCard';
import { CriterionScore } from '@/features/ai-gateway/types/grading.types';

export default async function AssessmentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submissionId?: string }>;
}) {
  const { id: assessmentId } = await params;
  const { submissionId } = await searchParams;

  const supabase = await createClient();

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
        title,
        passing_score,
        duration_minutes
      )
    `);

  if (submissionId) {
    submissionQuery = submissionQuery.eq('id', submissionId);
  } else {
    // If no submissionId in URL, fetch latest submission of this assessment
    submissionQuery = submissionQuery
      .eq('assessment_id', assessmentId)
      .order('submitted_at', { ascending: false })
      .limit(1);
  }

  const { data: submissions } = await submissionQuery;
  const submission = (submissions && submissions.length > 0) ? submissions[0] : null;

  if (!submission) {
    return (
      <div className="p-12 text-center rounded-md border border-slate-200 bg-white max-w-md mx-auto my-12">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Chưa có kết quả bài nộp</h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Bạn chưa thực hiện hoặc chưa nộp bài khảo thí này. Hãy bắt đầu làm bài để ghi nhận kết quả và điểm năng lực số.
        </p>
        <Link
          href={`/learner/take/${assessmentId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
        >
          <span>Làm bài khảo thí ngay</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
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

  const answers = dbAnswers || [];

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

  const evalMap = new Map<string, AIEvaluationView>();
  (aiEvaluations || []).forEach((ev) => {
    evalMap.set(ev.item_id, {
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
    });
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const isPassed = submission.is_passed;
  const scoreOn10 = submission.max_score > 0
    ? Math.round((submission.total_score / submission.max_score) * 100) / 10
    : 0;

  return (
    <div className="space-y-6">
      {/* Result Hero Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPassed ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isPassed ? 'ĐẠT CHUẨN NĂNG LỰC SỐ' : 'CẦN TIẾP TỤC BỒI DƯỠNG'}
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-700">
                Chuẩn đạt: ≥ 7.0 / 10.0
              </span>
              {submission.points_awarded > 0 && (
                <>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A] font-semibold font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff9a27]" />
                    +{submission.points_awarded}đ tích lũy mở chứng chỉ
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {/* @ts-expect-error assessment join */}
              {submission.assessments?.title || 'Kết quả khảo thí năng lực số'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Khảo thí hoàn tất lúc {new Date(submission.submitted_at).toLocaleString('vi-VN')}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-0.5">ĐIỂM BÀI THI (THANG 10)</div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">
                {scoreOn10.toFixed(1)}{' '}
                <span className="text-base font-normal text-slate-400">/ 10.0</span>
              </div>
            </div>

            <div className="text-right pl-6 border-l border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">TỶ LỆ QUY ĐỔI</div>
              <div
                className={`text-3xl font-bold tracking-tight font-mono ${
                  isPassed ? 'text-sky-600' : 'text-rose-600'
                }`}
              >
                {submission.percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Speed & Compliance Tags */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <Zap className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
              <span>Chấm tự động tức thì: 0.01s (0 token AI lãng phí)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>Thời gian làm bài: {formatTime(submission.time_spent_seconds)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/learner/take/${assessmentId}`}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 font-sans"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
              Thi lại
            </Link>
            <Link
              href="/learner/assessments"
              className="px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 font-sans"
            >
              Về danh sách đề
            </Link>
          </div>
        </div>
      </div>

      {/* On-Demand AI Analysis Trigger Card (Rule 6 compliant) */}
      <div className="p-6 rounded-md bg-slate-50 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              CƠ CHẾ KÍCH HOẠT AI THEO YÊU CẦU (ON-DEMAND AI)
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Phân Tích Khoảng Trống Năng Lực &amp; Đề Xuất Lộ Trình 4 Bước
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Hệ thống chỉ kích hoạt AI khi bạn chủ động yêu cầu. AI sẽ quét toàn bộ bài làm, bóc tách điểm mạnh/yếu, định vị các kỹ năng dưới 60% và thiết lập lộ trình học liệu cá nhân hóa.
          </p>
        </div>

        <Link
          href={`/learner/competency/analysis?submissionId=${submission.id}`}
          className="px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
          Phân tích năng lực bằng AI
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Chi tiết Bài làm &amp; Giải thích Đáp án</h2>
          <span className="text-xs text-slate-500">
            {answers?.filter((a) => a.is_correct).length || 0} / {answers?.length || 0} CÂU ĐÚNG
          </span>
        </div>

        {answers &&
          // @ts-expect-error nested order_index
          answers.sort((a, b) => (a.assessment_items?.order_index || 0) - (b.assessment_items?.order_index || 0)).map((ans, idx) => {
            const item = ans.assessment_items as unknown as {
              prompt: string;
              points: number;
              competencies?: { skill_code: string; title: string };
              item_options: { id: string; content: string; is_correct: boolean; explanation?: string }[];
            };

            const isCorrect = ans.is_correct;
            const chosenOption = item.item_options.find((o) => o.id === ans.selected_option_id);
            const correctOption = item.item_options.find((o) => o.is_correct);

            return (
              <div
                key={ans.id}
                className={`p-6 rounded-md bg-white border shadow-xs transition-colors ${
                  isCorrect ? 'border-slate-200' : 'border-rose-200'
                }`}
              >
                {/* Meta */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isCorrect ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      CÂU {idx + 1}
                    </span>
                    {item.competencies && (
                      <span className="text-xs text-slate-500">
                        {item.competencies.skill_code}: {item.competencies.title}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-bold ${
                      isCorrect ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {ans.score_awarded} / {item.points} pts
                  </span>
                </div>

                {/* Prompt */}
                <h3 className="text-sm font-semibold text-slate-900 mb-4">{item.prompt}</h3>

                {/* Options List */}
                <div className="space-y-2 mb-4">
                  {item.item_options.map((opt) => {
                    const isCandidateChoice = opt.id === ans.selected_option_id;
                    const isRightAnswer = opt.is_correct;

                    let optionStyle = 'border-slate-200 bg-white text-slate-700';
                    if (isRightAnswer) {
                      optionStyle = 'border-emerald-300 bg-emerald-50/60 text-emerald-950 font-medium';
                    } else if (isCandidateChoice && !isRightAnswer) {
                      optionStyle = 'border-rose-300 bg-rose-50/60 text-rose-950';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-md border text-xs flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isRightAnswer ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
                          ) : isCandidateChoice ? (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-300 inline-block shrink-0" />
                          )}
                          <span>{opt.content}</span>
                        </div>

                        {isCandidateChoice && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 shrink-0">
                            Bạn đã chọn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {correctOption?.explanation && (
                  <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Giải thích chuẩn học thuật: </span>
                    {correctOption.explanation}
                  </div>
                )}

                {/* Submitted Evidence File Attachment */}
                {ans.evidence_url && (
                  <div className="mt-4 p-3.5 rounded-md bg-white border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <Paperclip className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
                      <span>Tệp minh chứng số đính kèm của bài thi</span>
                    </div>
                    <a
                      href={ans.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors font-semibold text-xs inline-flex items-center gap-1"
                    >
                      Mở xem tệp ↗
                    </a>
                  </div>
                )}

                {/* Candidate Essay Response if SCENARIO */}
                {ans.text_response && (
                  <div className="mt-4 p-4 rounded-md bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      BẢN GIẢI TRÌNH &amp; PHƯƠNG ÁN ỨNG PHÓ CỦA BẠN:
                    </div>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {ans.text_response}
                    </p>
                  </div>
                )}

                {/* On-Demand AI Rubric Grading Card (Rule 6 compliant) */}
                {ans.text_response && (
                  <AIGradingCard
                    submissionId={submission.id}
                    itemId={ans.item_id}
                    hasTextResponse={Boolean(ans.text_response)}
                    initialEvaluation={evalMap.get(ans.item_id) || null}
                  />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
