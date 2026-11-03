import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export const dynamic = 'force-dynamic';

const createRenewalSchema = z.object({
  periodMonths: z.number().int().refine((val) => [1, 3, 6, 12, 24, 36].includes(val), {
    message: 'Kỳ hạn gia hạn phải là 1, 3, 6, 12, 24 hoặc 36 tháng',
  }).default(12),
  requestedSeats: z.number().int().positive().optional().nullable(),
  requestedCredits: z.number().int().min(0).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

async function checkOrgAdminPermission(userId: string, email: string | undefined, orgId: string) {
  if (isSuperadminEmail(email)) {
    return { isAllowed: true, isSuperadmin: true };
  }

  const adminSupabase = createAdminClient();
  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!member) return { isAllowed: false, isSuperadmin: false };
  const isManager = ['ORG_OWNER', 'ORG_ADMIN'].includes(member.org_role);
  return { isAllowed: isManager, role: member.org_role, isSuperadmin: false };
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

    const { isAllowed } = await checkOrgAdminPermission(user.id, user.email, orgId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên tổ chức mới có quyền xem thông tin gia hạn' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: requests, error } = await adminSupabase
      .from('renewal_requests')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const pendingRequest = (requests || []).find((r) => r.status === 'PENDING') || null;

    return NextResponse.json({
      success: true,
      renewalRequests: requests || [],
      pendingRequest,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
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
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { isAllowed } = await checkOrgAdminPermission(user.id, user.email, orgId);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên tổ chức mới có quyền yêu cầu gia hạn' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createRenewalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { periodMonths, requestedSeats, requestedCredits, notes } = validation.data;
    const adminSupabase = createAdminClient();

    // Chặn gửi trùng nếu đang có yêu cầu PENDING
    const { data: existingPending } = await adminSupabase
      .from('renewal_requests')
      .select('id, created_at')
      .eq('organization_id', orgId)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json(
        { error: 'Tổ chức của bạn đang có một yêu cầu gia hạn đang chờ NEXA xác nhận.' },
        { status: 409 }
      );
    }

    const { data: newRequest, error: insertError } = await adminSupabase
      .from('renewal_requests')
      .insert({
        organization_id: orgId,
        requested_by: user.id,
        period_months: periodMonths,
        requested_seats: requestedSeats || null,
        requested_credits: requestedCredits || null,
        notes: notes || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi yêu cầu gia hạn thành công. Ban điều phối NEXA sẽ xác nhận và cập nhật thời hạn.',
      renewalRequest: newRequest,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
