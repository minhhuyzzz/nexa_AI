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

    // 3. Fetch organization info & verify active status and seats availability
    const { data: org, error: orgError } = await adminSupabase
      .from('organizations')
      .select('id, name, slug, is_active, max_members')
      .eq('id', invitation.organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Tổ chức không tồn tại' }, { status: 404 });
    }

    if (org.is_active === false) {
      return NextResponse.json(
        { error: 'Tổ chức này hiện đang bị tạm ngưng hoạt động. Không thể chấp nhận lời mời.' },
        { status: 403 }
      );
    }

    // Check seat capacity
    const { count: memberCount, error: countErr } = await adminSupabase
      .from('user_organizations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'ACTIVE');

    const maxAllowedSeats = org.max_members || 50;
    if (!countErr && typeof memberCount === 'number' && memberCount >= maxAllowedSeats) {
      return NextResponse.json(
        {
          error: `Tổ chức đã đạt giới hạn thành viên tối đa (${maxAllowedSeats} ghế). Vui lòng liên hệ quản trị viên tổ chức.`,
        },
        { status: 400 }
      );
    }

    // 4. Upsert into user_organizations
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

    // 5. Mark invitation as ACCEPTED
    await adminSupabase
      .from('organization_invitations')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    // If this was an ORG_OWNER accepting, activate the organization
    if (invitation.org_role === 'ORG_OWNER') {
      await adminSupabase
        .from('organizations')
        .update({
          status: 'ACTIVE',
          is_active: true,
        })
        .eq('id', invitation.organization_id);
    }

    return NextResponse.json({
      success: true,
      message: `Chào mừng bạn gia nhập ${org?.name || 'tổ chức'}!`,
      organization: {
        id: invitation.organization_id,
        name: org?.name,
        slug: org?.slug,
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
        organizations ( id, name, slug, code )
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
