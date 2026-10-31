import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth/superadmin';
import { PaymentVerifierService } from '@/features/billing/services/payment-verifier.service';

const createIntentSchema = z.object({
  planCode: z.string().min(2, 'Mã gói dịch vụ không hợp lệ'),
  organizationId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createIntentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { planCode, organizationId } = validation.data;

    // ADM-03: Chặn thanh toán tự phục vụ cho gói tổ chức/doanh nghiệp
    const upperPlan = planCode.toUpperCase();
    if (upperPlan.includes('BUSINESS') || upperPlan.includes('ENTERPRISE') || upperPlan.startsWith('ORG_')) {
      return NextResponse.json(
        {
          error: 'Gói tổ chức & doanh nghiệp (Business/Enterprise) không hỗ trợ thanh toán tự phục vụ qua cổng cá nhân. Vui lòng gửi yêu cầu tư vấn tại trang Bảng giá (/pricing) để được cấp hợp đồng và hạn mức chính thức.',
        },
        { status: 400 }
      );
    }

    // Verify organization authority if billing for an organization
    if (organizationId) {
      const isSuperadmin = isSuperadminEmail(user.email);
      if (!isSuperadmin) {
        const { data: membership, error: memErr } = await supabase
          .from('user_organizations')
          .select('org_role, status')
          .eq('organization_id', organizationId)
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (memErr || !membership || !['ORG_OWNER', 'ORG_ADMIN'].includes(membership.org_role)) {
          return NextResponse.json(
            { error: 'Bạn không có quyền quản trị tổ chức này để thực hiện thanh toán nâng cấp' },
            { status: 403 }
          );
        }
      }
    }

    const intent = await PaymentVerifierService.createPaymentIntent(
      user.id,
      planCode,
      organizationId
    );

    return NextResponse.json({
      success: true,
      intent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
