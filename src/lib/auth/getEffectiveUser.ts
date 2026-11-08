import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export type WorkspaceType = 'PERSONAL' | 'ORGANIZATION' | 'PLATFORM_ADMIN';

export type OrgRole =
  | 'ORG_OWNER'
  | 'ORG_ADMIN'
  | 'ASSESSOR'
  | 'EVALUATOR'
    | 'MEMBER';

export interface UserOrganizationMembership {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  org_role: OrgRole;
}

export interface ActiveWorkspace {
  type: WorkspaceType;
  organization_id?: string;
  organization_name?: string;
  org_role?: OrgRole;
}

export interface EffectiveUser {
  id: string;
  email?: string;
  role: 'LEARNER' | 'EVALUATOR' | 'ADMIN' | 'USER';
  admin_role?: string;
  nickname?: string;
  plan_tier?: 'FREE' | 'PRO' | 'ENTERPRISE';
  credits?: number;
  points?: number;
  is_superadmin?: boolean;
  is_suspended?: boolean;
  suspended_reason?: string;
  active_workspace: ActiveWorkspace;
  organizations: UserOrganizationMembership[];
}

/**
 * Lấy thông tin người dùng hiệu lực kèm ngữ cảnh không gian làm việc (Workspace Context)
 * Cưỡng chế xác thực danh tính, kiểm tra quyền tổ chức và trạng thái Superadmin
 */
export async function getEffectiveUser(supabase: SupabaseClient): Promise<EffectiveUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();

  if (user?.id) {
    // 1. Lấy thông tin profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, nickname, plan_tier, credits, points, is_suspended, suspended_reason, tokens_revoked_at, admin_role')
      .eq('id', user.id)
      .single();

    // Check token revocation
    if (profile?.tokens_revoked_at && user.last_sign_in_at) {
      if (new Date(user.last_sign_in_at).getTime() < new Date(profile.tokens_revoked_at).getTime()) {
        return null;
      }
    }

    const userEmail = user.email || profile?.email || '';
    const isSuperadmin = isSuperadminEmail(userEmail);

    // 2. Lấy danh sách tổ chức của người dùng
    const { data: orgMemberships } = await supabase
      .from('user_organizations')
      .select(`
        organization_id,
        org_role,
        organizations (
          id,
          name,
          slug,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE');

    interface OrgMemberQueryRow {
      organization_id: string;
      org_role: string;
      organizations: {
        id: string;
        name: string;
        slug: string;
        is_active?: boolean;
      } | null;
    }

    const organizations: UserOrganizationMembership[] = ((orgMemberships as unknown as OrgMemberQueryRow[]) || [])
      .filter((m) => m.organizations && m.organizations.is_active !== false)
      .map((m) => ({
        organization_id: m.organization_id,
        organization_name: m.organizations!.name,
        organization_slug: m.organizations!.slug,
        org_role: m.org_role as OrgRole,
      }));

    // 3. Xác định Active Workspace từ cookie hoặc mặc định
    const activeWsCookie = cookieStore.get('nexa_active_workspace')?.value;
    let active_workspace: ActiveWorkspace = {
      type: 'PERSONAL',
    };

    if (activeWsCookie === 'PLATFORM_ADMIN' && isSuperadmin) {
      active_workspace = {
        type: 'PLATFORM_ADMIN',
      };
    } else if (activeWsCookie?.startsWith('org_')) {
      const targetOrgId = activeWsCookie.replace('org_', '');
      const matchedOrg = organizations.find((o) => o.organization_id === targetOrgId);
      if (matchedOrg) {
        active_workspace = {
          type: 'ORGANIZATION',
          organization_id: matchedOrg.organization_id,
          organization_name: matchedOrg.organization_name,
          org_role: matchedOrg.org_role,
        };
      }
    } else if (!activeWsCookie && organizations.length > 0) {
      const primaryOrg = organizations[0];
      if (
        ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(primaryOrg.org_role) ||
        profile?.role === 'EVALUATOR'
      ) {
        active_workspace = {
          type: 'ORGANIZATION',
          organization_id: primaryOrg.organization_id,
          organization_name: primaryOrg.organization_name,
          org_role: primaryOrg.org_role,
        };
      }
    }

    return {
      id: user.id,
      email: userEmail,
      role: (profile?.role as 'LEARNER' | 'EVALUATOR' | 'ADMIN' | 'USER') || 'LEARNER',
      admin_role: profile?.admin_role || (isSuperadmin ? 'SUPER_ADMIN' : 'LEARNER'),
      nickname: profile?.nickname || user.user_metadata?.nickname || 'Người dùng',
      plan_tier: (profile?.plan_tier as 'FREE' | 'PRO' | 'ENTERPRISE') || 'FREE',
      credits: profile?.credits ?? 0,
      points: profile?.points ?? 0,
      is_superadmin: isSuperadmin,
      is_suspended: profile?.is_suspended === true,
      suspended_reason: profile?.suspended_reason || undefined,
      active_workspace,
      organizations,
    };
  }

  return null;
}
