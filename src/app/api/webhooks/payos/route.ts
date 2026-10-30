import { NextRequest, NextResponse } from 'next/server';
import { getPayOSClient } from '@/lib/payos/payos-client';
import { PaymentVerifierService } from '@/features/billing/services/payment-verifier.service';
import type { Webhook } from '@payos/node';

export async function POST(request: NextRequest) {
  try {
    const payOS = getPayOSClient();
    if (!payOS) {
      return NextResponse.json(
        { error: 'Cổng thanh toán payOS chưa được cấu hình Client ID, API Key hoặc Checksum Key' },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as Webhook | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Webhook body không đúng định dạng JSON' }, { status: 400 });
    }

    // 1. Verify webhook signature via payOS SDK
    let webhookData;
    try {
      webhookData = await payOS.webhooks.verify(body);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chữ ký webhook payOS không hợp lệ';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 2. Handle payOS Test Webhook when confirming webhook URL in payOS Dashboard
    if (
      webhookData.orderCode === 123 ||
      String(webhookData.description || '').toLowerCase().includes('test')
    ) {
      return NextResponse.json({
        success: true,
        message: 'payOS Webhook confirmation ping received successfully',
      });
    }

    // 3. Fulfill transaction when code is '00' (successful payment)
    if (webhookData.code === '00') {
      const result = await PaymentVerifierService.fulfillByReference(
        String(webhookData.orderCode),
        body as unknown as Record<string, unknown>,
        'PAYOS',
        Number(webhookData.amount)
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 422 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Đối soát thanh toán payOS thành công và đã nâng cấp gói',
        orderCode: webhookData.orderCode,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã nhận webhook, bỏ qua trạng thái không phải hoàn tất (code: ${webhookData.code})`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
