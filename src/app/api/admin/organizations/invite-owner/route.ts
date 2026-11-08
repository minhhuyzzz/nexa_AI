import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrgOwnerWelcomeEmail, sendOrgInvitationEmail } from '@/lib/email/email-service';

export const dynamic = 'force-dynamic';

const inviteOwnerSchema = z.object({
  organizationId: z.string().uuid('ID tổ chức không hợp lệ'),
  email: z.string().trim().email('Email không hợp lệ').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const body = await request.json();
    const validation = inviteOwnerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { organizationId, email } = validation.data;
    const adminSupabase = createAdminClient();

    const { data: org, error: orgErr } = await adminSupabase
      .from('organizations')
      .select('id, name, slug, contact_email')
      .eq('id', organizationId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: 'Không tìm thấy tổ chức' }, { status: 404 });
    }

    const targetEmail = (email || org.contact_email || '').trim().toLowerCase();
    if (!targetEmail) {
      return NextResponse.json({ error: 'Tổ chức này chưa có email người đại diện / Owner' }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Kiểm tra xem email này đã có tài khoản trên hệ thống chưa
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', targetEmail)
      .maybeSingle();

    if (existingProfile) {
      // 1. Tài khoản đã tồn tại: Cấp thẳng quyền ORG_OWNER
      const { error: memberErr } = await adminSupabase.from('user_organizations').upsert(
        {
          user_id: existingProfile.id,
          organization_id: org.id,
          org_role: 'ORG_OWNER',
          status: 'ACTIVE',
        },
        { onConflict: 'user_id, organization_id' }
      );

      if (memberErr) {
        return NextResponse.json({ error: 'Lỗi gán quyền Owner: ' + memberErr.message }, { status: 500 });
      }

      await adminSupabase
        .from('organizations')
        .update({ status: 'ACTIVE', is_active: true, contact_email: targetEmail })
        .eq('id', org.id);

      await adminSupabase.from('organization_invitations').insert({
        organization_id: org.id,
        email: targetEmail,
        org_role: 'ORG_OWNER',
        token,
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      const mailRes = await sendOrgOwnerWelcomeEmail({
        toEmail: targetEmail,
        fullName: existingProfile.full_name,
        orgName: org.name,
        orgSlug: org.slug,
        origin,
      });

      return NextResponse.json({
        success: true,
        isDirectAssigned: true,
        email: targetEmail,
        emailSent: mailRes.success,
        message: `Đã tự động cấp quyền Chủ sở hữu cho tài khoản ${targetEmail}`,
      });
    }

    // 2. Tài khoản chưa tồn tại: Tạo lời mời và gửi email kích hoạt tài khoản
    const { error: inviteErr } = await adminSupabase.from('organization_invitations').insert({
      organization_id: org.id,
      email: targetEmail,
      org_role: 'ORG_OWNER',
      token,
      status: 'PENDING',
      expires_at: expiresAt.toISOString(),
    });

    if (inviteErr) {
      return NextResponse.json({ error: 'Lỗi tạo lời mời: ' + inviteErr.message }, { status: 500 });
    }

    const inviteUrl = `${origin}/accept-invite?token=${token}`;

    const mailRes = await sendOrgInvitationEmail({
      toEmail: targetEmail,
      orgName: org.name,
      orgRole: 'ORG_OWNER',
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      inviteUrl,
      email: targetEmail,
      isDirectAssigned: false,
      emailSent: mailRes.success,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
