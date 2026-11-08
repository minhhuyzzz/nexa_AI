import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgCampaignsClientView, CampaignItem } from './OrgCampaignsClientView';

export const dynamic = 'force-dynamic';

export default async function OrgCampaignsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const authContext = await requireOrgPagePermission(
    slug,
    'MANAGE_CAMPAIGNS'
  );
  const org = authContext.organization;
  const user = authContext.user;
  const isSuperadmin = authContext.isSuperadmin;
  const role = authContext.role;
  const isManager = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';
  const adminSupabase = createAdminClient();

  // Fetch campaigns with assessment details
  const { data: campaignsRaw } = await adminSupabase
    .from('assessment_campaigns')
    .select(`
      id,
      title,
      description,
      starts_at,
      ends_at,
      status,
      passing_score,
      class_ids,
      assessor_ids,
      assessments (
        id,
        title,
        duration_minutes,
        passing_score,
        version
      )
    `)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  let campaigns = (campaignsRaw as unknown as CampaignItem[]) || [];

  // Scoped view for ASSESSOR: only show campaigns they are assigned to
  if (!isManager) {
    const { data: myClasses } = await adminSupabase
      .from('evaluator_classes')
      .select('id')
      .eq('organization_id', org.id)
      .or(`instructor_id.eq.${user.id},evaluator_id.eq.${user.id}`);

    const myClassIds = new Set((myClasses || []).map((c) => c.id));

    campaigns = campaigns.filter((c) => {
      const isDirectAssessor = Array.isArray(c.assessor_ids) && c.assessor_ids.includes(user.id);
      const isClassAssessor = Array.isArray(c.class_ids) && c.class_ids.some((id) => myClassIds.has(id));
      return isDirectAssessor || isClassAssessor;
    });
  }

  return (
    <OrgCampaignsClientView
      organizationId={org.id}
      organizationName={org.name}
      slug={slug}
      campaigns={campaigns}
      isManager={isManager}
    />
  );
}
