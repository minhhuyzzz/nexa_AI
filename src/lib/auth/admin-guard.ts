import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from './superadmin';

export interface AdminAuthResult {
  isAuthorized: boolean;
  user?: {
    id: string;
    email?: string;
  };
  errorResponse?: NextResponse;
}

/**
 * Server-side authorization guard enforcing Platform Admin access
 * Checks authenticated session, superadmin email whitelist, and profiles.role = 'ADMIN'
 */
export async function requirePlatformAdmin(): Promise<AdminAuthResult> {
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

  // 1. Check email whitelist
  if (isSuperadminEmail(user.email)) {
    return { isAuthorized: true, user: { id: user.id, email: user.email } };
  }

  // 2. Check profile role in database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN') {
    return { isAuthorized: true, user: { id: user.id, email: user.email } };
  }

  return {
    isAuthorized: false,
    user: { id: user.id, email: user.email },
    errorResponse: NextResponse.json(
      { error: 'Bạn không có quyền truy cập khu vực quản trị nền tảng (Platform Admin)' },
      { status: 403 }
    ),
  };
}
