import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Fetch user organizations using authenticated user client (satisfies RLS user_org_select_own)
    const { data: userOrgs, error } = await supabase
      .from('user_organizations')
      .select(`
        id,
        org_role,
        status,
        created_at,
        organizations (
          id,
          name,
          slug,
          code,
          plan_tier,
          status
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, plan_tier')
      .eq('id', user.id)
      .single();

    const isPlatformAdmin = profile?.role === 'ADMIN';
    const planTier = profile?.plan_tier || 'FREE';

    interface UserOrgRow {
      id: string;
      org_role: string;
      status: string;
      organizations: {
        id: string;
        name: string;
        slug: string;
        code?: string;
        plan_tier?: string;
        status?: string;
      } | null;
    }

    const workspaces = ((userOrgs as unknown as UserOrgRow[]) || []).map((uo) => ({
      membershipId: uo.id,
      role: uo.org_role,
      organization: uo.organizations,
    }));

    return NextResponse.json({
      success: true,
      workspaces,
      isPlatformAdmin: !!isPlatformAdmin,
      planTier,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { organizationId } = body;
    if (!organizationId) {
      return NextResponse.json({ error: 'Thiếu mã định danh tổ chức' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id, org_role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Bạn không thuộc tổ chức này' }, { status: 404 });
    }

    if (membership.org_role === 'ORG_OWNER') {
      return NextResponse.json(
        { error: 'Chủ sở hữu không thể rời tổ chức. Vui lòng chuyển nhượng quyền trước.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { error: deleteErr } = await adminSupabase
      .from('user_organizations')
      .delete()
      .eq('user_id', user.id)
      .eq('organization_id', organizationId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã rời khỏi tổ chức thành công' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
