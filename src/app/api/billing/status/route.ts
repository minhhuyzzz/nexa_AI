import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentVerifierService } from '@/features/billing/services/payment-verifier.service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const transactionId = request.nextUrl.searchParams.get('transactionId');
    if (!transactionId) {
      return NextResponse.json({ error: 'Thiếu transactionId' }, { status: 400 });
    }

    const tx = await PaymentVerifierService.getTransactionStatus(transactionId, user.id);
    if (!tx) {
      return NextResponse.json({ error: 'Không tìm thấy giao dịch' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction: tx,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
