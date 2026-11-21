import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';
import { extractClientIp } from '@/lib/audit/client-ip';
import { getSuperadminEmails, isSuperadminEmail } from '@/lib/auth/superadmin';

export const dynamic = 'force-dynamic';

interface OrgRelation {
  id: string;
  name: string;
  code: string;
}

interface UserOrgRelation {
  organization_id: string;
  org_role?: string;
  organizations: OrgRelation | null;
}

interface ProfileRow {
  id: string;
  nickname: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  admin_role: string | null;
  plan_tier: string | null;
  points: number | null;
  is_suspended?: boolean | null;
  suspended_reason?: string | null;
  suspended_at?: string | null;
  created_at: string;
  user_organizations?: UserOrgRelation[];
}

export async function GET() {
  try {
    const auth = await requirePlatformAdmin('MANAGE_USERS');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }
    const adminSupabase = createAdminClient();

    // Fetch profiles with user_organizations
    const { data: profiles, error: profileErr } = await adminSupabase
      .from('profiles')
      .select(`
        id,
        nickname,
        full_name,
        email,
        role,
        admin_role,
        plan_tier,
        points,
        is_suspended,
        suspended_reason,
        suspended_at,
        created_at,
        user_organizations(organization_id, org_role, organizations(id, name, code))
      `)
      .order('created_at', { ascending: false });

    if (profileErr) {
      return NextResponse.json(
        { error: 'Không thể tải danh sách người dùng: ' + profileErr.message },
        { status: 500 }
      );
    }

    // Fetch submission counts per user
    const { data: subData } = await adminSupabase
      .from('assessment_submissions')
      .select('user_id');

    const subCountMap: Record<string, number> = {};
    (subData || []).forEach((s) => {
      if (s.user_id) subCountMap[s.user_id] = (subCountMap[s.user_id] || 0) + 1;
    });

    const superadminEmails = getSuperadminEmails();
    const rows = (profiles || []) as unknown as ProfileRow[];

    // Tách bạch: Lọc ẩn toàn bộ Chủ nền tảng và Quản trị viên khỏi bảng Người dùng
    const learnerRows = rows.filter((p) => {
      const emailLower = p.email?.trim().toLowerCase() || '';
      if (superadminEmails.includes(emailLower)) return false;
      if (
        p.admin_role === 'ADMIN' ||
        p.admin_role === 'SUPER_ADMIN' ||
        p.role === 'ADMIN'
      ) {
        return false;
      }
      return true;
    });

    const formatted = learnerRows.map((p) => {
      const firstOrg =
        Array.isArray(p.user_organizations) && p.user_organizations.length > 0
          ? p.user_organizations[0]
          : null;
      const orgRel = firstOrg?.organizations || null;

      // Chuẩn hóa về 4 gói dịch vụ cốt lõi
      const rawTier = (p.plan_tier || '').toUpperCase();
      let normalizedTier = 'BASIC';
      let planDisplayName = 'Gói Cơ Bản';

      if (rawTier === 'BUSINESS' || rawTier === 'ENTERPRISE' || rawTier === 'ORG_CAMPUS' || !!orgRel) {
        normalizedTier = 'ENTERPRISE';
        planDisplayName = 'Gói Tổ Chức';
      } else if (rawTier === 'ADVANCED' || rawTier === 'PRO' || rawTier === 'LEARNER_PRO') {
        normalizedTier = 'ADVANCED';
        planDisplayName = 'Gói Nâng Cao';
      } else if (rawTier === 'STANDARD' || rawTier === 'PLUS' || rawTier === 'LEARNER_PLUS') {
        normalizedTier = 'STANDARD';
        planDisplayName = 'Gói Tiêu Chuẩn';
      }

      return {
        id: p.id,
        nickname: p.nickname || p.email?.split('@')[0] || 'Người dùng',
        fullName: p.full_name || p.nickname || 'Chưa cập nhật',
        email: p.email,
        role: p.role || 'LEARNER',
        adminRole: p.admin_role || (p.role === 'ADMIN' ? 'SUPER_ADMIN' : 'LEARNER'),
        planTier: normalizedTier,
        planDisplayName,
        points: p.points || 0,
        isSuspended: Boolean(p.is_suspended),
        suspendedReason: p.suspended_reason || null,
        suspendedAt: p.suspended_at || null,
        organization: orgRel
          ? { id: orgRel.id, name: orgRel.name, code: orgRel.code, orgRole: firstOrg?.org_role || 'MEMBER' }
          : null,
        submissionsCount: subCountMap[p.id] || 0,
        createdAt: p.created_at,
      };
    });

    return NextResponse.json({ users: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('GET /api/admin/users error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface PatchBody {
  userId: string;
  action?: 'UPDATE' | 'SUSPEND' | 'UNSUSPEND' | 'REVOKE_SESSION';
  role?: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
  adminRole?: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATIONS_ADMIN' | 'CONTENT_ADMIN' | 'FINANCE_ADMIN' | 'AI_OPERATOR' | 'LEARNER';
  planTier?: 'BASIC' | 'STANDARD' | 'ADVANCED' | 'ENTERPRISE' | 'FREE' | 'PRO' | 'BUSINESS';
  organizationId?: string;
  reason?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const clientIp = typeof extractClientIp === 'function' ? extractClientIp(request) : '127.0.0.1';
    const auth = await requirePlatformAdmin('MANAGE_USERS');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }
    const adminSupabase = createAdminClient();

    const body: PatchBody = await request.json();
    const { userId, action = 'UPDATE', role, adminRole, planTier, organizationId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    if (action === 'SUSPEND') {
      if (userId === auth.user?.id) {
        return NextResponse.json(
          { error: 'Không thể tự khóa tài khoản của chính mình.' },
          { status: 400 }
        );
      }

      // Check target user email to prevent locking superadmin
      const { data: targetProfile } = await adminSupabase
        .from('profiles')
        .select('email, role, admin_role')
        .eq('id', userId)
        .maybeSingle();

      if (isSuperadminEmail(targetProfile?.email) || targetProfile?.admin_role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Không thể tạm khóa tài khoản Super Admin cấp cao nhất.' },
          { status: 403 }
        );
      }

      const suspensionReason = reason?.trim() || 'Vi phạm điều khoản sử dụng nền tảng';
      const nowIso = new Date().toISOString();

      // Revoke auth session immediately
      try {
        await adminSupabase.auth.admin.signOut(userId, 'global');
      } catch (e) {
        console.error('Error signing out suspended user from Supabase Auth:', e);
      }

      const { error: suspendErr } = await adminSupabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_reason: suspensionReason,
          suspended_at: nowIso,
          tokens_revoked_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', userId);

      if (suspendErr) {
        return NextResponse.json({ error: suspendErr.message }, { status: 400 });
      }

      await recordAdminAudit({
        adminId: auth.user?.id,
        adminEmail: auth.user?.email,
        action: 'USER_SUSPENDED',
        targetType: 'USER',
        targetId: userId,
        details: { reason: suspensionReason },
        ipAddress: clientIp,
      });

      return NextResponse.json({ success: true, message: 'Đã tạm khóa tài khoản và thu hồi phiên thành công.' });
    }

    if (action === 'UNSUSPEND') {
      const { error: unsuspendErr } = await adminSupabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_reason: null,
          suspended_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (unsuspendErr) {
        return NextResponse.json({ error: unsuspendErr.message }, { status: 400 });
      }

      await recordAdminAudit({
        adminId: auth.user?.id,
        adminEmail: auth.user?.email,
        action: 'USER_UNSUSPENDED',
        targetType: 'USER',
        targetId: userId,
        details: {},
        ipAddress: clientIp,
      });

      return NextResponse.json({ success: true, message: 'Đã mở khóa tài khoản thành công.' });
    }

    if (action === 'REVOKE_SESSION') {
      const nowIso = new Date().toISOString();

      // Invalidate sessions via auth admin signOut
      const { error: signOutErr } = await adminSupabase.auth.admin.signOut(userId, 'global');
      if (signOutErr) {
        console.error('Supabase Auth signOut global error:', signOutErr);
      }

      const { error: updateErr } = await adminSupabase
        .from('profiles')
        .update({
          tokens_revoked_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', userId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      await recordAdminAudit({
        adminId: auth.user?.id,
        adminEmail: auth.user?.email,
        action: 'USER_SESSION_REVOKED',
        targetType: 'USER',
        targetId: userId,
        details: { requestedBy: auth.user?.email },
        ipAddress: clientIp,
      });

      return NextResponse.json({ success: true, message: 'Đã thu hồi phiên và buộc đăng xuất người dùng thành công.' });
    }

    // Default UPDATE
    if (adminRole) {
      if (auth.user?.adminRole !== 'SUPER_ADMIN' && !isSuperadminEmail(auth.user?.email)) {
        return NextResponse.json(
          { error: 'Chỉ Chủ sở hữu nền tảng (Platform Owner) mới có quyền phân bổ vai trò quản trị.' },
          { status: 403 }
        );
      }
    }

    let normalizedTier: string | undefined = undefined;
    if (planTier) {
      const pUpper = planTier.toUpperCase();
      if (pUpper === 'BASIC' || pUpper === 'FREE') normalizedTier = 'BASIC';
      else if (pUpper === 'STANDARD' || pUpper === 'PLUS') normalizedTier = 'STANDARD';
      else if (pUpper === 'ADVANCED' || pUpper === 'PRO') normalizedTier = 'ADVANCED';
      else if (pUpper === 'ENTERPRISE' || pUpper === 'BUSINESS') normalizedTier = 'ENTERPRISE';
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (role && ['LEARNER', 'EVALUATOR', 'ADMIN'].includes(role)) {
      updates.role = role;
    }
    if (adminRole) {
      if (adminRole === 'ADMIN') {
        updates.admin_role = 'ADMIN';
        updates.role = 'ADMIN';
      } else if (adminRole === 'LEARNER') {
        updates.admin_role = 'LEARNER';
        updates.role = 'LEARNER';
      } else {
        updates.admin_role = adminRole;
      }
    }
    if (normalizedTier) {
      // Lưu tương thích ngược với DB
      updates.plan_tier = normalizedTier;
    }

    if (Object.keys(updates).length > 1) {
      const { error: updateErr } = await adminSupabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
    }

    // Nếu Admin thay đổi Gói: Tạo/cập nhật subscription 30 ngày và cấp bù AI credits
    if (normalizedTier) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Cấp bù AI credits tương ứng với gói mới
      const tierCreditsMap: Record<string, number> = {
        BASIC: 10,
        STANDARD: 100,
        ADVANCED: 500,
        ENTERPRISE: 10000,
      };
      const creditsToGrant = tierCreditsMap[normalizedTier] || 10;

      // Upsert subscriptions
      try {
        await adminSupabase.from('subscriptions').upsert(
          {
            user_id: userId,
            plan_code: normalizedTier,
            status: 'ACTIVE',
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            auto_renew: true,
            updated_at: now.toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch (subErr) {
        console.warn('Could not upsert subscription record:', subErr);
      }

      // Ghi nhận cấp credits vào ai_credit_ledgers nếu có
      try {
        await adminSupabase.from('ai_credit_ledgers').insert({
          user_id: userId,
          amount: creditsToGrant,
          action: 'ADMIN_GRANT',
          reason: `Admin gán gói dịch vụ ${normalizedTier}`,
          created_at: now.toISOString(),
        });
      } catch (ledgerErr) {
        // Fallback update points in profiles
        try {
          await adminSupabase.rpc('increment_user_points', {
            p_user_id: userId,
            p_points: creditsToGrant,
          });
        } catch (_) {}
      }
    }

    // If linking organization
    if (organizationId) {
      await adminSupabase
        .from('user_organizations')
        .upsert(
          {
            user_id: userId,
            organization_id: organizationId,
            org_role: 'MEMBER',
            status: 'ACTIVE',
          },
          { onConflict: 'user_id,organization_id' }
        );
    }

    await recordAdminAudit({
      adminId: auth.user?.id,
      adminEmail: auth.user?.email,
      action: 'USER_ROLE_OR_PLAN_UPDATED',
      targetType: 'USER',
      targetId: userId,
      details: { role, adminRole, planTier, organizationId },
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
