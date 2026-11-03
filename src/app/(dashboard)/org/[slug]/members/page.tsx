import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';
import { OrgMembersClientView } from './OrgMembersClientView';
import type { OrgMemberItem, OrgClassItem } from '@/components/dashboard/org/members/types';

export const dynamic = 'force-dynamic';

export default async function OrgMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org, user, role, isSuperadmin } = await requireOrgPagePermission(
    slug,
    'MANAGE_MEMBERS'
  );
  const adminSupabase = createAdminClient();

  const [
    membersResult,
    classesResult,
    classMembersResult,
    pendingRequestsResult,
    pendingInvitationsResult,
    entitlements,
  ] = await Promise.all([
    // 1. Members with profile details
    adminSupabase
      .from('user_organizations')
      .select(`
        id,
        user_id,
        org_role,
        status,
        created_at,
        profiles (
          id,
          email,
          nickname,
          avatar_url,
          updated_at
        )
      `)
      .eq('organization_id', org.id)
      .order('created_at', { ascending: true }),

    // 2. Classes of organization
    adminSupabase
      .from('evaluator_classes')
      .select('id, name, code, class_members ( id )')
      .eq('organization_id', org.id)
      .order('name', { ascending: true }),

    // 3. Class memberships for this organization
    adminSupabase
      .from('class_members')
      .select('user_id, evaluator_classes!inner(id, name, organization_id)')
      .eq('evaluator_classes.organization_id', org.id),

    // 4. Pending membership requests
    adminSupabase
      .from('organization_membership_requests')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'PENDING'),

    // 5. Pending invitations
    adminSupabase
      .from('organization_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'PENDING'),

    // 6. Entitlements
    QuotaEnforcementService.getOrgEntitlements(adminSupabase, org.id),
  ]);

  // Map user classes: userId -> className
  const userClassMap: Record<string, string> = {};
  if (classMembersResult.data) {
    for (const cm of classMembersResult.data) {
      const cls = Array.isArray(cm.evaluator_classes)
        ? cm.evaluator_classes[0]
        : (cm.evaluator_classes as any);
      if (cm.user_id && cls?.name) {
        userClassMap[cm.user_id] = userClassMap[cm.user_id]
          ? `${userClassMap[cm.user_id]}, ${cls.name}`
          : cls.name;
      }
    }
  }

  const members: OrgMemberItem[] = ((membersResult.data as any[]) || []).map((m) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      membershipId: m.id,
      userId: m.user_id,
      email: prof?.email || 'N/A',
      nickname: prof?.nickname || 'Thành viên',
      role: m.org_role,
      status: m.status,
      createdAt: m.created_at,
      isCurrentUser: m.user_id === user.id,
      className: userClassMap[m.user_id] || null,
      lastActiveAt: prof?.updated_at || null,
    };
  });

  const classes: OrgClassItem[] = ((classesResult.data as any[]) || []).map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    memberCount: Array.isArray(c.class_members) ? c.class_members.length : 0,
  }));

  const isManager = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

  return (
    <div className="space-y-6">
      <OrgMembersClientView
        organizationId={org.id}
        organizationName={org.name}
        organizationSlug={slug}
        members={members}
        classes={classes}
        entitlements={entitlements}
        pendingRequestsCount={pendingRequestsResult.count || 0}
        pendingInvitationsCount={pendingInvitationsResult.count || 0}
        isManager={Boolean(isManager)}
      />
    </div>
  );
}
