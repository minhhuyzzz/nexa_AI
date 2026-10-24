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

    const adminSupabase = createAdminClient();

    // Fetch user organizations
    const { data: userOrgs, error } = await adminSupabase
      .from('user_organizations')
      .select(`
        id,
        org_role,
        status,
        created_at,
        organizations (
          id,
          name,
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

    interface UserOrgRow {
      id: string;
      org_role: string;
      status: string;
      organizations: {
        id: string;
        name: string;
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
