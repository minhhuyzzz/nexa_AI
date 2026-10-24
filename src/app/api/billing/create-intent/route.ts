import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
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
