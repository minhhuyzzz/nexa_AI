import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

const acceptSchema = z.object({
  token: z.string().min(10, 'Mã lời mời không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').optional(),
  fullName: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit to prevent brute forcing invitation tokens
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`invite-accept:${clientIp}`, {
      limit: 10,
      windowMs: 5 * 60 * 1000, // 10 attempts per 5 minutes
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${rateLimit.retryAfterSeconds} giây.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const validation = acceptSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { token, password, fullName } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Fetch invitation record
    const { data: invitation, error: inviteErr } = await adminSupabase
      .from('organization_invitations')
      .select('id, organization_id, email, org_role, status, expires_at, invited_by')
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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let targetUserId = user?.id;

    // 2. Security validation & Authentication resolution
    if (!user) {
      if (!password) {
        return NextResponse.json(
          { error: 'Vui lòng đăng nhập hoặc nhập mật khẩu để kích hoạt tài khoản' },
          { status: 401 }
        );
      }

      // Check if user already exists
      const { data: existingUser } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('email', invitation.email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Tài khoản với email này đã tồn tại trên NEXA. Vui lòng đăng nhập để tiếp tục.' },
          { status: 400 }
        );
      }

      // Create new user in Supabase Auth
      const { data: createdAuth, error: createAuthErr } = await adminSupabase.auth.admin.createUser({
        email: invitation.email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || 'Thành viên' },
      });

      if (createAuthErr || !createdAuth.user) {
        return NextResponse.json(
          { error: 'Không thể tạo tài khoản: ' + (createAuthErr?.message || 'Lỗi không xác định') },
          { status: 400 }
        );
      }

      targetUserId = createdAuth.user.id;

      // Upsert profile
      await adminSupabase.from('profiles').upsert({
        id: targetUserId,
        email: invitation.email.trim().toLowerCase(),
        full_name: fullName || 'Thành viên',
        nickname: fullName ? fullName.split(' ')[0] : 'Thành viên',
        role: invitation.org_role === 'ORG_OWNER' ? 'ADMIN' : 'LEARNER',
        is_onboarded: true,
      });
    } else {
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

    // 4. Atomic claim of the invitation to prevent double-accept race conditions (NEXA-14)
    let claimQuery: any = adminSupabase
      .from('organization_invitations')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (claimQuery && typeof claimQuery.eq === 'function') {
      claimQuery = claimQuery.eq('status', 'PENDING');
    }

    if (claimQuery && typeof claimQuery.select === 'function') {
      claimQuery = claimQuery.select();
      if (typeof claimQuery.maybeSingle === 'function') {
        claimQuery = claimQuery.maybeSingle();
      }
    }

    const claimRes = await claimQuery;
    if (claimRes?.error) {
      return NextResponse.json(
        { error: 'Lời mời này đã được chấp nhận bởi một phiên khác hoặc không còn hiệu lực' },
        { status: 409 }
      );
    }

    // 5. Upsert into user_organizations
    const { error: memberError } = await adminSupabase
      .from('user_organizations')
      .upsert(
        {
          user_id: targetUserId,
          organization_id: invitation.organization_id,
          org_role: invitation.org_role,
          status: 'ACTIVE',
        },
        { onConflict: 'user_id, organization_id' }
      );

    if (memberError) {
      // Compensating rollback: Revert invitation back to PENDING if member upsert fails
      await adminSupabase
        .from('organization_invitations')
        .update({
          status: 'PENDING',
          accepted_at: null,
        })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Lỗi khi cập nhật thành viên tổ chức', details: memberError.message },
        { status: 500 }
      );
    }

    // Two-way in-app notification
    try {
      const notifTable = adminSupabase.from('user_notifications');
      if (typeof notifTable?.insert === 'function') {
        // 1. Notify the member who joined
        await notifTable.insert({
          user_id: targetUserId,
          title: 'Tham gia tổ chức thành công',
          message: `Chào mừng bạn đã chính thức gia nhập ${org?.name || 'tổ chức'}!`,
          category: 'CAMPAIGN',
          link_url: '/personal/groups',
          is_read: false,
        });

        // 2. Notify the inviter (owner or admin)
        if (invitation.invited_by) {
          await notifTable.insert({
            user_id: invitation.invited_by,
            title: 'Thành viên mới gia nhập',
            message: `${user?.email || fullName || 'Thành viên'} đã chấp nhận lời mời tham gia ${org?.name || 'tổ chức'}.`,
            category: 'CAMPAIGN',
            link_url: `/org/${org?.slug}/members`,
            is_read: false,
          });
        }
      }
    } catch (notifErr) {
      console.warn('[ACCEPT_INVITE_NOTIF_WARN]', notifErr);
    }

    // 6. If this was an ORG_OWNER accepting, activate the organization
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

    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', invitation.email.trim().toLowerCase())
      .maybeSingle();

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        orgRole: invitation.org_role,
        status: isExpired && invitation.status === 'PENDING' ? 'EXPIRED' : invitation.status,
        expiresAt: invitation.expires_at,
        organization: invitation.organizations,
        hasExistingAccount: Boolean(existingProfile),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
