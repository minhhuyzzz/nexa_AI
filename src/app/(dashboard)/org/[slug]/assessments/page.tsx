import { notFound } from 'next/navigation';
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
  const adminSupabase = createAdminClient();
  const isManager = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

  // 1. Fetch organization assessments + global published assessments
  const [orgAssessmentsResult, globalAssessmentsResult] = await Promise.all([
    adminSupabase
      .from('assessments')
      .select('id, title, description, duration_minutes, passing_score, is_published, organization_id, created_at, updated_at, assessment_items(id)')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('assessments')
      .select('id, title, description, duration_minutes, passing_score, is_published, organization_id, created_at, updated_at, assessment_items(id)')
      .is('organization_id', null)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ]);

  const orgAssessments = (orgAssessmentsResult.data as any[]) || [];
  const globalAssessments = (globalAssessmentsResult.data as any[]) || [];
  const allAssessments = [...orgAssessments, ...globalAssessments];

  return (
    <OrgAssessmentsListView
      slug={slug}
      orgName={org.name}
      isManager={isManager}
      assessments={allAssessments}
    />
  );
}
