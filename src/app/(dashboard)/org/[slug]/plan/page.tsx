import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';
import { OrgPlanClientView } from '@/components/dashboard/org/plan/OrgPlanClientView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gói Business & Gia Hạn | NEXA B2B',
  description: 'Quản lý quyền lợi, hạn dùng và yêu cầu gia hạn gói dịch vụ tổ chức',
};

export default async function OrgPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org, user, role, isSuperadmin } = await requireOrgPagePermission(
    slug,
    'VIEW_ANALYTICS'
  );

  const adminSupabase = createAdminClient();

  const [
    entitlements,
    membersCountResult,
    assessmentsCountResult,
    renewalsResult,
    ownerMembershipResult,
  ] = await Promise.all([
    // 1. Authoritative entitlement
    QuotaEnforcementService.getOrgEntitlements(adminSupabase, org.id),

    // 2. Count active members
    adminSupabase
      .from('user_organizations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'ACTIVE'),

    // 3. Count assessments
    adminSupabase
      .from('assessments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id),

    // 4. Renewal requests
    adminSupabase
      .from('renewal_requests')
      .select('id, period_months, requested_seats, status, created_at, reviewed_at, notes')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),

    // 5. Owner user
    adminSupabase
      .from('user_organizations')
      .select(`
        user_id,
        org_role,
        profiles ( nickname, email )
      `)
      .eq('organization_id', org.id)
      .eq('org_role', 'ORG_OWNER')
      .maybeSingle(),
  ]);

  const memberCount = membersCountResult.count || 0;
  const assessmentCount = assessmentsCountResult.count || 0;
  const renewalHistory = (renewalsResult.data as any[]) || [];
  const pendingRenewal = renewalHistory.find((r) => r.status === 'PENDING') || null;

  const ownerProfile = (ownerMembershipResult.data?.profiles as any);
  const ownerName =
    ownerProfile?.nickname ||
    ownerProfile?.email ||
    org.contact_name ||
    'Ban Quản trị Tổ chức';

  const isManager = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

  return (
    <OrgPlanClientView
      organization={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        code: (org as any).code || undefined,
      }}
      entitlements={entitlements}
      memberCount={memberCount}
      assessmentCount={assessmentCount}
      pendingRenewal={pendingRenewal}
      renewalHistory={renewalHistory}
      ownerName={ownerName}
      isManager={Boolean(isManager)}
    />
  );
}
