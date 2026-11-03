import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgCompetencyAnalyticsService } from '@/features/analytics/services/org-competency-analytics.service';
import { RawClassInfo, RawCampaignInfo, RawAnalyticsSubmission } from '@/features/analytics/types/org-analytics.types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // 1. Strict Server Authentication & Tenant scoping
    const { organization: org } = await requireOrgPagePermission(slug, 'VIEW_ANALYTICS');
    const adminSupabase = createAdminClient();

    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaignId') || undefined;
    const classId = searchParams.get('classId') || undefined;

    // 2. Fetch classes & members scoped to this org
    const { data: rawClasses } = await adminSupabase
      .from('evaluator_classes')
      .select('id, name, class_members ( user_id )')
      .eq('organization_id', org.id);

    const classesInfo: RawClassInfo[] = (rawClasses || []).map((c: any) => {
      const memberUserIds = (c.class_members || []).map((m: any) => m.user_id).filter(Boolean);
      return {
        id: c.id,
        name: c.name,
        member_count: memberUserIds.length,
        member_user_ids: memberUserIds,
      };
    });

    // 3. Fetch campaigns scoped to this org
    const { data: rawCampaigns } = await adminSupabase
      .from('assessment_campaigns')
      .select('id, title, status, starts_at, ends_at, passing_score, class_ids')
      .eq('organization_id', org.id)
      .order('starts_at', { ascending: false });

    const campaignsInfo: RawCampaignInfo[] = (rawCampaigns || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      passing_score: c.passing_score ?? 70,
      class_ids: Array.isArray(c.class_ids) ? c.class_ids : [],
    }));

    // 4. Fetch assessments & submissions scoped to this org
    const { data: orgAssessments } = await adminSupabase
      .from('assessments')
      .select('id')
      .eq('organization_id', org.id);

    const assessmentIds = (orgAssessments || []).map((a) => a.id);
    const campaignIds = campaignsInfo.map((c) => c.id);

    const subsMap = new Map<string, RawAnalyticsSubmission>();

    if (campaignIds.length > 0) {
      const { data: cSubs } = await adminSupabase
        .from('assessment_submissions')
        .select('id, campaign_id, assessment_id, user_id, status, percentage, is_passed, total_score, domain_scores, created_at, evaluated_at')
        .in('campaign_id', campaignIds);
      (cSubs || []).forEach((s) => subsMap.set(s.id, s as RawAnalyticsSubmission));
    }

    if (assessmentIds.length > 0) {
      const { data: aSubs } = await adminSupabase
        .from('assessment_submissions')
        .select('id, campaign_id, assessment_id, user_id, status, percentage, is_passed, total_score, domain_scores, created_at, evaluated_at')
        .in('assessment_id', assessmentIds);
      (aSubs || []).forEach((s) => subsMap.set(s.id, s as RawAnalyticsSubmission));
    }

    const allSubmissions = Array.from(subsMap.values());
    const activeSubmissions = OrgCompetencyAnalyticsService.filterSubmissions(
      allSubmissions,
      classesInfo,
      { campaignId, classId }
    );

    const summary = OrgCompetencyAnalyticsService.aggregateOrgCompetency(
      allSubmissions,
      classesInfo,
      campaignsInfo,
      { campaignId, classId }
    );

    const evaluatedSubs = activeSubmissions.filter((s) => s.status === 'EVALUATED');

    // 5. Build CSV with UTF-8 BOM
    const currentCampaign = campaignsInfo.find((c) => c.id === campaignId);
    const currentClass = classesInfo.find((c) => c.id === classId);

    const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    let csv = '\uFEFF'; // UTF-8 BOM
    csv += 'BÁO CÁO PHÂN TÍCH NĂNG LỰC SỐ 5 MIỀN CỐT LÕI - NEXA AI\n';
    csv += `Đơn vị,${escapeCsv(org.name)}\n`;
    csv += `Ngày xuất báo cáo,${escapeCsv(new Date().toLocaleString('vi-VN'))}\n`;
    csv += `Đợt khảo thí,${escapeCsv(currentCampaign?.title || 'Tất cả các đợt')}\n`;
    csv += `Lớp / Đơn vị,${escapeCsv(currentClass?.name || 'Toàn bộ đơn vị')}\n`;
    csv += `Tổng số lượt khảo thí,${summary.totalSubmissions}\n`;
    csv += `Số bài thi đã phê duyệt hợp lệ,${summary.evaluatedSubmissions}\n`;
    csv += `Điểm trung bình toàn đơn vị,${summary.overallAverageScore !== null ? `${summary.overallAverageScore}đ` : 'Chưa có'}\n`;
    csv += `Tỷ lệ đạt chuẩn (>= 70%),${summary.overallPassRate}%\n\n`;

    // 5 Domains Summary Section
    csv += 'TỔNG HỢP 5 MIỀN NĂNG LỰC SỐ\n';
    csv += 'Mã miền,Tên miền,Điểm trung bình (đ),Tỷ lệ đạt (%),Số bài khảo thí,Đánh giá\n';
    summary.domains.forEach((d) => {
      const isPassed = d.score !== null && d.score >= 70;
      const isGap = d.score !== null && d.score < 60;
      const statusLabel = d.score === null
        ? 'Chưa khảo thí'
        : isPassed
        ? 'Đạt chuẩn'
        : isGap
        ? 'Cần bồi dưỡng'
        : 'Mức cơ bản';

      csv += [
        escapeCsv(d.domainCode),
        escapeCsv(d.name),
        escapeCsv(d.score !== null ? `${d.score}đ` : 'N/A'),
        escapeCsv(d.passRate !== null ? `${d.passRate}%` : 'N/A'),
        escapeCsv(d.testedCount),
        escapeCsv(statusLabel),
      ].join(',') + '\n';
    });

    // Submissions list
    csv += '\nDANH SÁCH BÀI KHẢO THÍ ĐÃ PHÊ DUYỆT\n';
    csv += 'STT,Mã bài nộp,Mã người học,Điểm tổng (%),Kết quả,D1 (đ),D2 (đ),D3 (đ),D4 (đ),D5 (đ),Thời gian nộp\n';
    evaluatedSubs.forEach((sub, idx) => {
      const dScores = sub.domain_scores || {};
      csv += [
        idx + 1,
        escapeCsv(sub.id),
        escapeCsv(sub.user_id || 'N/A'),
        escapeCsv(sub.percentage ?? 'N/A'),
        escapeCsv(sub.is_passed ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'),
        escapeCsv(dScores.D1 ?? '—'),
        escapeCsv(dScores.D2 ?? '—'),
        escapeCsv(dScores.D3 ?? '—'),
        escapeCsv(dScores.D4 ?? '—'),
        escapeCsv(dScores.D5 ?? '—'),
        escapeCsv(sub.created_at ? new Date(sub.created_at).toLocaleString('vi-VN') : '—'),
      ].join(',') + '\n';
    });

    const filename = `nexa-analytics-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[ANALYTICS_EXPORT_ERROR]', error);
    if (error?.message?.includes('Forbidden') || error?.status === 403) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Không thể xuất báo cáo phân tích', details: error?.message },
      { status: 500 }
    );
  }
}
