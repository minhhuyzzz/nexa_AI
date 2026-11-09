import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

const updateMemberSchema = z.object({
  targetUserId: z.string().uuid('ID người dùng không hợp lệ'),
  orgRole: z
    .enum(['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'MEMBER'])
    .optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const isSuperadmin = isSuperadminEmail(user.email);

    if (!isSuperadmin) {
      const { data: callerMembership } = await adminSupabase
        .from('user_organizations')
        .select('org_role, status')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!callerMembership) {
        return NextResponse.json({ error: 'Không có quyền truy cập tổ chức' }, { status: 403 });
      }
    }

    const { data: userOrgs, error } = await adminSupabase
      .from('user_organizations')
      .select(`
        id,
        user_id,
        org_role,
        status,
        created_at,
        profiles (
          id,
          email,
          full_name,
          nickname
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const members = (userOrgs || []).map((uo: any) => {
      const profile = uo.profiles;
      const nickname = profile?.full_name || profile?.nickname || profile?.email?.split('@')[0] || 'Thành viên';

      return {
        membershipId: uo.id,
        userId: uo.user_id,
        email: profile?.email || '',
        nickname,
        role: uo.org_role,
        status: uo.status,
        createdAt: uo.created_at,
        isCurrentUser: uo.user_id === user.id,
      };
    });

    return NextResponse.json({ success: true, members });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { targetUserId, orgRole, status } = validation.data;
    if (!orgRole && !status) {
      return NextResponse.json(
        { error: 'Cần cung cấp vai trò hoặc trạng thái mới để cập nhật' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const isSuperadmin = isSuperadminEmail(user.email);

    // 1. Check caller permissions in this org
    let callerRole: string | null = null;
    if (!isSuperadmin) {
      const { data: callerMembership } = await adminSupabase
        .from('user_organizations')
        .select('org_role, status')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!callerMembership || !['ORG_OWNER', 'ORG_ADMIN'].includes(callerMembership.org_role)) {
        return NextResponse.json(
          { error: 'Bạn không có quyền quản lý thành viên trong tổ chức này' },
          { status: 403 }
        );
      }
      callerRole = callerMembership.org_role;
    }

    // 2. Fetch target member
    const { data: targetMembership, error: targetError } = await adminSupabase
      .from('user_organizations')
      .select('id, user_id, org_role, status')
      .eq('user_id', targetUserId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (targetError || !targetMembership) {
      return NextResponse.json({ error: 'Không tìm thấy thành viên trong tổ chức' }, { status: 404 });
    }

    // 3. Permission hierarchy checks
    if (!isSuperadmin && callerRole === 'ORG_ADMIN') {
      // ORG_ADMIN cannot edit an ORG_OWNER
      if (targetMembership.org_role === 'ORG_OWNER') {
        return NextResponse.json(
          { error: 'Quản trị viên không có quyền thay đổi thông tin của Chủ sở hữu' },
          { status: 403 }
        );
      }
      // ORG_ADMIN cannot edit another ORG_ADMIN
      if (targetMembership.org_role === 'ORG_ADMIN' && targetMembership.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Quản trị viên không có quyền thay đổi thông tin của Quản trị viên khác' },
          { status: 403 }
        );
      }
      // ORG_ADMIN cannot promote someone to ORG_OWNER or ORG_ADMIN
      if (orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN') {
        return NextResponse.json(
          { error: 'Chỉ Chủ sở hữu hoặc Superadmin mới có thể chỉ định vai trò Quản trị viên hoặc Chủ sở hữu' },
          { status: 403 }
        );
      }
    }

    // 4. Sole Owner Protection: If demoting or suspending an ORG_OWNER
    const isTargetOwner = targetMembership.org_role === 'ORG_OWNER';
    const isChangingFromOwner = orgRole && orgRole !== 'ORG_OWNER';
    const isSuspendingOwner = status && status !== 'ACTIVE';

    if (isTargetOwner && (isChangingFromOwner || isSuspendingOwner)) {
      const { count: ownerCount } = await adminSupabase
        .from('user_organizations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('org_role', 'ORG_OWNER')
        .eq('status', 'ACTIVE');

      if ((ownerCount || 0) <= 1) {
        return NextResponse.json(
          { error: 'Không thể thay đổi vai trò hoặc tạm ngưng Chủ sở hữu duy nhất của tổ chức' },
          { status: 400 }
        );
      }
    }

    // 5. Update user_organizations
    const updatePayload: Record<string, any> = {};
    if (orgRole) updatePayload.org_role = orgRole;
    if (status) updatePayload.status = status;

    const { data: updated, error: updateError } = await adminSupabase
      .from('user_organizations')
      .update(updatePayload)
      .eq('id', targetMembership.id)
      .select('id, user_id, org_role, status, created_at')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Không thể cập nhật thành viên', details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thành viên thành công',
      member: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) {
      return NextResponse.json({ error: 'Thiếu userId cần xóa' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Bạn không thể tự xóa tài khoản của chính mình khỏi tổ chức' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const isSuperadmin = isSuperadminEmail(user.email);

    // 1. Check caller permissions
    let callerRole: string | null = null;
    if (!isSuperadmin) {
      const { data: callerMembership } = await adminSupabase
        .from('user_organizations')
        .select('org_role, status')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!callerMembership || !['ORG_OWNER', 'ORG_ADMIN'].includes(callerMembership.org_role)) {
        return NextResponse.json(
          { error: 'Bạn không có quyền xóa thành viên trong tổ chức này' },
          { status: 403 }
        );
      }
      callerRole = callerMembership.org_role;
    }

    // 2. Fetch target member
    const { data: targetMembership } = await adminSupabase
      .from('user_organizations')
      .select('id, user_id, org_role')
      .eq('user_id', targetUserId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!targetMembership) {
      return NextResponse.json({ error: 'Không tìm thấy thành viên trong tổ chức' }, { status: 404 });
    }

    // 3. Protection checks
    if (!isSuperadmin && callerRole === 'ORG_ADMIN') {
      if (targetMembership.org_role === 'ORG_OWNER') {
        return NextResponse.json(
          { error: 'Quản trị viên không có quyền xóa Chủ sở hữu khỏi tổ chức' },
          { status: 403 }
        );
      }
      if (targetMembership.org_role === 'ORG_ADMIN') {
        return NextResponse.json(
          { error: 'Quản trị viên không có quyền xóa Quản trị viên khác. Thao tác này chỉ dành cho Chủ sở hữu tổ chức.' },
          { status: 403 }
        );
      }
    }

    if (targetMembership.org_role === 'ORG_OWNER') {
      const { count: ownerCount } = await adminSupabase
        .from('user_organizations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('org_role', 'ORG_OWNER')
        .eq('status', 'ACTIVE');

      if ((ownerCount || 0) <= 1) {
        return NextResponse.json(
          { error: 'Không thể xóa Chủ sở hữu duy nhất của tổ chức' },
          { status: 400 }
        );
      }
    }

    // 4. Clean up class memberships for this user in this organization's classes
    const { data: orgClasses } = await adminSupabase
      .from('evaluator_classes')
      .select('id')
      .eq('organization_id', orgId);

    if (orgClasses && orgClasses.length > 0) {
      const classIds = orgClasses.map((c) => c.id);
      await adminSupabase
        .from('class_members')
        .delete()
        .eq('user_id', targetUserId)
        .in('class_id', classIds);
    }

    // 5. Delete membership from user_organizations (Preserves user's historical submissions in assessment_submissions)
    const { error: deleteError } = await adminSupabase
      .from('user_organizations')
      .delete()
      .eq('id', targetMembership.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Không thể xóa thành viên', details: deleteError.message },
        { status: 500 }
      );
    }

    // 6. Record immutable admin audit log
    recordAdminAudit({
      actorId: user.id,
      adminEmail: user.email || undefined,
      action: 'ORG_MEMBER_REMOVED',
      targetType: 'user_organization',
      targetId: targetMembership.id,
      details: {
        organization_id: orgId,
        target_user_id: targetUserId,
        target_role: targetMembership.org_role,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đã xóa thành viên khỏi tổ chức thành công. Lịch sử bài thi được lưu trữ an toàn.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
