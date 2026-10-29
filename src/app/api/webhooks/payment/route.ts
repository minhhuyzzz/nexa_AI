import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PaymentVerifierService } from '@/features/billing/services/payment-verifier.service';

// Zod Schema bắt buộc đối soát thanh toán an toàn
const paymentWebhookPayloadSchema = z
  .object({
    // Mã tham chiếu / nội dung chuyển khoản
    referenceCode: z.string().optional(),
    content: z.string().optional(),
    description: z.string().optional(),
    code: z.string().optional(),

    // Số tiền thực nhận (bắt buộc > 0)
    transferAmount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),
    creditAmount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),
    amountIn: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),

    // Đơn vị tiền tệ
    currency: z.string().optional().default('VND'),

    // Cổng thanh toán hoặc ngân hàng
    gateway: z.string().optional(),
    bank: z.string().optional(),

    // Trạng thái giao dịch (nếu gateway có gửi, phải là trạng thái thành công)
    status: z.string().optional(),
    provider_tx_id: z.union([z.string(), z.number()]).optional(),
    transactionId: z.union([z.string(), z.number()]).optional(),
    id: z.union([z.string(), z.number()]).optional(),
  })
  .refine(
    (data) => {
      const rawAmt = data.transferAmount ?? data.amount ?? data.creditAmount ?? data.amountIn;
      return rawAmt !== undefined && rawAmt !== null && Number(rawAmt) > 0;
    },
    {
      message: 'Bắt buộc phải có số tiền thực nhận hợp lệ (> 0)',
      path: ['amount'],
    }
  )
  .refine(
    (data) => {
      if (data.status) {
        const s = String(data.status).toUpperCase();
        return ['PAID', 'SUCCESS', 'COMPLETED', 'PROCESSED'].includes(s);
      }
      return true;
    },
    {
      message: 'Trạng thái giao dịch không hợp lệ hoặc chưa hoàn tất thanh toán',
      path: ['status'],
    }
  );

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    // Fail-closed webhook security: từ chối xử lý nếu chưa cấu hình secret
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

    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json(
        { error: 'Bad Request: Webhook body không đúng định dạng JSON' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra cấu trúc dữ liệu với Zod Schema
    const parseResult = paymentWebhookPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu webhook không hợp lệ',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    // 2. Tìm mã đối soát NEXA (định dạng NEXAxxxxxx)
    let refCode: string | null = null;
    const candidates = [validated.referenceCode, validated.content, validated.description, validated.code];
    for (const item of candidates) {
      if (item) {
        const match = String(item).match(/(NEXA\d{6})/i);
        if (match) {
          refCode = match[1].toUpperCase();
          break;
        }
      }
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

    // 3. Trích xuất số tiền bắt buộc
    const rawAmount = validated.transferAmount ?? validated.amount ?? validated.creditAmount ?? validated.amountIn;
    const incomingAmount = Number(rawAmount);

    const provider = validated.gateway || validated.bank || 'SEPAY_WEBHOOK';

    // 4. Thực hiện đối soát thanh toán an toàn
    const result = await PaymentVerifierService.fulfillByReference(
      refCode,
      rawBody,
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
