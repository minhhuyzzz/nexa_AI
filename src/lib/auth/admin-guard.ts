import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from './superadmin';

export type PlatformAdminPermission =
  | 'MANAGE_USERS'
  | 'MANAGE_ROLES'
  | 'VIEW_FINANCE'
  | 'MANAGE_FINANCE'
  | 'MANAGE_CONTENT'
  | 'OPERATE_AI'
  | 'MANAGE_ORGANIZATIONS'
  | 'MANAGE_SETTINGS';

export interface AdminAuthResult {
  isAuthorized: boolean;
  user?: {
    id: string;
    email?: string;
    adminRole?: string;
  };
  errorResponse?: NextResponse;
}

const ROLE_PERMISSIONS: Record<string, PlatformAdminPermission[]> = {
  SUPER_ADMIN: [
    'MANAGE_USERS',
    'MANAGE_ROLES',
    'VIEW_FINANCE',
    'MANAGE_FINANCE',
    'MANAGE_CONTENT',
    'OPERATE_AI',
    'MANAGE_ORGANIZATIONS',
    'MANAGE_SETTINGS',
  ],
  OPERATIONS_ADMIN: [
    'MANAGE_USERS',
    'MANAGE_ORGANIZATIONS',
    'MANAGE_SETTINGS',
  ],
  CONTENT_ADMIN: [
    'MANAGE_CONTENT',
  ],
  FINANCE_ADMIN: [
    'VIEW_FINANCE',
    'MANAGE_FINANCE',
  ],
  AI_OPERATOR: [
    'OPERATE_AI',
  ],
};

/**
 * Server-side authorization guard enforcing Platform Admin access & granular permissions
 * Checks authenticated session, suspension status, revocation, and capability mapping
 */
export async function requirePlatformAdmin(
  requiredPermission?: PlatformAdminPermission
): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      isAuthorized: false,
      errorResponse: NextResponse.json(
        { error: 'Yêu cầu đăng nhập tài khoản quản trị viên' },
        { status: 401 }
      ),
    };
  }

  // Check profile data including suspension, revocation and admin_role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_suspended, suspended_reason, tokens_revoked_at, admin_role')
    .eq('id', user.id)
    .maybeSingle();

  // 1. Suspension guard
  if (profile?.is_suspended === true) {
    return {
      isAuthorized: false,
      user: { id: user.id, email: user.email },
      errorResponse: NextResponse.json(
        { error: 'Tài khoản quản trị của bạn đang bị tạm khóa. Vui lòng liên hệ ban quản trị.' },
        { status: 403 }
      ),
    };
  }

  const isSuperadmin = isSuperadminEmail(user.email);
  const effectiveAdminRole = isSuperadmin
    ? 'SUPER_ADMIN'
    : profile?.admin_role || (profile?.role === 'ADMIN' ? 'SUPER_ADMIN' : 'LEARNER');

  const isPlatformAdmin =
    isSuperadmin ||
    profile?.role === 'ADMIN' ||
    profile?.role === 'SUPERADMIN' ||
    ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'AI_OPERATOR'].includes(
      profile?.admin_role || ''
    );

  if (!isPlatformAdmin) {
    return {
      isAuthorized: false,
      user: { id: user.id, email: user.email },
      errorResponse: NextResponse.json(
        { error: 'Bạn không có quyền truy cập khu vực quản trị nền tảng (Platform Admin)' },
        { status: 403 }
      ),
    };
  }

  // 2. Granular permission check if specific capability required
  if (requiredPermission) {
    const grantedPermissions = ROLE_PERMISSIONS[effectiveAdminRole] || [];
    if (!grantedPermissions.includes(requiredPermission)) {
      return {
        isAuthorized: false,
        user: { id: user.id, email: user.email, adminRole: effectiveAdminRole },
        errorResponse: NextResponse.json(
          {
            error: `Vai trò [${effectiveAdminRole}] không có quyền thực hiện hành động này (${requiredPermission}).`,
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    isAuthorized: true,
    user: { id: user.id, email: user.email, adminRole: effectiveAdminRole },
  };
}

export const requirePlatformPermission = requirePlatformAdmin;
