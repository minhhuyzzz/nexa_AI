import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !isSuperadminEmail(user.email)) {
      return NextResponse.json({ error: 'Truy cập bị từ chối' }, { status: 403 });
    }

    // 1. Lấy danh sách 5 Miền DigComp chuẩn hóa
    const { data: domains } = await supabase
      .from('competency_domains')
      .select('id, domain_index, title, description')
      .order('domain_index', { ascending: true });

    // 2. Lấy dữ liệu bài thi (assessments)
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, title, assessment_type, duration_minutes, passing_score, is_published, created_at')
      .order('created_at', { ascending: false });

    // 3. Lấy dữ liệu lượt nộp bài thực tế
    const { data: submissions } = await supabase
      .from('assessment_submissions')
      .select('id, assessment_id, user_id, status, total_score, max_score, percentage, is_passed, time_spent_seconds, submitted_at')
      .in('status', ['SUBMITTED', 'EVALUATED']);

    // 4. Lấy dữ liệu tổ chức B2B
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, code, status')
      .order('name', { ascending: true });

    // 5. Lấy dữ liệu phân tích năng lực (competency_analyses) để trích xuất điểm 5 miền nếu có
    const { data: analyses } = await supabase
      .from('competency_analyses')
      .select('submission_id, radar_data');

    // Aggregate submissions by assessment
    const subList = submissions || [];
    const totalSubmissions = subList.length;
    const passedCount = subList.filter((s) => s.is_passed).length;
    const overallPassRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
    const avgScore =
      totalSubmissions > 0
        ? Number((subList.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0) / totalSubmissions).toFixed(1))
        : 0;

    // Quality breakdown per assessment
    const assessmentStats = (assessments || []).map((asm) => {
      const relatedSubs = subList.filter((s) => s.assessment_id === asm.id);
      const subCount = relatedSubs.length;
      const asmPassed = relatedSubs.filter((s) => s.is_passed).length;
      const asmPassRate = subCount > 0 ? Math.round((asmPassed / subCount) * 100) : 0;
      const asmpAvgScore =
        subCount > 0
          ? Number((relatedSubs.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0) / subCount).toFixed(1))
          : 0;
      const avgTimeSpent =
        subCount > 0
          ? Math.round(relatedSubs.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0) / subCount)
          : 0;

      return {
        id: asm.id,
        title: asm.title,
        assessmentType: asm.assessment_type,
        passingScore: asm.passing_score,
        durationMinutes: asm.duration_minutes,
        isPublished: asm.is_published,
        submissionCount: subCount,
        passRate: asmPassRate,
        avgScore: asmpAvgScore,
        avgTimeMinutes: Math.round(avgTimeSpent / 60),
      };
    });

    // Compute DigComp 5 domains scores
    // Parse radar_data from competency_analyses if present
    const domainScoresMap: Record<number, { total: number; count: number; name: string }> = {};

    (domains || []).forEach((d) => {
      domainScoresMap[d.domain_index] = { total: 0, count: 0, name: d.title };
    });

    (analyses || []).forEach((ana) => {
      if (Array.isArray(ana.radar_data)) {
        ana.radar_data.forEach((r: { domainCode?: string; score?: number }, idx: number) => {
          const domIdx = idx + 1;
          if (domainScoresMap[domIdx] && typeof r.score === 'number') {
            domainScoresMap[domIdx].total += r.score;
            domainScoresMap[domIdx].count += 1;
          }
        });
      }
    });

    const domainAnalytics = (domains || []).map((d) => {
      const stat = domainScoresMap[d.domain_index];
      const avg = stat && stat.count > 0 ? Number((stat.total / stat.count).toFixed(1)) : 0;
      return {
        domainIndex: d.domain_index,
        code: `0${d.domain_index}`,
        title: d.title,
        description: d.description,
        averageScore: avg,
        evaluationsCount: stat ? stat.count : 0,
        benchmarkStandard: 70, // Ngưỡng chuẩn DigComp Châu Âu: 70%
      };
    });

    return NextResponse.json({
      overview: {
        totalSubmissions,
        passedSubmissions: passedCount,
        overallPassRate,
        overallAvgScore: avgScore,
        totalAssessments: (assessments || []).length,
        publishedAssessments: (assessments || []).filter((a) => a.is_published).length,
        activeOrganizations: (orgs || []).filter((o) => o.status === 'ACTIVE').length,
      },
      domains: domainAnalytics,
      assessmentQuality: assessmentStats,
      organizations: (orgs || []).map((o) => ({
        id: o.id,
        name: o.name,
        code: o.code || 'N/A',
        status: o.status,
      })),
    });
  } catch (err) {
    console.error('GET /api/admin/analytics error:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tổng hợp số liệu nghiên cứu' }, { status: 500 });
  }
}
