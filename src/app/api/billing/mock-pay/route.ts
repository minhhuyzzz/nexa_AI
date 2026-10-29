import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentVerifierService } from '@/features/billing/services/payment-verifier.service';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  // 1. Chặn hoàn toàn trên môi trường Production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Tính năng giả lập thanh toán bị vô hiệu hóa trên môi trường Production' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để thao tác' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const referenceCode = body?.referenceCode;

    if (!referenceCode) {
      return NextResponse.json({ error: 'Thiếu mã đối soát (referenceCode)' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: tx, error: txErr } = await adminSupabase
      .from('payment_transactions')
      .select('id, user_id, amount, status')
      .eq('transaction_reference', referenceCode)
      .single();

    if (txErr || !tx) {
      return NextResponse.json({ error: 'Không tìm thấy giao dịch tương ứng' }, { status: 404 });
    }

    // Chỉ chủ sở hữu giao dịch mới được giả lập thanh toán trong môi trường dev
    if (tx.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Giao dịch không thuộc về tài khoản hiện tại' }, { status: 403 });
    }

    if (tx.status === 'SUCCESS') {
      return NextResponse.json({ success: true, message: 'Giao dịch đã được kích hoạt trước đó' });
    }

    const result = await PaymentVerifierService.fulfillByReference(
      referenceCode,
      { simulated: true, simulatedBy: user.id, timestamp: new Date().toISOString() },
      'DEV_SIMULATOR',
      Number(tx.amount)
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Giả lập thanh toán thành công (Môi trường Test)',
      data: result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
