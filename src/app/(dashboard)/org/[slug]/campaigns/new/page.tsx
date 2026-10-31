import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  CampaignWizardClient,
  AssessmentOption,
  ClassOption,
  AssessorOption,
} from '@/components/dashboard/org/CampaignWizardClient';

export const dynamic = 'force-dynamic';

export default async function OrgNewCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'MANAGE_CAMPAIGNS');
  const adminSupabase = createAdminClient();

  // 1. Fetch available assessments
  const { data: rawAssessments } = await adminSupabase
    .from('assessments')
    .select('id, title, duration_minutes, passing_score, version, visibility, organization_id')
    .or(`organization_id.eq.${org.id},visibility.eq.PUBLIC`)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const assessments: AssessmentOption[] = (rawAssessments || []).map((a) => ({
    id: a.id,
    title: a.title,
    duration_minutes: a.duration_minutes || 45,
    passing_score: a.passing_score || 70,
    version: a.version || '1.0',
    visibility: a.visibility || 'ORGANIZATION',
  }));

  // 2. Fetch organization classes
  const { data: rawClasses } = await adminSupabase
    .from('evaluator_classes')
    .select(`
      id,
      name,
      class_code,
      class_members ( id )
    `)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  const classes: ClassOption[] = (rawClasses || []).map((c) => ({
    id: c.id,
    name: c.name,
    class_code: c.class_code,
    memberCount: Array.isArray(c.class_members) ? c.class_members.length : 0,
  }));

  // 3. Fetch organization assessors / evaluators
  const { data: rawAssessors } = await adminSupabase
    .from('user_organizations')
    .select(`
      user_id,
      org_role,
      profiles:user_id ( id, nickname, email, full_name )
    `)
    .eq('organization_id', org.id)
    .eq('status', 'ACTIVE')
    .in('org_role', ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR']);

  const assessors: AssessorOption[] = (rawAssessors || []).map((m: any) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      userId: m.user_id,
      name: prof?.full_name || prof?.nickname || 'Chuyên viên khảo thí',
      email: prof?.email || 'assessor@nexa.edu.vn',
      role: m.org_role,
    };
  });

  return (
    <CampaignWizardClient
      orgId={org.id}
      orgSlug={slug}
      orgName={org.name}
      assessments={assessments}
      classes={classes}
      assessors={assessors}
    />
  );
}
