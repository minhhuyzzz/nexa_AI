import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgAssessmentsListView } from '@/components/dashboard/org/assessments/OrgAssessmentsListView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ngân Hàng Đề Khảo Thí | NEXA B2B',
  description: 'Quản lý ngân hàng đề đánh giá và khảo thí năng lực số',
};

export default async function OrgAssessmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org, isSuperadmin, role } = await requireOrgPagePermission(
    slug,
    'VIEW_WORKSPACE'
  );
  
  // Dùng createClient() với session cookies của người dùng để RLS cấp quyền xem đề của tổ chức
  const supabase = await createClient();
  const isManager = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

  // Fetch organization assessments (cả đề đã sẵn sàng và bản nháp nội bộ của tổ chức)
  const orgAssessmentsResult = await supabase
    .from('assessments')
    .select('id, title, description, duration_minutes, passing_score, is_published, organization_id, created_at, updated_at, assessment_items(id)')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  let orgAssessments = (orgAssessmentsResult.data as any[]) || [];

  // Fallback nếu client có service role key
  if (orgAssessments.length === 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminSupabase = createAdminClient();
    const { data: adminOrgData } = await adminSupabase
      .from('assessments')
      .select('id, title, description, duration_minutes, passing_score, is_published, organization_id, created_at, updated_at, assessment_items(id)')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false });
    if (adminOrgData && adminOrgData.length > 0) {
      orgAssessments = adminOrgData;
    }
  }

  const allAssessments = orgAssessments;

  return (
    <OrgAssessmentsListView
      slug={slug}
      orgName={org.name}
      isManager={isManager}
      assessments={allAssessments}
    />
  );
}
