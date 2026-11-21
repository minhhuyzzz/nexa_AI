import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { getSuperadminEmails, isSuperadminEmail } from '@/lib/auth/superadmin';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';
import { extractClientIp } from '@/lib/audit/client-ip';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

interface ProfileItem {
  id: string;
  email: string | null;
  full_name: string | null;
  nickname: string | null;
  role: string | null;
  admin_role: string | null;
  created_at: string;
  is_suspended?: boolean | null;
}

const grantRoleSchema = z.object({
  email: z.string().trim().toLowerCase().email('Địa chỉ email không hợp lệ'),
});

const revokeRoleSchema = z.object({
  userId: z.string().min(1, 'ID người dùng không được để trống'),
});

/**
 * GET /api/admin/roles
 * Trả về danh sách Super Admin (từ env) và danh sách Admin hệ thống (từ DB)
 * Chỉ Super Admin mới có quyền truy cập
 */
export async function GET() {
  try {
    const auth = await requirePlatformAdmin('MANAGE_ROLES');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();
    const superadminEmails = getSuperadminEmails();

    // 1. Fetch all profiles that might be admins or match superadmin emails
    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, nickname, role, admin_role, created_at, is_suspended');

    if (error) {
      return NextResponse.json(
        { error: 'Không thể tải danh sách vai trò: ' + error.message },
        { status: 500 }
      );
    }

    const allProfiles = (profiles || []) as ProfileItem[];
    const profileByEmail = new Map<string, ProfileItem>();
    allProfiles.forEach((p) => {
      if (p.email) {
        profileByEmail.set(p.email.trim().toLowerCase(), p);
      }
    });

    // 2. Map Super Admins (from ENV Root of Trust)
    const superAdmins = superadminEmails.map((email) => {
      const p = profileByEmail.get(email);
      return {
        id: p?.id || `env-${email}`,
        email,
        fullName: p?.full_name || p?.nickname || 'Chủ sở hữu nền tảng (Root of Trust)',
        nickname: p?.nickname || email.split('@')[0],
        adminRole: 'SUPER_ADMIN' as const,
        isImmutable: true,
        isRegistered: Boolean(p?.id),
        createdAt: p?.created_at || null,
        isSuspended: Boolean(p?.is_suspended),
      };
    });

    // 3. Map Platform Admins (from DB profiles, excluding Super Admins)
    const platformAdmins = allProfiles
      .filter((p) => {
        const emailLower = p.email?.trim().toLowerCase() || '';
        if (superadminEmails.includes(emailLower)) return false;
        return (
          p.admin_role === 'ADMIN' ||
          p.admin_role === 'SUPER_ADMIN' ||
          p.role === 'ADMIN'
        );
      })
      .map((p) => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name || p.nickname || 'Quản trị viên',
        nickname: p.nickname || p.email?.split('@')[0] || 'admin',
        adminRole: 'ADMIN' as const,
        isImmutable: false,
        isRegistered: true,
        createdAt: p.created_at,
        isSuspended: Boolean(p.is_suspended),
      }));

    return NextResponse.json({
      success: true,
      superAdmins,
      platformAdmins,
      currentUser: {
        email: auth.user?.email,
        adminRole: auth.user?.adminRole,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/roles
 * Cấp quyền Quản trị viên (ADMIN) cho một người dùng đã đăng ký qua email
 * Chỉ Super Admin mới có quyền thực hiện
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_ROLES');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const body = await request.json().catch(() => ({}));
    const parsed = grantRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const targetEmail = parsed.data.email;
    if (isSuperadminEmail(targetEmail)) {
      return NextResponse.json(
        { error: 'Email này đã là Chủ sở hữu nền tảng (Super Admin qua cấu hình ENV).' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: targetProfile, error: findErr } = await adminSupabase
      .from('profiles')
      .select('id, email, admin_role, full_name, nickname')
      .eq('email', targetEmail)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: 'Lỗi truy vấn: ' + findErr.message }, { status: 500 });
    }

    if (!targetProfile) {
      return NextResponse.json(
        {
          error:
            'Không tìm thấy tài khoản với email này. Người dùng cần đăng ký và kích hoạt tài khoản NEXA trước khi được cấp quyền Quản trị viên.',
        },
        { status: 404 }
      );
    }

    if (targetProfile.admin_role === 'ADMIN') {
      return NextResponse.json(
        { error: `Tài khoản ${targetEmail} đã được cấp quyền Quản trị viên trước đó.` },
        { status: 400 }
      );
    }

    const { error: updateErr } = await adminSupabase
      .from('profiles')
      .update({ admin_role: 'ADMIN' })
      .eq('id', targetProfile.id);

    if (updateErr) {
      return NextResponse.json(
        { error: 'Không thể cập nhật quyền quản trị: ' + updateErr.message },
        { status: 500 }
      );
    }

    const clientIp = extractClientIp(request);
    await recordAdminAudit({
      adminId: auth.user!.id,
      adminEmail: auth.user!.email,
      action: 'GRANT_ROLE',
      targetType: 'USER',
      targetId: targetProfile.id,
      details: {
        targetEmail,
        newRole: 'ADMIN',
        performedBy: auth.user!.email,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: `Đã cấp quyền Quản trị viên thành công cho ${targetEmail}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/roles
 * Thu hồi quyền Quản trị viên (hạ cấp về LEARNER)
 * Chỉ Super Admin mới có quyền thực hiện
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_ROLES');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const body = await request.json().catch(() => ({}));
    const parsed = revokeRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const targetUserId = parsed.data.userId;
    const adminSupabase = createAdminClient();

    const { data: targetProfile, error: findErr } = await adminSupabase
      .from('profiles')
      .select('id, email, admin_role, full_name, nickname')
      .eq('id', targetUserId)
      .maybeSingle();

    if (findErr || !targetProfile) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản quản trị viên cần thu hồi quyền.' },
        { status: 404 }
      );
    }

    if (isSuperadminEmail(targetProfile.email)) {
      return NextResponse.json(
        { error: 'Không thể thu hồi quyền của Chủ sở hữu nền tảng (Super Admin).' },
        { status: 403 }
      );
    }

    const { error: updateErr } = await adminSupabase
      .from('profiles')
      .update({ admin_role: 'LEARNER' })
      .eq('id', targetProfile.id);

    if (updateErr) {
      return NextResponse.json(
        { error: 'Không thể thu hồi quyền quản trị: ' + updateErr.message },
        { status: 500 }
      );
    }

    const clientIp = extractClientIp(request);
    await recordAdminAudit({
      adminId: auth.user!.id,
      adminEmail: auth.user!.email,
      action: 'REVOKE_ROLE',
      targetType: 'USER',
      targetId: targetProfile.id,
      details: {
        targetEmail: targetProfile.email,
        revokedRole: 'ADMIN',
        performedBy: auth.user!.email,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: `Đã thu hồi quyền Quản trị viên của ${targetProfile.email || 'người dùng'}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
