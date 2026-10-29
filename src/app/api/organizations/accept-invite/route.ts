import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const acceptSchema = z.object({
  token: z.string().min(10, 'Mã lời mời không hợp lệ'),
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
        { error: 'Vui lòng đăng nhập để chấp nhận lời mời' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = acceptSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { token } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Fetch invitation record
    const { data: invitation, error: inviteErr } = await adminSupabase
      .from('organization_invitations')
      .select('id, organization_id, email, org_role, status, expires_at')
      .eq('token', token)
      .single();

    if (inviteErr || !invitation) {
      return NextResponse.json(
        { error: 'Lời mời không tồn tại hoặc liên kết không chính xác' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Lời mời này đã ở trạng thái ${invitation.status === 'ACCEPTED' ? 'được chấp nhận' : 'bị thu hồi'}` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await adminSupabase
        .from('organization_invitations')
        .update({ status: 'EXPIRED' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Lời mời đã hết thời hạn 7 ngày. Vui lòng liên hệ quản trị viên để gửi lại' },
        { status: 400 }
      );
    }

    // 2. Security validation: Verify the authenticated user is the actual invitee
    const currentEmail = user.email?.trim().toLowerCase();
    const invitedEmail = invitation.email?.trim().toLowerCase();

    if (!currentEmail || currentEmail !== invitedEmail) {
      return NextResponse.json(
        {
          error: `Lời mời này được gửi cho địa chỉ email ${invitation.email}. Bạn đang đăng nhập bằng ${user.email || 'tài khoản khác'}. Vui lòng đăng nhập đúng tài khoản nhận lời mời.`,
        },
        { status: 403 }
      );
    }

    // 3. Fetch organization info
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('id, name')
      .eq('id', invitation.organization_id)
      .single();

    // 3. Upsert into user_organizations
    const { error: memberError } = await adminSupabase
      .from('user_organizations')
      .upsert(
        {
          user_id: user.id,
          organization_id: invitation.organization_id,
          org_role: invitation.org_role,
          status: 'ACTIVE',
        },
        { onConflict: 'user_id, organization_id' }
      );

    if (memberError) {
      return NextResponse.json(
        { error: 'Lỗi khi cập nhật thành viên tổ chức', details: memberError.message },
        { status: 500 }
      );
    }

    // 4. Mark invitation as ACCEPTED
    await adminSupabase
      .from('organization_invitations')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      message: `Chào mừng bạn gia nhập ${org?.name || 'tổ chức'}!`,
      organization: {
        id: invitation.organization_id,
        name: org?.name,
        role: invitation.org_role,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to inspect token before accepting
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Thiếu token' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: invitation, error } = await adminSupabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        org_role,
        status,
        expires_at,
        created_at,
        organizations ( id, name, code )
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Lời mời không hợp lệ' }, { status: 404 });
    }

    const isExpired = new Date(invitation.expires_at) < new Date();

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        orgRole: invitation.org_role,
        status: isExpired && invitation.status === 'PENDING' ? 'EXPIRED' : invitation.status,
        expiresAt: invitation.expires_at,
        organization: invitation.organizations,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
