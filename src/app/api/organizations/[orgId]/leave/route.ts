import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // 1. Kiểm tra tư cách thành viên của người dùng trong tổ chức này
    const { data: membership, error: memErr } = await adminSupabase
      .from('user_organizations')
      .select('id, user_id, organization_id, org_role, status')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (memErr || !membership) {
      return NextResponse.json(
        { error: 'Bạn không phải là thành viên của tổ chức này' },
        { status: 404 }
      );
    }

    // 2. Bảo vệ: Nếu người dùng là Chủ sở hữu (ORG_OWNER)
    if (membership.org_role === 'ORG_OWNER') {
      const { count: ownerCount } = await adminSupabase
        .from('user_organizations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('org_role', 'ORG_OWNER')
        .eq('status', 'ACTIVE');

      if ((ownerCount || 0) <= 1) {
        return NextResponse.json(
          {
            error:
              'Bạn là Chủ sở hữu duy nhất của tổ chức này. Vui lòng chuyển giao quyền Chủ sở hữu trước khi rời tổ chức.',
          },
          { status: 400 }
        );
      }
    }

    // 3. Tự động rút người dùng khỏi tất cả các lớp học thuộc tổ chức này
    const { data: orgClasses } = await adminSupabase
      .from('evaluator_classes')
      .select('id')
      .eq('organization_id', orgId);

    if (orgClasses && orgClasses.length > 0) {
      const classIds = orgClasses.map((c) => c.id);
      await adminSupabase
        .from('class_members')
        .delete()
        .eq('user_id', user.id)
        .in('class_id', classIds);
    }

    // 4. Xóa bản ghi thành viên khỏi user_organizations (Lịch sử bài nộp kiểm định vẫn được bảo lưu)
    const { error: deleteError } = await adminSupabase
      .from('user_organizations')
      .delete()
      .eq('id', membership.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Không thể rời tổ chức: ' + deleteError.message },
        { status: 500 }
      );
    }

    // 5. Ghi log kiểm toán
    recordAdminAudit({
      actorId: user.id,
      adminEmail: user.email || undefined,
      action: 'ORG_MEMBER_SELF_LEFT',
      targetType: 'user_organization',
      targetId: membership.id,
      details: {
        organization_id: orgId,
        user_id: user.id,
        role: membership.org_role,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Bạn đã rời khỏi tổ chức thành công. Dữ liệu bài thi lịch sử được lưu trữ bảo mật.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
