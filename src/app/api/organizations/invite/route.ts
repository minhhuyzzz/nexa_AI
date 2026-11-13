import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';
import { sendOrgInvitationEmail } from '@/lib/email/email-service';

const inviteSchema = z.object({
  organizationId: z.string().uuid('ID tổ chức không hợp lệ'),
  email: z.string().email('Email không đúng định dạng'),
  orgRole: z
    .enum(['ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'MEMBER'])
    .default('MEMBER'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập để thực hiện lời mời' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { organizationId, email, orgRole } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Verify caller has permission in this organization (ORG_ADMIN or platform ADMIN)
    const { data: callerProfile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isPlatformAdmin = callerProfile?.role === 'ADMIN' || isSuperadminEmail(user.email);

    if (!isPlatformAdmin) {
      const { data: membership } = await adminSupabase
        .from('user_organizations')
        .select('org_role, status')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!membership || !['ORG_OWNER', 'ORG_ADMIN'].includes(membership.org_role)) {
        return NextResponse.json(
          { error: 'Bạn không có quyền quản trị để mời thành viên vào tổ chức này' },
          { status: 403 }
        );
      }

      // Strict User Rule: Only ORG_OWNER can invite an ORG_ADMIN
      if (membership.org_role !== 'ORG_OWNER' && orgRole === 'ORG_ADMIN') {
        return NextResponse.json(
          { error: 'Chỉ Chủ sở hữu tổ chức mới có quyền mời Quản trị viên mới' },
          { status: 403 }
        );
      }
    }

    // 2. Verify organization exists and is active
    const { data: organization, error: orgError } = await adminSupabase
      .from('organizations')
      .select('id, name, is_active, max_members')
      .eq('id', organizationId)
      .maybeSingle();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Tổ chức không tồn tại' },
        { status: 404 }
      );
    }

    if (organization.is_active === false) {
      return NextResponse.json(
        { error: 'Tổ chức hiện đang tạm ngưng hoạt động. Không thể gửi thêm lời mời.' },
        { status: 403 }
      );
    }

    // Check available seats before issuing new invitation
    const { count: currentMemberCount } = await adminSupabase
      .from('user_organizations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE');

    const maxAllowedSeats = organization.max_members || 500;
    if (typeof currentMemberCount === 'number' && currentMemberCount >= maxAllowedSeats) {
      return NextResponse.json(
        {
          error: `Tổ chức đã sử dụng hết hạn mức chỗ ngồi (${maxAllowedSeats} ghế). Vui lòng liên hệ quản trị viên để nâng cấp hạn mức trước khi mời thêm.`,
        },
        { status: 400 }
      );
    }

    // 3. Check if email already belongs to this organization
    const { data: existingUser } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      const { data: existingMember } = await adminSupabase
        .from('user_organizations')
        .select('id, status')
        .eq('user_id', existingUser.id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingMember && existingMember.status === 'ACTIVE') {
        return NextResponse.json(
          { error: 'Người dùng này đã là thành viên chính thức của tổ chức' },
          { status: 400 }
        );
      }
    }

    // 4. Generate unique invitation token
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Revoke any pending previous invitations for this email in this org
    try {
      await supabase
        .from('organization_invitations')
        .update({ status: 'REVOKED' })
        .eq('organization_id', organizationId)
        .eq('email', email.toLowerCase())
        .eq('status', 'PENDING');
    } catch {
      // Non-blocking if previous record does not belong to caller
    }

    // 5. Insert new invitation using user authenticated client (satisfies RLS invited_by = auth.uid())
    let { data: invitation, error: insertError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        org_role: orgRole,
        token,
        status: 'PENDING',
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, token, email, org_role, status, expires_at, created_at')
      .single();

    if (insertError) {
      // Fallback to adminSupabase if service role is enabled
      const adminRes = await adminSupabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email: email.toLowerCase(),
          org_role: orgRole,
          token,
          status: 'PENDING',
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select('id, token, email, org_role, status, expires_at, created_at')
        .single();

      if (!adminRes.error && adminRes.data) {
        invitation = adminRes.data;
        insertError = null;
      } else if (adminRes.error) {
        insertError = adminRes.error;
      }
    }

    if (insertError || !invitation) {
      console.error('[INVITE_INSERT_ERROR]', insertError);
      return NextResponse.json(
        {
          error: 'Không thể tạo lời mời',
          details: insertError?.message || 'Lỗi khi lưu trữ lời mời vào cơ sở dữ liệu',
        },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin || 'http://localhost:3000';
    const inviteUrl = `${origin}/accept-invite?token=${token}`;

    // In-app notification for existing users on the platform
    if (existingUser?.id) {
      const roleLabelMap: Record<string, string> = {
        ORG_OWNER: 'Chủ sở hữu',
        ORG_ADMIN: 'Quản trị viên',
        ASSESSOR: 'Khảo thí viên',
        EVALUATOR: 'Khảo thí viên',
        MEMBER: 'Thành viên',
      };
      const roleLabel = roleLabelMap[orgRole] || 'Thành viên';
      try {
        const notifTable = adminSupabase.from('user_notifications');
        if (typeof notifTable?.insert === 'function') {
          await notifTable.insert({
            user_id: existingUser.id,
            title: `Lời mời tham gia ${organization.name}`,
            message: `Bạn được mời gia nhập tổ chức với vai trò ${roleLabel}. Bấm để xác nhận tham gia.`,
            category: 'CAMPAIGN',
            link_url: `/accept-invite?token=${token}`,
            is_read: false,
          });
        }
      } catch (notifErr) {
        console.warn('[INVITE_NOTIFICATION_WARN]', notifErr);
      }
    }

    const mailRes = await sendOrgInvitationEmail({
      toEmail: email.toLowerCase(),
      orgName: organization.name,
      orgRole,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Đã tạo lời mời thành viên thành công',
      invitation: {
        ...invitation,
        organizationName: organization.name,
        inviteUrl,
        emailSent: mailRes.success,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
