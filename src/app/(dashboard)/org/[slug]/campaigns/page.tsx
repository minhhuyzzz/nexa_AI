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
  const { organization: org, isSuperadmin, role } = await requireOrgPagePermission(
    slug,
    'MANAGE_CAMPAIGNS'
  );
  const adminSupabase = createAdminClient();
  const isManager = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

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

  const campaigns = (campaignsRaw as unknown as CampaignItem[]) || [];

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
