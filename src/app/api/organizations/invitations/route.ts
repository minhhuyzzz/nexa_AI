import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // Check caller permission
    const { data: callerProfile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isPlatformAdmin = callerProfile?.role === 'ADMIN';

    if (!isPlatformAdmin) {
      const { data: membership } = await adminSupabase
        .from('user_organizations')
        .select('org_role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'ACTIVE')
        .single();

      if (!membership || membership.org_role !== 'ORG_ADMIN') {
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
