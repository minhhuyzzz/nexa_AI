import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Tổ chức không tồn tại' }, { status: 404 });
    }

    const { data: policy } = await adminSupabase
      .from('organization_policies')
      .select('*')
      .eq('organization_id', org.id)
      .maybeSingle();

    return NextResponse.json({
      policy: policy || {
        allowed_domains: [],
        anti_cheat_enabled: true,
        fullscreen_enforced: false,
        tab_switch_limit: 3,
        time_limit_minutes: 60,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Tổ chức không tồn tại' }, { status: 404 });
    }

    // Verify user is ORG_OWNER or ORG_ADMIN
    const { data: membership } = await adminSupabase
      .from('user_organizations')
      .select('org_role')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (!membership || !['ORG_OWNER', 'ORG_ADMIN'].includes(membership.org_role)) {
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa cài đặt chính sách của tổ chức này' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      allowed_domains = [],
      anti_cheat_enabled = true,
      fullscreen_enforced = false,
      tab_switch_limit = 3,
      time_limit_minutes = 60,
    } = body;

    const { error: upsertErr } = await adminSupabase
      .from('organization_policies')
      .upsert({
        organization_id: org.id,
        allowed_domains: Array.isArray(allowed_domains) ? allowed_domains : [],
        anti_cheat_enabled: Boolean(anti_cheat_enabled),
        fullscreen_enforced: Boolean(fullscreen_enforced),
        tab_switch_limit: Number(tab_switch_limit) || 3,
        time_limit_minutes: Number(time_limit_minutes) || 60,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Đã lưu cấu hình chính sách tổ chức thành công.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
