import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 });
    }

    const organizationId = request.nextUrl.searchParams.get('organizationId');
    if (!organizationId) {
      return NextResponse.json({ error: 'Thiếu organizationId' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const isSuperadmin = isSuperadminEmail(user.email);

    if (!isSuperadmin) {
      const { data: membership } = await adminSupabase
        .from('user_organizations')
        .select('org_role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!membership || !['ORG_OWNER', 'ORG_ADMIN'].includes(membership.org_role)) {
        return NextResponse.json(
          { error: 'Không có quyền truy cập danh sách lời mời' },
          { status: 403 }
        );
      }
    }

    const { data: invitations, error } = await adminSupabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        org_role,
        status,
        token,
        expires_at,
        created_at,
        accepted_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');
    const organizationId = searchParams.get('organizationId');

    if (!invitationId || !organizationId) {
      return NextResponse.json(
        { error: 'Thiếu invitationId hoặc organizationId' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const isSuperadmin = isSuperadminEmail(user.email);

    if (!isSuperadmin) {
      const { data: membership } = await adminSupabase
        .from('user_organizations')
        .select('org_role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!membership || !['ORG_OWNER', 'ORG_ADMIN'].includes(membership.org_role)) {
        return NextResponse.json(
          { error: 'Không có quyền thu hồi lời mời' },
          { status: 403 }
        );
      }
    }

    const { error: updateError } = await adminSupabase
      .from('organization_invitations')
      .update({ status: 'REVOKED' })
      .eq('id', invitationId)
      .eq('organization_id', organizationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã thu hồi lời mời thành công',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
