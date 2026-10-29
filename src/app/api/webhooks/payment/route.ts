import { NextRequest, NextResponse } from 'next/server';
import { PaymentVerifierService } from '@/features/billing/services/payment-verifier.service';

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    // Fail-closed webhook security: reject if not configured
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Dịch vụ webhook thanh toán chưa được cấu hình (PAYMENT_WEBHOOK_SECRET)' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('x-webhook-secret');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: Thiếu header xác thực webhook' },
        { status: 401 }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token !== webhookSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Sai mã bí mật webhook' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Find reference code matching NEXA\d{6}
    let refCode: string | null = null;

    if (body.referenceCode && /^NEXA\d{6}$/i.test(body.referenceCode)) {
      refCode = body.referenceCode.toUpperCase();
    } else if (body.content) {
      const match = String(body.content).match(/(NEXA\d{6})/i);
      if (match) refCode = match[1].toUpperCase();
    } else if (body.description) {
      const match = String(body.description).match(/(NEXA\d{6})/i);
      if (match) refCode = match[1].toUpperCase();
    } else if (body.code) {
      const match = String(body.code).match(/(NEXA\d{6})/i);
      if (match) refCode = match[1].toUpperCase();
    }

    if (!refCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không tìm thấy mã đối soát NEXA (định dạng NEXAxxxxxx) trong nội dung chuyển khoản',
        },
        { status: 400 }
      );
    }

    // Extract incoming transfer amount if provided by payment gateway
    const rawAmount =
      body.transferAmount ??
      body.amount ??
      body.creditAmount ??
      body.amountIn;
    const incomingAmount =
      typeof rawAmount === 'number'
        ? rawAmount
        : typeof rawAmount === 'string' && !isNaN(Number(rawAmount))
        ? Number(rawAmount)
        : undefined;

    const provider = body.gateway || body.bank || 'SEPAY_WEBHOOK';
    const result = await PaymentVerifierService.fulfillByReference(
      refCode,
      body,
      provider,
      incomingAmount
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đối soát và nâng cấp gói thành công',
      referenceCode: refCode,
      data: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
