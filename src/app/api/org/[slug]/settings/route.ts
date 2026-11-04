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
    const { data: org, error: orgErr } = await adminSupabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        code,
        type,
        logo_url,
        description,
        contact_name,
        contact_email,
        contact_phone,
        is_active,
        created_at
      `)
      .eq('slug', slug)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: 'Tổ chức không tồn tại' }, { status: 404 });
    }

    // Verify caller membership and role
    const { data: membership } = await adminSupabase
      .from('user_organizations')
      .select('org_role, status')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Bạn không phải thành viên của tổ chức này' }, { status: 403 });
    }

    const { data: policy } = await adminSupabase
      .from('organization_policies')
      .select('*')
      .eq('organization_id', org.id)
      .maybeSingle();

    // If caller is ORG_OWNER, fetch list of active admins for potential ownership transfer
    let availableAdmins: Array<{ id: string; name: string; email: string }> = [];
    if (membership.org_role === 'ORG_OWNER') {
      const { data: adminMembers } = await adminSupabase
        .from('user_organizations')
        .select(`
          user_id,
          profiles ( id, nickname, email, full_name )
        `)
        .eq('organization_id', org.id)
        .eq('org_role', 'ORG_ADMIN')
        .eq('status', 'ACTIVE');

      availableAdmins = (adminMembers || []).map((m: any) => ({
        id: m.user_id,
        name: m.profiles?.full_name || m.profiles?.nickname || m.profiles?.email || 'Quản trị viên',
        email: m.profiles?.email || '',
      }));
    }

    const defaultPolicy = {
      allowed_domains: [],
      anti_cheat_enabled: true,
      fullscreen_enforced: false,
      tab_switch_limit: 3,
      time_limit_minutes: 60,
      passing_score: 70,
      auto_publish_results: true,
      show_detailed_breakdown: true,
      require_approval_for_join: false,
      allow_code_join: true,
    };

    return NextResponse.json({
      organization: org,
      policy: policy ? { ...defaultPolicy, ...policy } : defaultPolicy,
      userRole: membership.org_role,
      availableAdmins,
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
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Tổ chức không tồn tại' }, { status: 404 });
    }

    // Verify caller role in organization
    const { data: membership } = await adminSupabase
      .from('user_organizations')
      .select('org_role')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (!membership || !['ORG_OWNER', 'ORG_ADMIN'].includes(membership.org_role)) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên (ORG_ADMIN) hoặc Chủ sở hữu (ORG_OWNER) mới có quyền chỉnh sửa cài đặt.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, organizationData, policyData, targetOwnerId } = body;

    // 1. ACTION: Transfer Ownership (Restricted strictly to ORG_OWNER)
    if (action === 'TRANSFER_OWNERSHIP') {
      if (membership.org_role !== 'ORG_OWNER') {
        return NextResponse.json(
          { error: 'Chỉ Chủ sở hữu hiện tại (ORG_OWNER) mới có quyền chuyển giao tổ chức.' },
          { status: 403 }
        );
      }

      if (!targetOwnerId || targetOwnerId === user.id) {
        return NextResponse.json(
          { error: 'Vui lòng chọn một Quản trị viên hợp lệ để chuyển giao quyền sở hữu.' },
          { status: 400 }
        );
      }

      // Verify target user is active in organization
      const { data: targetMembership } = await adminSupabase
        .from('user_organizations')
        .select('id, org_role')
        .eq('organization_id', org.id)
        .eq('user_id', targetOwnerId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!targetMembership) {
        return NextResponse.json(
          { error: 'Người nhận chuyển giao không phải là thành viên hợp lệ của tổ chức này.' },
          { status: 400 }
        );
      }

      // Demote current owner to ORG_ADMIN
      await adminSupabase
        .from('user_organizations')
        .update({ org_role: 'ORG_ADMIN', updated_at: new Date().toISOString() })
        .eq('organization_id', org.id)
        .eq('user_id', user.id);

      // Promote target member to ORG_OWNER
      await adminSupabase
        .from('user_organizations')
        .update({ org_role: 'ORG_OWNER', updated_at: new Date().toISOString() })
        .eq('organization_id', org.id)
        .eq('user_id', targetOwnerId);

      // Record audit log
      await adminSupabase.from('org_audit_logs').insert({
        organization_id: org.id,
        actor_id: user.id,
        actor_email: user.email,
        actor_role: 'ORG_OWNER',
        action: 'TRANSFER_OWNERSHIP',
        target_type: 'USER',
        target_id: targetOwnerId,
        details: { previous_owner: user.id, new_owner: targetOwnerId },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã chuyển giao quyền Chủ sở hữu tổ chức thành công.',
      });
    }

    // 2. Update Organization Profile (Name, logo, description, contact details)
    if (organizationData && typeof organizationData === 'object') {
      const allowedOrgUpdates: Record<string, any> = {};
      if (typeof organizationData.name === 'string' && organizationData.name.trim()) {
        allowedOrgUpdates.name = organizationData.name.trim();
      }
      if (organizationData.type !== undefined) {
        allowedOrgUpdates.type = organizationData.type ? String(organizationData.type).trim() : null;
      }
      if (organizationData.logo_url !== undefined) {
        allowedOrgUpdates.logo_url = organizationData.logo_url ? String(organizationData.logo_url).trim() : null;
      }
      if (organizationData.description !== undefined) {
        allowedOrgUpdates.description = organizationData.description ? String(organizationData.description).trim() : null;
      }
      if (organizationData.contact_name !== undefined) {
        allowedOrgUpdates.contact_name = organizationData.contact_name ? String(organizationData.contact_name).trim() : null;
      }
      if (organizationData.contact_email !== undefined) {
        const email = organizationData.contact_email ? String(organizationData.contact_email).trim() : null;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ error: 'Email liên hệ không hợp lệ' }, { status: 400 });
        }
        allowedOrgUpdates.contact_email = email;
      }
      if (organizationData.contact_phone !== undefined) {
        allowedOrgUpdates.contact_phone = organizationData.contact_phone ? String(organizationData.contact_phone).trim() : null;
      }

      if (Object.keys(allowedOrgUpdates).length > 0) {
        const { error: orgUpdateErr } = await adminSupabase
          .from('organizations')
          .update(allowedOrgUpdates)
          .eq('id', org.id);

        if (orgUpdateErr) {
          return NextResponse.json({ error: orgUpdateErr.message }, { status: 400 });
        }
      }
    }

    // 3. Update Organization Policy
    if (policyData && typeof policyData === 'object') {
      const {
        allowed_domains = [],
        anti_cheat_enabled = true,
        fullscreen_enforced = false,
        tab_switch_limit = 3,
        time_limit_minutes = 60,
        passing_score = 70,
        auto_publish_results = true,
        show_detailed_breakdown = true,
        require_approval_for_join = false,
        allow_code_join = true,
      } = policyData;

      const { error: upsertPolicyErr } = await adminSupabase
        .from('organization_policies')
        .upsert({
          organization_id: org.id,
          allowed_domains: Array.isArray(allowed_domains) ? allowed_domains : [],
          anti_cheat_enabled: Boolean(anti_cheat_enabled),
          fullscreen_enforced: Boolean(fullscreen_enforced),
          tab_switch_limit: Number(tab_switch_limit) || 3,
          time_limit_minutes: Number(time_limit_minutes) || 60,
          passing_score: Math.min(100, Math.max(1, Number(passing_score) || 70)),
          auto_publish_results: Boolean(auto_publish_results),
          show_detailed_breakdown: Boolean(show_detailed_breakdown),
          require_approval_for_join: Boolean(require_approval_for_join),
          allow_code_join: Boolean(allow_code_join),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        });

      if (upsertPolicyErr) {
        return NextResponse.json({ error: upsertPolicyErr.message }, { status: 400 });
      }
    }

    // 4. Record audit log for settings update
    await adminSupabase.from('org_audit_logs').insert({
      organization_id: org.id,
      actor_id: user.id,
      actor_email: user.email,
      actor_role: membership.org_role,
      action: 'UPDATE_SETTINGS',
      target_type: 'ORGANIZATION',
      target_id: org.id,
      details: { organizationUpdated: Boolean(organizationData), policyUpdated: Boolean(policyData) },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu thay đổi cấu hình tổ chức thành công.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
