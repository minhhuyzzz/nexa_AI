import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CouponService } from '@/features/billing/services/coupon.service';

const checkCouponSchema = z.object({
  code: z.string().min(1, 'Mã không được để trống'),
  amount: z.number().min(0, 'Số tiền không hợp lệ'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = checkCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { code, amount } = parsed.data;
    const result = await CouponService.validate(code, amount);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
