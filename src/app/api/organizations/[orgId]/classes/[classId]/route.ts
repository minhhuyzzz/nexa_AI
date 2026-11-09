import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';
import { normalizeOrgRole } from '@/lib/auth/org-guard';

export const dynamic = 'force-dynamic';

const updateOrgClassSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  classCode: z.string().trim().max(20).optional(),
  groupType: z.enum(['CLASS', 'DEPARTMENT', 'PROJECT_GROUP']).optional(),
  status: z.enum(['ACTIVE', 'UPCOMING', 'ARCHIVED']).optional(),
  description: z.string().trim().optional().nullable(),
  term: z.string().trim().optional().nullable(),
  instructorId: z.string().uuid().optional().nullable(),
  instructorName: z.string().trim().optional().nullable(),
  maxCapacity: z.number().int().min(1).max(2000).optional(),
  settings: z.record(z.any()).optional(),
});

async function checkOrgPermission(userId: string, userEmail: string | undefined, orgId: string) {
  const isSuper = isSuperadminEmail(userEmail);
  if (isSuper) {
    return {
      isAllowed: true,
      role: 'ORG_OWNER',
      normalizedRole: 'ORG_OWNER',
      isOrgAdminOrOwner: true,
      isManager: true,
      isSuperadmin: true,
    };
  }

  const adminSupabase = createAdminClient();
  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!member) {
    return {
      isAllowed: false,
      role: null,
      normalizedRole: null,
      isOrgAdminOrOwner: false,
      isManager: false,
      isSuperadmin: false,
    };
  }

  const normalizedRole = normalizeOrgRole(member.org_role);
  const isOrgAdminOrOwner = normalizedRole === 'ORG_OWNER' || normalizedRole === 'ORG_ADMIN';

  return {
    isAllowed: true,
    role: member.org_role,
    normalizedRole,
    isOrgAdminOrOwner,
    isManager: isOrgAdminOrOwner || normalizedRole === 'ASSESSOR',
    isSuperadmin: false,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; classId: string }> }
) {
  try {
    const { orgId, classId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { isAllowed } = await checkOrgPermission(user.id, user.email, orgId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Bạn không có quyền truy cập tổ chức này' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: cls, error: clsError } = await adminSupabase
      .from('evaluator_classes')
      .select(`
        id,
        name,
        class_code,
        description,
        group_type,
        status,
        term,
        instructor_id,
        instructor_name,
        max_capacity,
        settings,
        created_at
      `)
      .eq('id', classId)
      .eq('organization_id', orgId)
      .single();

    if (clsError || !cls) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
    }

    // Get count of members
    const { count: membersCount } = await adminSupabase
      .from('class_members')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId);

    // Get count of assignments
    const { count: assignmentsCount } = await adminSupabase
      .from('class_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId);

    return NextResponse.json({
      success: true,
      class: {
        ...cls,
        membersCount: membersCount || 0,
        assignmentsCount: assignmentsCount || 0,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; classId: string }> }
) {
  try {
    const { orgId, classId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const perm = await checkOrgPermission(user.id, user.email, orgId);
    if (!perm.isAllowed || !perm.isManager) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa lớp học này' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: existingClass, error: fetchError } = await adminSupabase
      .from('evaluator_classes')
      .select('instructor_id, evaluator_id')
      .eq('id', classId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (fetchError || !existingClass) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
    }

    const isOrgAdminOrOwner = perm.isSuperadmin || perm.isOrgAdminOrOwner;
    if (
      !isOrgAdminOrOwner &&
      existingClass.instructor_id !== user.id &&
      existingClass.evaluator_id !== user.id
    ) {
      return NextResponse.json(
        { error: 'Bạn chỉ có thể chỉnh sửa lớp học được phân công' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateOrgClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.classCode !== undefined) updateData.class_code = parsed.data.classCode;
    if (parsed.data.groupType !== undefined) updateData.group_type = parsed.data.groupType;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.term !== undefined) updateData.term = parsed.data.term;
    if (parsed.data.instructorId !== undefined) updateData.instructor_id = parsed.data.instructorId;
    if (parsed.data.instructorName !== undefined) updateData.instructor_name = parsed.data.instructorName;
    if (parsed.data.maxCapacity !== undefined) updateData.max_capacity = parsed.data.maxCapacity;
    if (parsed.data.settings !== undefined) updateData.settings = parsed.data.settings;

    const { data: updated, error } = await adminSupabase
      .from('evaluator_classes')
      .update(updateData)
      .eq('id', classId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin lớp thành công',
      class: updated,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; classId: string }> }
) {
  try {
    const { orgId, classId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const perm = await checkOrgPermission(user.id, user.email, orgId);
    if (!perm.isAllowed || (!perm.isSuperadmin && !perm.isOrgAdminOrOwner)) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa lớp học này' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('evaluator_classes')
      .delete()
      .eq('id', classId)
      .eq('organization_id', orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa lớp thành công',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
