import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || searchParams.get('orgId');
    const assessmentId = searchParams.get('assessment_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const format = searchParams.get('format') || 'csv';

    // 1. Build Submissions query
    let query = supabase
      .from('assessment_submissions')
      .select(`
        id,
        assessment_id,
        user_id,
        status,
        total_score,
        max_score,
        percentage,
        is_passed,
        time_spent_seconds,
        started_at,
        submitted_at,
        assessments:assessment_id (id, title, assessment_type)
      `)
      .in('status', ['SUBMITTED', 'EVALUATED'])
      .order('submitted_at', { ascending: false });

    if (assessmentId) {
      query = query.eq('assessment_id', assessmentId);
    }
    if (dateFrom) {
      query = query.gte('submitted_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('submitted_at', dateTo);
    }

    const { data: rawSubmissions, error: subError } = await query;

    if (subError) {
      console.error('Error querying submissions for export:', subError.message);
      return NextResponse.json({ error: 'Không thể truy xuất dữ liệu khảo thí' }, { status: 500 });
    }

    const submissions = rawSubmissions || [];

    // 2. Fetch User Organizations map to match each student with their university/enterprise
    const userIds = Array.from(new Set(submissions.map((s) => s.user_id)));
    const userOrgMap: Record<string, { id: string; name: string; code: string }> = {};

    if (userIds.length > 0) {
      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          organization_id,
          organizations:organization_id (id, name, code)
        `)
        .in('user_id', userIds)
        .eq('status', 'ACTIVE');

      (userOrgs || []).forEach((uo) => {
        const org = uo.organizations as unknown as { id: string; name: string; code?: string } | null;
        if (org && uo.user_id) {
          userOrgMap[uo.user_id] = {
            id: org.id,
            name: org.name,
            code: org.code || 'N/A',
          };
        }
      });
    }

    // Filter by organization if specified
    const filteredSubmissions = orgId
      ? submissions.filter((s) => userOrgMap[s.user_id]?.id === orgId)
      : submissions;

    // 3. Fetch Competency Analyses (for 5 domain scores)
    const submissionIds = filteredSubmissions.map((s) => s.id);
    const domainScoresBySubmission: Record<string, Record<number, number>> = {};

    if (submissionIds.length > 0) {
      const { data: analyses } = await supabase
        .from('competency_analyses')
        .select('submission_id, radar_data')
        .in('submission_id', submissionIds);

      (analyses || []).forEach((a) => {
        if (Array.isArray(a.radar_data)) {
          domainScoresBySubmission[a.submission_id] = {};
          a.radar_data.forEach((item: { score?: number }, idx: number) => {
            domainScoresBySubmission[a.submission_id][idx + 1] = item.score || 0;
          });
        }
      });
    }

    // 4. Transform data with PII Sanitization (SHA/Prefix code for research ethics)
    const records = filteredSubmissions.map((sub, index) => {
      const asm = sub.assessments as unknown as { id: string; title: string; assessment_type: string } | null;
      const org = userOrgMap[sub.user_id];
      const domains = domainScoresBySubmission[sub.id] || {};

      // Pseudonymized Candidate Code for SPSS / R analysis without violating Nghị định 13
      const candidateCode = `SUBJ_${sub.user_id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

      return {
        recordIndex: index + 1,
        submissionId: sub.id,
        candidateCode,
        assessmentTitle: asm?.title || 'Bài đánh giá',
        assessmentType: asm?.assessment_type || 'MIXED',
        organizationCode: org?.code || 'INDEPENDENT',
        organizationName: org?.name || 'Thí sinh tự do',
        totalScore: Number(sub.total_score || 0),
        maxScore: Number(sub.max_score || 100),
        percentage: Number(sub.percentage || 0),
        isPassed: sub.is_passed ? 1 : 0,
        timeSpentSeconds: sub.time_spent_seconds || 0,
        domain1Score: domains[1] !== undefined ? domains[1] : '',
        domain2Score: domains[2] !== undefined ? domains[2] : '',
        domain3Score: domains[3] !== undefined ? domains[3] : '',
        domain4Score: domains[4] !== undefined ? domains[4] : '',
        domain5Score: domains[5] !== undefined ? domains[5] : '',
        status: sub.status,
        submittedAt: sub.submitted_at || sub.started_at,
      };
    });

    if (format === 'json') {
      return NextResponse.json({
        totalRecords: records.length,
        filter: { organizationId: orgId, assessmentId, dateFrom, dateTo },
        records,
      });
    }

    // 5. Generate SPSS / Excel compatible CSV format with UTF-8 BOM
    const headers = [
      'STT',
      'Submission_ID',
      'Candidate_Code',
      'Assessment_Title',
      'Assessment_Type',
      'Organization_Code',
      'Organization_Name',
      'Total_Score',
      'Max_Score',
      'Percentage',
      'Is_Passed',
      'Time_Spent_Seconds',
      'DigComp_Domain_1_Data',
      'DigComp_Domain_2_Communication',
      'DigComp_Domain_3_Content_Creation',
      'DigComp_Domain_4_Safety',
      'DigComp_Domain_5_Problem_Solving',
      'Status',
      'Submitted_At',
    ];

    const rows = records.map((r) => [
      escapeCsvCell(r.recordIndex),
      escapeCsvCell(r.submissionId),
      escapeCsvCell(r.candidateCode),
      escapeCsvCell(r.assessmentTitle),
      escapeCsvCell(r.assessmentType),
      escapeCsvCell(r.organizationCode),
      escapeCsvCell(r.organizationName),
      escapeCsvCell(r.totalScore),
      escapeCsvCell(r.maxScore),
      escapeCsvCell(r.percentage),
      escapeCsvCell(r.isPassed),
      escapeCsvCell(r.timeSpentSeconds),
      escapeCsvCell(r.domain1Score),
      escapeCsvCell(r.domain2Score),
      escapeCsvCell(r.domain3Score),
      escapeCsvCell(r.domain4Score),
      escapeCsvCell(r.domain5Score),
      escapeCsvCell(r.status),
      escapeCsvCell(r.submittedAt),
    ]);

    const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const fileName = `nexa_analytics_export_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('GET /api/admin/analytics/export error:', err);
    return NextResponse.json({ error: 'Lỗi xuất dữ liệu khảo thí' }, { status: 500 });
  }
}
