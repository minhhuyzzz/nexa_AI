import { createAdminClient } from '@/lib/supabase/admin';

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
}

export class PaymentVerifierService {
  private static readonly BANK_ID = 'MB'; // MBBank
  private static readonly ACCOUNT_NO = '0901234567';
  private static readonly ACCOUNT_NAME = 'CONG TY CP CONG NGHE NEXA';

  /**
   * Tạo phiên thanh toán nâng cấp gói dịch vụ với mã đối soát giao dịch duy nhất
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

    // 2. Generate unique reference code & idempotency key
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const referenceCode = `NEXA${randomSuffix}`;
    const idempotencyKey = `idemp_${userId}_${planCode}_${Date.now()}`;

    // 3. Create pending payment transaction
    const { data: tx, error: txErr } = await adminSupabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        organization_id: organizationId || null,
        plan_id: plan.id,
        plan_code: plan.code,
        amount: plan.price_vnd,
        currency: 'VND',
        provider: 'VIETQR',
        transaction_reference: referenceCode,
        idempotency_key: idempotencyKey,
        status: 'PENDING',
      })
      .select('id')
      .single();

    if (txErr || !tx) {
      throw new Error(`Không thể khởi tạo giao dịch: ${txErr?.message}`);
    }

    const transferContent = referenceCode;
    const qrCodeUrl = `https://img.vietqr.io/image/${this.BANK_ID}-${this.ACCOUNT_NO}-compact2.png?amount=${plan.price_vnd}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(this.ACCOUNT_NAME)}`;

    return {
      transactionId: tx.id,
      referenceCode,
      amount: plan.price_vnd,
      currency: 'VND',
      planCode: plan.code,
      planName: plan.name,
      accountNumber: this.ACCOUNT_NO,
      bankName: 'MBBank (Ngân hàng Quân Đội)',
      accountName: this.ACCOUNT_NAME,
      qrCodeUrl,
      transferContent,
    };
  }

  /**
   * Xác thực và hoàn tất giao dịch thanh toán phía máy chủ
   */
  static async fulfillByReference(
    referenceCode: string,
    rawPayload: Record<string, unknown> = {},
    providerRef: string = 'WEBHOOK_AUTOMATED'
  ) {
    const adminSupabase = createAdminClient();

    // 1. Find transaction by reference code in transfer content
    const { data: tx, error: findErr } = await adminSupabase
      .from('payment_transactions')
      .select('id, status, plan_code, user_id')
      .eq('transaction_reference', referenceCode)
      .single();

    if (findErr || !tx) {
      return { success: false, error: `Không tìm thấy giao dịch với mã '${referenceCode}'` };
    }

    if (tx.status === 'SUCCESS') {
      return { success: true, message: 'Giao dịch đã được kích hoạt trước đó', alreadyFulfilled: true };
    }

    // 2. Call atomic DB RPC
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
   * Kiểm tra trạng thái giao dịch
   */
  static async getTransactionStatus(transactionId: string, userId: string) {
    const adminSupabase = createAdminClient();

    const { data: tx, error } = await adminSupabase
      .from('payment_transactions')
      .select('id, transaction_reference, plan_code, amount, status, verified_at, created_at')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error || !tx) {
      return null;
    }

    return tx;
  }
}
