import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const submitRequestSchema = z.object({
  joinCode: z.string().trim().min(4, 'Mã tham gia không hợp lệ'),
  studentId: z.string().trim().max(50).optional(),
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
});

const reviewRequestSchema = z.object({
  requestId: z.string().uuid('ID yêu cầu không hợp lệ'),
  action: z.enum(['APPROVE', 'REJECT']),
});

async function checkOrgManager(userId: string, orgId: string) {
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'ADMIN') return true;

  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .single();

  return member && ['ORG_OWNER', 'ORG_ADMIN'].includes(member.org_role);
}

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

    const isManager = await checkOrgManager(user.id, orgId);
    if (!isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền quản lý hàng đợi phê duyệt của tổ chức này' },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: requests, error } = await adminSupabase
      .from('organization_membership_requests')
      .select(`
        id,
        user_id,
        student_id,
        full_name,
        email,
        status,
        created_at,
        reviewed_at,
        organization_join_codes ( code, title )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, requests: requests || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để gửi yêu cầu gia nhập tổ chức' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = submitRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { joinCode, studentId, fullName } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Verify join code
    const { data: codeRecord, error: codeErr } = await adminSupabase
      .from('organization_join_codes')
      .select('*')
      .eq('code', joinCode.toUpperCase().trim())
      .eq('organization_id', orgId)
      .single();

    if (codeErr || !codeRecord) {
      return NextResponse.json(
        { error: 'Mã tham gia không tồn tại hoặc không thuộc tổ chức này' },
        { status: 400 }
      );
    }

    if (codeRecord.is_revoked) {
      return NextResponse.json(
        { error: 'Mã tham gia này đã bị ban quản trị thu hồi' },
        { status: 400 }
      );
    }

    if (new Date(codeRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Mã tham gia này đã hết thời hạn sử dụng' },
        { status: 400 }
      );
    }

    if (codeRecord.used_count >= codeRecord.max_uses) {
      return NextResponse.json(
        { error: 'Mã tham gia đã đạt tối đa số lượt đăng ký' },
        { status: 400 }
      );
    }

    // 2. Check if already an active member
    const { data: existingMember } = await adminSupabase
      .from('user_organizations')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember && existingMember.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Bạn đã là thành viên chính thức của tổ chức này rồi' },
        { status: 400 }
      );
    }

    // 3. Upsert into organization_membership_requests
    const { data: savedRequest, error: reqError } = await adminSupabase
      .from('organization_membership_requests')
      .upsert(
        {
          organization_id: orgId,
          user_id: user.id,
          join_code_id: codeRecord.id,
          student_id: studentId || null,
          full_name: fullName.trim(),
          email: user.email || '',
          status: 'PENDING',
        },
        { onConflict: 'organization_id, user_id' }
      )
      .select()
      .single();

    if (reqError) {
      return NextResponse.json({ error: reqError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Yêu cầu gia nhập của bạn đã được gửi và đang chờ ban quản trị phê duyệt',
      request: savedRequest,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
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

    const isManager = await checkOrgManager(user.id, orgId);
    if (!isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền phê duyệt thành viên tổ chức này' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = reviewRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { requestId, action } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Fetch request record
    const { data: reqRecord, error: fetchErr } = await adminSupabase
      .from('organization_membership_requests')
      .select('*')
      .eq('id', requestId)
      .eq('organization_id', orgId)
      .single();

    if (fetchErr || !reqRecord) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu gia nhập' },
        { status: 404 }
      );
    }

    if (action === 'REJECT') {
      await adminSupabase
        .from('organization_membership_requests')
        .update({
          status: 'REJECTED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      return NextResponse.json({
        success: true,
        message: `Đã từ chối yêu cầu của ${reqRecord.full_name}`,
      });
    }

    // 2. Action === APPROVE: Check available seats
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('max_members')
      .eq('id', orgId)
      .single();

    const maxSeats = org?.max_members || 50;

    const { count: currentCount } = await adminSupabase
      .from('user_organizations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'ACTIVE');

    if (typeof currentCount === 'number' && currentCount >= maxSeats) {
      return NextResponse.json(
        {
          error: `Tổ chức đã đạt giới hạn tối đa ${maxSeats} ghế thành viên. Vui lòng nâng cấp hợp đồng trước khi duyệt thêm.`,
        },
        { status: 400 }
      );
    }

    // 3. Upsert user into user_organizations with strict MEMBER role (cannot self-escalate)
    const { error: upsertErr } = await adminSupabase
      .from('user_organizations')
      .upsert(
        {
          organization_id: orgId,
          user_id: reqRecord.user_id,
          org_role: 'MEMBER',
          status: 'ACTIVE',
        },
        { onConflict: 'user_id, organization_id' }
      );

    if (upsertErr) {
      return NextResponse.json(
        { error: 'Lỗi khi kích hoạt thành viên: ' + upsertErr.message },
        { status: 500 }
      );
    }

    // 4. Update request status to APPROVED
    await adminSupabase
      .from('organization_membership_requests')
      .update({
        status: 'APPROVED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // 5. Increment join code used_count if linked
    if (reqRecord.join_code_id) {
      const { data: jc } = await adminSupabase
        .from('organization_join_codes')
        .select('used_count')
        .eq('id', reqRecord.join_code_id)
        .single();

      if (jc) {
        await adminSupabase
          .from('organization_join_codes')
          .update({ used_count: (jc.used_count || 0) + 1 })
          .eq('id', reqRecord.join_code_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã phê duyệt thành công ${reqRecord.full_name} vào tổ chức với vai trò Thành viên.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
