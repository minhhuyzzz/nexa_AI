import { redirect, notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from './superadmin';

export type OrgRole = 'ORG_OWNER' | 'ORG_ADMIN' | 'ASSESSOR' | 'EVALUATOR' | 'REPORT_VIEWER' | 'MEMBER';

export type OrgPermissionAction =
  | 'VIEW_WORKSPACE'
  | 'MANAGE_MEMBERS'
  | 'VIEW_GRADING'
  | 'GRADE_SUBMISSION'
  | 'VIEW_ANALYTICS'
  | 'VIEW_AI_QUOTA'
  | 'MANAGE_CAMPAIGNS'
  | 'MANAGE_CLASSES'
  | 'MANAGE_SETTINGS';

export interface OrgAuthContext {
  isAuthorized: boolean;
  user: {
    id: string;
    email?: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    type?: string | null;
    logo_url?: string | null;
    max_members?: number | null;
    quota_assessments?: number | null;
    created_at?: string | null;
    [key: string]: unknown;
  };
  role: OrgRole;
  isSuperadmin: boolean;
  errorResponse?: NextResponse;
}

const ACTION_ROLE_MAP: Record<OrgPermissionAction, OrgRole[]> = {
  VIEW_WORKSPACE: ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'REPORT_VIEWER', 'MEMBER'],
  MANAGE_MEMBERS: ['ORG_OWNER', 'ORG_ADMIN'],
  VIEW_GRADING: ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'],
  GRADE_SUBMISSION: ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'],
  VIEW_ANALYTICS: ['ORG_OWNER', 'ORG_ADMIN', 'REPORT_VIEWER'],
  VIEW_AI_QUOTA: ['ORG_OWNER', 'ORG_ADMIN'],
  MANAGE_CAMPAIGNS: ['ORG_OWNER', 'ORG_ADMIN'],
  MANAGE_CLASSES: ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'],
  MANAGE_SETTINGS: ['ORG_OWNER', 'ORG_ADMIN'],
};

/**
 * Resolves the authenticated user, organization by slug or ID, and validates active membership.
 * Safe for server components and API route handlers.
 */
export async function getOrgAuthContext(
  slugOrId: string,
  options?: { isId?: boolean }
): Promise<OrgAuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const adminSupabase = createAdminClient();
  const isSuperadmin = isSuperadminEmail(user.email);

  // 1. Fetch organization
  const query = adminSupabase
    .from('organizations')
    .select('*');

  const { data: org, error: orgError } = options?.isId
    ? await query.eq('id', slugOrId).maybeSingle()
    : await query.eq('slug', slugOrId).maybeSingle();

  if (orgError || !org) {
    return null;
  }

  // 2. Superadmin bypasses membership check
  if (isSuperadmin) {
    return {
      isAuthorized: true,
      user: { id: user.id, email: user.email },
      organization: org,
      role: 'ORG_ADMIN',
      isSuperadmin: true,
    };
  }

  // 3. Verify user active membership
  const { data: membership } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (!membership || membership.status !== 'ACTIVE') {
    return {
      isAuthorized: false,
      user: { id: user.id, email: user.email },
      organization: org,
      role: 'MEMBER',
      isSuperadmin: false,
    };
  }

  const role = (membership.org_role as OrgRole) || 'MEMBER';

  return {
    isAuthorized: true,
    user: { id: user.id, email: user.email },
    organization: org,
    role,
    isSuperadmin: false,
  };
}

/**
 * Server Component Guard for Organization pages.
 * Enforces role-based permissions at the page level.
 * Redirects unauthorized users safely away from restricted areas.
 */
export async function requireOrgPagePermission(
  slug: string,
  actionOrRoles: OrgPermissionAction | OrgRole[]
): Promise<OrgAuthContext> {
  const context = await getOrgAuthContext(slug);

  if (!context) {
    // Not logged in or org not found
    redirect(`/login?redirect=/org/${slug}`);
  }

  if (!context.organization.is_active) {
    notFound();
  }

  if (!context.isAuthorized) {
    redirect('/personal/dashboard');
  }

  const allowedRoles = Array.isArray(actionOrRoles)
    ? actionOrRoles
    : ACTION_ROLE_MAP[actionOrRoles];

  if (!context.isSuperadmin && !allowedRoles.includes(context.role)) {
    // Insufficient permissions -> redirect to org home page
    redirect(`/org/${slug}`);
  }

  return context;
}

/**
 * API Route Guard for /api/organizations/[orgId]/**.
 * Returns a structured response so routes can cleanly return 401/403/404.
 */
export async function requireOrgApiPermission(
  orgId: string,
  actionOrRoles: OrgPermissionAction | OrgRole[]
): Promise<{
  authorized: boolean;
  context?: OrgAuthContext;
  response?: NextResponse;
}> {
  const context = await getOrgAuthContext(orgId, { isId: true });

  if (!context) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Yêu cầu đăng nhập hoặc không tìm thấy tổ chức' },
        { status: 401 }
      ),
    };
  }

  if (!context.organization.is_active) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Tổ chức đã bị tạm dừng hoạt động' },
        { status: 403 }
      ),
    };
  }

  if (!context.isAuthorized) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Bạn không phải là thành viên hợp lệ của tổ chức này' },
        { status: 403 }
      ),
    };
  }

  const allowedRoles = Array.isArray(actionOrRoles)
    ? actionOrRoles
    : ACTION_ROLE_MAP[actionOrRoles];

  if (!context.isSuperadmin && !allowedRoles.includes(context.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Bạn không có quyền thực hiện thao tác này trong tổ chức' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    context,
  };
}
