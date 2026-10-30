import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const inviteSchema = z.object({
  organizationId: z.string().uuid('ID tổ chức không hợp lệ'),
  email: z.string().email('Email không đúng định dạng'),
  orgRole: z
    .enum(['ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'REPORT_VIEWER', 'MEMBER'])
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
      .single();

    const isPlatformAdmin = callerProfile?.role === 'ADMIN';

    if (!isPlatformAdmin) {
      const { data: membership } = await adminSupabase
        .from('user_organizations')
        .select('org_role, status')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'ACTIVE')
        .single();

      if (!membership || !['ORG_OWNER', 'ORG_ADMIN'].includes(membership.org_role)) {
        return NextResponse.json(
          { error: 'Bạn không có quyền quản trị để mời thành viên vào tổ chức này' },
          { status: 403 }
        );
      }
    }

    // 2. Verify organization exists and is active
    const { data: organization, error: orgError } = await adminSupabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Tổ chức không tồn tại' },
        { status: 404 }
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
    await adminSupabase
      .from('organization_invitations')
      .update({ status: 'REVOKED' })
      .eq('organization_id', organizationId)
      .eq('email', email.toLowerCase())
      .eq('status', 'PENDING');

    // 5. Insert new invitation
    const { data: invitation, error: insertError } = await adminSupabase
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

    if (insertError || !invitation) {
      return NextResponse.json(
        { error: 'Không thể tạo lời mời', details: insertError?.message },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin || 'http://localhost:3000';
    const inviteUrl = `${origin}/personal/accept-invite?token=${token}`;

    return NextResponse.json({
      success: true,
      message: 'Đã tạo lời mời thành viên thành công',
      invitation: {
        ...invitation,
        organizationName: organization.name,
        inviteUrl,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
