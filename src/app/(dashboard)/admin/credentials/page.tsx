import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminCredentialsClientView, CredentialItem, KPIStats } from './AdminCredentialsClientView';

export const dynamic = 'force-dynamic';

export default async function AdminCredentialsPage() {
  // Cho phép cả Quản trị viên hệ thống (ADMIN) và Chủ sở hữu nền tảng (SUPER_ADMIN)
  const auth = await requirePlatformAdmin();
  if (!auth.isAuthorized) {
    redirect('/login?redirect=/admin/credentials');
  }

  const adminSupabase = createAdminClient();

  // 1. Lấy danh sách chứng chỉ số
  const { data: credentials, error: credErr } = await adminSupabase
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
    .order('issued_at', { ascending: false })
    .limit(200);

  const safeList = credentials || [];
  const userIds = Array.from(new Set(safeList.map((c) => c.user_id).filter(Boolean)));

  // 2. Lấy email thí sinh từ profiles
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

  // 3. Tính KPI tổng quan
  const { data: allCreds } = await adminSupabase
    .from('credentials')
    .select('id, is_revoked');

  const totalIssued = allCreds?.length || 0;
  const revokedCount = (allCreds || []).filter((c) => c.is_revoked === true).length;
  const validCount = totalIssued - revokedCount;

  const formattedCredentials: CredentialItem[] = safeList.map((c) => {
    const prof = profilesMap.get(c.user_id);
    return {
      id: c.id,
      credentialCode: c.credential_code,
      candidateName: c.candidate_name,
      email: prof?.email || 'N/A',
      assessmentTitle: c.assessment_title || 'Khảo sát năng lực số chuẩn 5 miền',
      scorePercentage: c.score_percentage !== null ? Number(c.score_percentage) : null,
      totalScore: c.total_score !== null ? Number(c.total_score) : null,
      competencyLevel: c.competency_level || 'Năng lực số Master',
      contentSha256: c.content_sha256,
      isRevoked: Boolean(c.is_revoked),
      revokedReason: c.revoked_reason,
      issuedAt: c.issued_at,
      updatedAt: c.updated_at,
    };
  });

  const kpi: KPIStats = {
    totalIssued,
    validCount,
    revokedCount,
  };

  return (
    <div className="max-w-7xl mx-auto py-2">
      <AdminCredentialsClientView
        initialCredentials={formattedCredentials}
        initialKpi={kpi}
      />
    </div>
  );
}
