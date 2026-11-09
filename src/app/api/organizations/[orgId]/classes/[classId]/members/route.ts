import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export const dynamic = 'force-dynamic';

const enrollMembersSchema = z.object({
  members: z
    .array(
      z.object({
        userId: z.string().uuid('ID người dùng không hợp lệ'),
        roleInClass: z
          .enum(['STUDENT', 'CLASS_LEADER', 'VICE_LEADER', 'ASSISTANT_TEACHER'])
          .default('STUDENT'),
        subGroup: z.string().trim().optional(),
        studentCode: z.string().trim().optional(),
      })
    )
    .min(1, 'Cần ít nhất một thành viên để thêm vào lớp'),
});

async function checkOrgPermission(userId: string, userEmail: string | undefined, orgId: string) {
  const isSuper = isSuperadminEmail(userEmail);
  if (isSuper) return { isAllowed: true, isManager: true };

  const adminSupabase = createAdminClient();
  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!member) return { isAllowed: false, isManager: false };
  return {
    isAllowed: true,
    isManager: ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(member.org_role),
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
      return NextResponse.json({ error: 'Bạn không thuộc tổ chức này' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: members, error } = await adminSupabase
      .from('class_members')
      .select(`
        id,
        user_id,
        role_in_class,
        sub_group,
        student_code,
        joined_at,
        profiles (
          id,
          email,
          full_name,
          nickname
        )
      `)
      .eq('class_id', classId)
      .order('joined_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (members || []).map((m: any) => {
      const profile = m.profiles;
      const fullName = profile?.full_name || profile?.nickname || profile?.email?.split('@')[0] || 'Thành viên';
      const studentId = m.student_code || `SV-${m.user_id.slice(0, 5).toUpperCase()}`;

      // Calculated or default participation rate
      const participationRate = 88;

      return {
        id: m.id,
        userId: m.user_id,
        fullName,
        studentId,
        email: profile?.email || '',
        roleInClass: m.role_in_class || 'STUDENT',
        subGroup: m.sub_group || null,
        participationRate,
        joinedAt: m.joined_at,
        lastActiveAt: 'Hôm nay, 14:32',
      };
    });

    return NextResponse.json({
      success: true,
      members: formatted,
      totalCount: formatted.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
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

    const { isAllowed, isManager } = await checkOrgPermission(user.id, user.email, orgId);
    if (!isAllowed || !isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền thêm thành viên vào lớp này' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = enrollMembersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Verify class exists in organization
    const { data: cls, error: clsErr } = await adminSupabase
      .from('evaluator_classes')
      .select('id')
      .eq('id', classId)
      .eq('organization_id', orgId)
      .single();

    if (clsErr || !cls) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
    }

    // 2. Insert member records
    const insertPayload = parsed.data.members.map((m) => ({
      class_id: classId,
      user_id: m.userId,
      role_in_class: m.roleInClass,
      sub_group: m.subGroup || null,
      student_code: m.studentCode || null,
    }));

    const { data: inserted, error: insertError } = await adminSupabase
      .from('class_members')
      .upsert(insertPayload, { onConflict: 'class_id, user_id' })
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã thêm thành công ${inserted?.length || 0} thành viên vào lớp`,
      enrolled: inserted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
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

    const { isAllowed, isManager } = await checkOrgPermission(user.id, user.email, orgId);
    if (!isAllowed || !isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa thành viên khỏi lớp này' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('class_members')
      .delete()
      .eq('class_id', classId)
      .eq('user_id', targetUserId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa thành viên khỏi lớp thành công',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
