import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Cho phép cả Quản trị viên hệ thống (ADMIN) và Chủ sở hữu nền tảng (SUPER_ADMIN)
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status') || 'ALL'; // ALL | VALID | REVOKED

    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from('credentials')
      .select(`
        id,
        credential_code,
        candidate_name,
        assessment_title,
        score_percentage,
        total_score,
        max_score,
        competency_level,
        content_sha256,
        is_revoked,
        revoked_reason,
        issued_at,
        updated_at,
        user_id
      `)
      .order('issued_at', { ascending: false });

    if (status === 'VALID') {
      query = query.or('is_revoked.is.null,is_revoked.eq.false');
    } else if (status === 'REVOKED') {
      query = query.eq('is_revoked', true);
    }

    if (search) {
      query = query.or(`credential_code.ilike.%${search}%,candidate_name.ilike.%${search}%`);
    }

    const { data: credentials, error: credErr } = await query.limit(200);

    if (credErr) {
      console.error('[ADMIN_CREDENTIALS_QUERY_ERROR]', credErr);
      return NextResponse.json(
        { error: 'Lỗi khi truy vấn danh sách chứng chỉ số' },
        { status: 500 }
      );
    }

    const safeList = credentials || [];
    const userIds = Array.from(new Set(safeList.map((c) => c.user_id).filter(Boolean)));

    // Lấy thêm email từ bảng profiles
    const profilesMap = new Map<string, { email?: string }>();
    if (userIds.length > 0) {
      const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      (profiles || []).forEach((p) => {
        profilesMap.set(p.id, p);
      });
    }

    // Tính KPI tổng thể
    const { data: allCreds } = await adminSupabase
      .from('credentials')
      .select('id, is_revoked');

    const totalIssued = allCreds?.length || 0;
    const revokedCount = (allCreds || []).filter((c) => c.is_revoked === true).length;
    const validCount = totalIssued - revokedCount;

    const formattedList = safeList.map((c) => {
      const prof = profilesMap.get(c.user_id);
      return {
        id: c.id,
        credentialCode: c.credential_code,
        candidateName: c.candidate_name,
        email: prof?.email || 'N/A',
        assessmentTitle: c.assessment_title || 'Khảo sát năng lực số chuẩn 5 miền',
        scorePercentage: c.score_percentage !== null ? Number(c.score_percentage) : null,
        totalScore: c.total_score,
        competencyLevel: c.competency_level || 'Năng lực số Master',
        contentSha256: c.content_sha256,
        isRevoked: Boolean(c.is_revoked),
        revokedReason: c.revoked_reason,
        issuedAt: c.issued_at,
        updatedAt: c.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      kpi: {
        totalIssued,
        validCount,
        revokedCount,
      },
      credentials: formattedList,
    });
  } catch (err: any) {
    console.error('[GET_ADMIN_CREDENTIALS_ERROR]', err);
    return NextResponse.json(
      { error: err?.message || 'Lỗi hệ thống khi tải chứng chỉ' },
      { status: 500 }
    );
  }
}
