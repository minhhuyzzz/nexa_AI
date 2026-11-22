import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { id: assessmentId } = await params;
    const adminSupabase = createAdminClient();

    // 1. Lấy thông tin bài khảo thí
    const { data: assessment, error: asmErr } = await adminSupabase
      .from('assessments')
      .select('id, title, description, duration_minutes, passing_score, created_at')
      .eq('id', assessmentId)
      .single();

    if (asmErr || !assessment) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí' }, { status: 404 });
    }

    // 2. Lấy danh sách câu hỏi và đáp án
    const { data: items } = await adminSupabase
      .from('assessment_items')
      .select(`
        id,
        prompt,
        points,
        order_index,
        competencies (
          skill_code,
          competency_domains (
            code,
            title
          )
        ),
        item_options (
          id,
          content,
          is_correct,
          order_index
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('order_index', { ascending: true });

    const safeItems = items || [];

    // 3. Lấy danh sách bài nộp của học viên
    const { data: submissions } = await adminSupabase
      .from('assessment_submissions')
      .select(`
        id,
        user_id,
        score,
        percentage,
        time_spent_seconds,
        submitted_at,
        profiles (
          full_name,
          email
        )
      `)
      .eq('assessment_id', assessmentId)
      .eq('status', 'EVALUATED')
      .order('submitted_at', { ascending: false });

    const safeSubmissions = submissions || [];
    const submissionIds = safeSubmissions.map((s) => s.id);

    // 4. Lấy toàn bộ câu trả lời chi tiết
    let allAnswers: any[] = [];
    if (submissionIds.length > 0) {
      const { data: answers } = await adminSupabase
        .from('submission_answers')
        .select('submission_id, item_id, selected_option_id, is_correct, score_awarded')
        .in('submission_id', submissionIds);
      allAnswers = answers || [];
    }

    // Tạo map answers theo submissionId và itemId
    const answersBySub: Record<string, any[]> = {};
    const answersByItem: Record<string, any[]> = {};

    allAnswers.forEach((ans) => {
      if (!answersBySub[ans.submission_id]) answersBySub[ans.submission_id] = [];
      answersBySub[ans.submission_id].push(ans);

      if (!answersByItem[ans.item_id]) answersByItem[ans.item_id] = [];
      answersByItem[ans.item_id].push(ans);
    });

    // 5. Thống kê theo từng học viên
    const participants = safeSubmissions.map((sub, idx) => {
      const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
      const subAns = answersBySub[sub.id] || [];
      const ansByItemId = new Map(subAns.map((a) => [a.item_id, a]));

      // Tính điểm theo 5 miền
      const domainTotals: Record<string, { correct: number; total: number }> = {
        '01': { correct: 0, total: 0 },
        '02': { correct: 0, total: 0 },
        '03': { correct: 0, total: 0 },
        '04': { correct: 0, total: 0 },
        '05': { correct: 0, total: 0 },
      };

      safeItems.forEach((it) => {
        const comp = Array.isArray(it.competencies) ? it.competencies[0] : it.competencies;
        const dom = Array.isArray(comp?.competency_domains)
          ? comp?.competency_domains[0]
          : comp?.competency_domains;
        const dCode = dom?.code || '01';

        if (domainTotals[dCode]) {
          domainTotals[dCode].total += 1;
          const a = ansByItemId.get(it.id);
          if (a?.is_correct) {
            domainTotals[dCode].correct += 1;
          }
        }
      });

      const domainScores: Record<string, number> = {};
      let weakestDomain = '01';
      let lowestScore = 999;

      Object.entries(domainTotals).forEach(([dCode, stats]) => {
        const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        domainScores[dCode] = pct;
        if (pct < lowestScore) {
          lowestScore = pct;
          weakestDomain = dCode;
        }
      });

      return {
        stt: idx + 1,
        fullName: profile?.full_name || 'Học viên ẩn danh',
        email: profile?.email || 'N/A',
        submittedAt: sub.submitted_at
          ? new Date(sub.submitted_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          : 'N/A',
        totalScorePercent: sub.percentage ?? Math.round(Number(sub.score || 0)),
        domainScores,
        weakestDomain,
      };
    });

    // 6. Thống kê theo câu hỏi
    const questionAnalytics = safeItems.map((it, idx) => {
      const comp = Array.isArray(it.competencies) ? it.competencies[0] : it.competencies;
      const dom = Array.isArray(comp?.competency_domains)
        ? comp?.competency_domains[0]
        : comp?.competency_domains;
      const domainCode = dom?.code || '01';
      const domainTitle = dom?.title || 'Miền số';

      const itemAnswers = answersByItem[it.id] || [];
      const totalAnswers = itemAnswers.length;
      const correctAnswers = itemAnswers.filter((a) => a.is_correct).length;
      const correctRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

      const opts = (it.item_options || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
      const optionStats = opts.map((opt: any, optIdx: number) => {
        const count = itemAnswers.filter((a) => a.selected_option_id === opt.id).length;
        const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
        return {
          label: String.fromCharCode(65 + optIdx), // A, B, C, D
          content: opt.content,
          isCorrect: opt.is_correct,
          count,
          percent: pct,
        };
      });

      return {
        questionNumber: idx + 1,
        domainCode,
        domainTitle,
        prompt: it.prompt,
        totalAnswers,
        correctAnswers,
        correctRate,
        optionStats,
      };
    });

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        totalQuestions: safeItems.length,
        totalSubmissions: safeSubmissions.length,
      },
      participants,
      questionAnalytics,
    });
  } catch (err) {
    console.error('[SURVEY_EXPORT_ERROR]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi máy chủ khi kết xuất khảo sát' },
      { status: 500 }
    );
  }
}
