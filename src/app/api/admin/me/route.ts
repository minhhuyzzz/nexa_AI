import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: auth.user!.id,
        email: auth.user!.email,
        adminRole: auth.user!.adminRole,
        isSuperAdmin: auth.user!.adminRole === 'SUPER_ADMIN',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
