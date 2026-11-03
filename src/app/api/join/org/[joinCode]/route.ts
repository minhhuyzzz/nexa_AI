import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const submitJoinSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100),
  studentId: z.string().trim().max(50).optional().default(''),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ joinCode: string }> }
) {
  try {
    const { joinCode } = await params;
    const cleanCode = (joinCode || '').trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ valid: false, error: 'Thiếu mã tham gia' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Query join code
    const { data: codeRow, error: codeErr } = await adminSupabase
      .from('organization_join_codes')
      .select(`
        id,
        code,
        title,
        max_uses,
        used_count,
        expires_at,
        is_revoked,
        organization_id,
        organizations (
          id,
          name,
          code,
          type,
          status,
          is_active
        )
      `)
      .eq('code', cleanCode)
      .maybeSingle();

    let targetOrg: any = null;
    let targetJoinCode: any = null;

    if (codeRow && !codeErr) {
      if (codeRow.is_revoked) {
        return NextResponse.json(
          { valid: false, error: 'Mã tham gia này đã bị thu hồi bởi quản trị viên tổ chức.' },
          { status: 400 }
        );
      }

      if (new Date(codeRow.expires_at) < new Date()) {
        return NextResponse.json(
          { valid: false, error: 'Mã tham gia này đã hết thời hạn hiệu lực.' },
          { status: 400 }
        );
      }

      if (codeRow.used_count >= codeRow.max_uses) {
        return NextResponse.json(
          { valid: false, error: 'Mã tham gia này đã đạt giới hạn số lượng sử dụng tối đa.' },
          { status: 400 }
        );
      }

      targetOrg = codeRow.organizations as any;
      targetJoinCode = {
        id: codeRow.id,
        code: codeRow.code,
        title: codeRow.title || 'Đợt khảo thí & phát triển năng lực số',
        expiresAt: codeRow.expires_at,
      };
    } else {
      // Fallback: check if cleanCode matches an active organization code
      const { data: orgRow } = await adminSupabase
        .from('organizations')
        .select('id, name, code, slug, type, status, is_active')
        .eq('code', cleanCode)
        .maybeSingle();

      if (orgRow) {
        targetOrg = orgRow;
        targetJoinCode = {
          id: orgRow.id,
          code: orgRow.code || orgRow.slug || cleanCode,
          title: `Gia nhập tổ chức ${orgRow.name}`,
          expiresAt: null,
        };
      }
    }

    if (!targetOrg) {
      return NextResponse.json(
        { valid: false, error: 'Mã tham gia không tồn tại trong hệ thống.' },
        { status: 404 }
      );
    }

    if (targetOrg.is_active === false || (targetOrg.status && targetOrg.status !== 'ACTIVE')) {
      return NextResponse.json(
        { valid: false, error: 'Tổ chức này hiện đang tạm khóa hoặc không hoạt động.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      joinCode: targetJoinCode,
      organization: {
        id: targetOrg.id,
        name: targetOrg.name,
        code: targetOrg.code || targetOrg.slug || '',
        type: targetOrg.type || 'ENTERPRISE',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ joinCode: string }> }
) {
  try {
    const { joinCode } = await params;
    const cleanCode = (joinCode || '').trim().toUpperCase();

    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập tài khoản NEXA để gửi yêu cầu gia nhập tổ chức.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = submitJoinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { fullName, studentId } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Verify join code or organization code
    const { data: codeRow, error: codeErr } = await adminSupabase
      .from('organization_join_codes')
      .select('id, code, organization_id, max_uses, used_count, expires_at, is_revoked')
      .eq('code', cleanCode)
      .maybeSingle();

    let orgId: string;
    let joinCodeId: string | null = null;

    if (codeRow && !codeErr) {
      if (codeRow.is_revoked) {
        return NextResponse.json({ error: 'Mã tham gia này đã bị thu hồi' }, { status: 400 });
      }

      if (new Date(codeRow.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Mã tham gia này đã hết hạn hiệu lực' }, { status: 400 });
      }

      if (codeRow.used_count >= codeRow.max_uses) {
        return NextResponse.json({ error: 'Mã tham gia đã đạt tối đa lượt đăng ký' }, { status: 400 });
      }

      orgId = codeRow.organization_id;
      joinCodeId = codeRow.id;
    } else {
      // Fallback: check if cleanCode matches an active organization's code
      const { data: orgRow } = await adminSupabase
        .from('organizations')
        .select('id, name, code, slug, status, is_active')
        .eq('code', cleanCode)
        .maybeSingle();

      if (!orgRow || orgRow.is_active === false || (orgRow.status && orgRow.status !== 'ACTIVE')) {
        return NextResponse.json({ error: 'Mã tham gia không tồn tại trong hệ thống' }, { status: 404 });
      }

      orgId = orgRow.id;
      joinCodeId = null;
    }

    // 2. Check if user is already an active member
    const { data: existingMember } = await adminSupabase
      .from('user_organizations')
      .select('id, status, org_role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember && existingMember.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Bạn đã là thành viên chính thức của tổ chức này.' },
        { status: 400 }
      );
    }

    // 3. Check if user already submitted a request
    const { data: existingRequest } = await adminSupabase
      .from('organization_membership_requests')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Yêu cầu tham gia của bạn đang chờ quản trị viên phê duyệt.' },
          { status: 400 }
        );
      }
      if (existingRequest.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'Yêu cầu tham gia của bạn đã được phê duyệt trước đó.' },
          { status: 400 }
        );
      }
    }

    // 4. Create membership request
    const { data: requestRow, error: reqErr } = await adminSupabase
      .from('organization_membership_requests')
      .upsert(
        {
          organization_id: orgId,
          user_id: user.id,
          join_code_id: joinCodeId,
          full_name: fullName,
          email: user.email || '',
          student_id: studentId || null,
          status: 'PENDING',
        },
        { onConflict: 'organization_id,user_id' }
      )
      .select()
      .single();

    if (reqErr) {
      return NextResponse.json({ error: reqErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Yêu cầu tham gia tổ chức đã được gửi thành công. Vui lòng chờ quản trị viên xét duyệt.',
      request: requestRow,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
