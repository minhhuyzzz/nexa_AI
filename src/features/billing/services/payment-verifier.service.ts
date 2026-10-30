import { createAdminClient } from '@/lib/supabase/admin';
import { getPayOSClient } from '@/lib/payos/payos-client';

export interface PaymentIntentResult {
  transactionId: string;
  referenceCode: string;
  amount: number;
  currency: string;
  planCode: string;
  planName: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  qrCodeUrl: string;
  transferContent: string;
  checkoutUrl?: string;
  orderCode?: number;
  paymentLinkId?: string;
}

export class PaymentVerifierService {
  /**
   * Tạo phiên thanh toán nâng cấp gói dịch vụ với mã đối soát giao dịch duy nhất
   * Áp dụng nguyên tắc Fail-Closed: bắt buộc phải có cổng payOS hợp lệ để bảo đảm
   * việc đối soát và kích hoạt quyền lợi diễn ra hoàn toàn tự động, minh bạch.
   */
  static async createPaymentIntent(
    userId: string,
    planCode: string,
    organizationId?: string | null
  ): Promise<PaymentIntentResult> {
    const adminSupabase = createAdminClient();

    // 1. Fetch plan
    const { data: plan, error: planErr } = await adminSupabase
      .from('service_plans')
      .select('*')
      .eq('code', planCode)
      .single();

    if (planErr || !plan) {
      throw new Error(`Gói dịch vụ '${planCode}' không tồn tại hoặc đã ngừng cung cấp`);
    }

    if (plan.price_vnd <= 0) {
      throw new Error('Gói miễn phí không cần thanh toán');
    }

    // 2. Generate unique numeric orderCode for payOS (positive safe integer)
    const orderCode = Number(String(Date.now()).slice(-6) + String(Math.floor(100 + Math.random() * 900)));
    const idempotencyKey = `idemp_${userId}_${planCode}_${Date.now()}`;

    // 3. payOS Gateway - Fail-Closed: Bắt buộc cấu hình cổng thanh toán tự động
    const payOS = getPayOSClient();
    if (!payOS) {
      throw new Error(
        'Cổng thanh toán tự động payOS hiện chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị viên.'
      );
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const payosResponse = await payOS.paymentRequests.create({
        orderCode,
        amount: Number(plan.price_vnd),
        description: `NEXA ${orderCode}`.slice(0, 25),
        returnUrl: `${appUrl}/personal/billing/result?orderCode=${orderCode}&status=success`,
        cancelUrl: `${appUrl}/personal/billing/result?orderCode=${orderCode}&status=cancelled`,
        items: [
          {
            name: plan.name,
            quantity: 1,
            price: Number(plan.price_vnd),
          },
        ],
      });

      const { data: tx, error: txErr } = await adminSupabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          organization_id: organizationId || null,
          plan_id: plan.id,
          plan_code: plan.code,
          amount: plan.price_vnd,
          currency: 'VND',
          provider: 'PAYOS',
          transaction_reference: String(orderCode),
          idempotency_key: idempotencyKey,
          status: 'PENDING',
          raw_payload: payosResponse,
        })
        .select('id')
        .single();

      if (txErr || !tx) {
        throw new Error(`Không thể khởi tạo giao dịch payOS: ${txErr?.message}`);
      }

      return {
        transactionId: tx.id,
        referenceCode: String(orderCode),
        orderCode,
        amount: Number(plan.price_vnd),
        currency: 'VND',
        planCode: plan.code,
        planName: plan.name,
        accountNumber: payosResponse.accountNumber,
        bankName: payosResponse.bin ? `Ngân hàng (BIN: ${payosResponse.bin})` : 'VietQR payOS',
        accountName: payosResponse.accountName,
        qrCodeUrl: payosResponse.qrCode,
        transferContent: payosResponse.description,
        checkoutUrl: payosResponse.checkoutUrl,
        paymentLinkId: payosResponse.paymentLinkId,
      };
    } catch (payosErr) {
      const msg = payosErr instanceof Error ? payosErr.message : 'Lỗi kết nối cổng thanh toán';
      throw new Error(`Không thể khởi tạo phiên thanh toán payOS: ${msg}`);
    }
  }

  /**
   * Xác thực và hoàn tất giao dịch thanh toán phía máy chủ (Fail-closed & Bắt buộc đối soát số tiền)
   */
  static async fulfillByReference(
    referenceCode: string,
    rawPayload: Record<string, unknown> = {},
    providerRef: string = 'WEBHOOK_AUTOMATED',
    incomingAmount?: number
  ) {
    const adminSupabase = createAdminClient();

    // 1. Fail-closed: Bắt buộc phải có số tiền thực nhận (incomingAmount) hợp lệ
    if (incomingAmount === undefined || incomingAmount === null || isNaN(Number(incomingAmount)) || Number(incomingAmount) <= 0) {
      return {
        success: false,
        error: 'Thiếu hoặc sai lệch thông tin số tiền thực nhận (incomingAmount). Giao dịch bị từ chối đối soát.',
      };
    }

    // 2. Tìm kiếm giao dịch theo referenceCode trong nội dung chuyển khoản
    let tx: { id: string; status: string; plan_code: string; user_id: string; amount: number; currency: string } | null = null;

    const firstLookup = await adminSupabase
      .from('payment_transactions')
      .select('id, status, plan_code, user_id, amount, currency')
      .eq('transaction_reference', referenceCode)
      .single();

    if (firstLookup.data) {
      tx = firstLookup.data;
    } else {
      const cleanRef = referenceCode.trim();
      const altRef = cleanRef.startsWith('NEXA') ? cleanRef.replace(/^NEXA/i, '') : `NEXA${cleanRef}`;
      const secondLookup = await adminSupabase
        .from('payment_transactions')
        .select('id, status, plan_code, user_id, amount, currency')
        .eq('transaction_reference', altRef)
        .single();
      if (secondLookup.data) {
        tx = secondLookup.data;
      }
    }

    if (!tx) {
      return { success: false, error: `Không tìm thấy giao dịch với mã '${referenceCode}'` };
    }

    if (tx.status === 'SUCCESS') {
      return { success: true, message: 'Giao dịch đã được kích hoạt trước đó', alreadyFulfilled: true };
    }

    if (tx.status !== 'PENDING') {
      return { success: false, error: `Giao dịch đang ở trạng thái '${tx.status}', không thể xử lý` };
    }

    // 3. Đối soát số tiền bắt buộc: số tiền thực nhận không được nhỏ hơn giá trị đơn hàng
    const expectedAmount = Number(tx.amount);
    if (Number(incomingAmount) < expectedAmount) {
      return {
        success: false,
        error: `Số tiền thanh toán (${incomingAmount} VND) không đủ với giá trị gói (${expectedAmount} VND)`,
      };
    }

    // 4. Kích hoạt atomic DB RPC (thông qua service_role admin client)
    const { data: rpcResult, error: rpcErr } = await adminSupabase.rpc(
      'fulfill_payment_transaction',
      {
        p_transaction_id: tx.id,
        p_provider_ref: providerRef,
        p_raw_payload: rawPayload,
      }
    );

    if (rpcErr) {
      return { success: false, error: rpcErr.message };
    }

    return { success: true, result: rpcResult };
  }

  /**
   * Kiểm tra trạng thái giao dịch theo ID hoặc orderCode / mã tham chiếu,
   * đồng thời tái cấu trúc đầy đủ thông tin thanh toán (QR code, tài khoản, số tiền)
   */
  static async getTransactionStatus(identifier: string, userId: string) {
    const adminSupabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    interface TxRecord {
      id: string;
      transaction_reference: string;
      plan_code: string;
      amount: number;
      currency?: string;
      provider?: string;
      raw_payload?: Record<string, unknown> | null;
      status: string;
      verified_at?: string | null;
      created_at: string;
    }

    let tx: TxRecord | null = null;

    if (isUuid) {
      const { data, error } = await adminSupabase
        .from('payment_transactions')
        .select('id, transaction_reference, plan_code, amount, currency, provider, raw_payload, status, verified_at, created_at')
        .eq('id', identifier)
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) tx = data as TxRecord;
    }

    if (!tx) {
      const cleanId = identifier.trim();
      const altId = cleanId.startsWith('NEXA') ? cleanId.replace(/^NEXA/i, '') : `NEXA${cleanId}`;

      const { data, error } = await adminSupabase
        .from('payment_transactions')
        .select('id, transaction_reference, plan_code, amount, currency, provider, raw_payload, status, verified_at, created_at')
        .or(`transaction_reference.eq.${cleanId},transaction_reference.eq.${altId}`)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) tx = data as TxRecord;
    }

    if (!tx) {
      return null;
    }

    const { data: plan } = await adminSupabase
      .from('service_plans')
      .select('name')
      .eq('code', tx.plan_code)
      .maybeSingle();

    const planName = plan?.name || tx.plan_code;

    let qrCodeUrl = '';
    let accountNumber = '';
    let accountName = '';
    let bankName = '';
    let transferContent = tx.transaction_reference;
    let checkoutUrl: string | undefined = undefined;

    if (tx.provider === 'PAYOS' && tx.raw_payload) {
      const payload = tx.raw_payload as Record<string, unknown>;
      qrCodeUrl = typeof payload.qrCode === 'string' ? payload.qrCode : '';
      accountNumber = typeof payload.accountNumber === 'string' ? payload.accountNumber : '';
      accountName = typeof payload.accountName === 'string' ? payload.accountName : '';
      bankName = payload.bin ? `Ngân hàng (BIN: ${payload.bin})` : 'VietQR payOS';
      transferContent = typeof payload.description === 'string' ? payload.description : tx.transaction_reference;
      checkoutUrl = typeof payload.checkoutUrl === 'string' ? payload.checkoutUrl : undefined;
    } else {
      transferContent = tx.transaction_reference;
    }

    return {
      id: tx.id,
      transactionId: tx.id,
      referenceCode: tx.transaction_reference,
      orderCode: isNaN(Number(tx.transaction_reference)) ? undefined : Number(tx.transaction_reference),
      amount: Number(tx.amount),
      currency: tx.currency || 'VND',
      planCode: tx.plan_code,
      planName,
      status: tx.status,
      verifiedAt: tx.verified_at,
      createdAt: tx.created_at,
      accountNumber,
      accountName,
      bankName,
      qrCodeUrl,
      transferContent,
      checkoutUrl,
    };
  }
}
