import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

const reconcileSchema = z.object({
  transactionId: z.string().uuid('ID giao dịch không hợp lệ'),
  proofReference: z
    .string({ required_error: 'Vui lòng cung cấp mã chứng từ ngân hàng' })
    .trim()
    .min(3, 'Mã chứng từ / sao kê ngân hàng tối thiểu 3 ký tự'),
  reason: z
    .string({ required_error: 'Vui lòng cung cấp lý do đối soát' })
    .trim()
    .min(5, 'Lý do đối soát tối thiểu 5 ký tự'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    const status = request.nextUrl.searchParams.get('status');

    let query = adminSupabase
      .from('payment_transactions')
      .select(`
        id,
        user_id,
        organization_id,
        plan_code,
        amount,
        currency,
        provider,
        transaction_reference,
        idempotency_key,
        status,
        verified_at,
        created_at,
        profiles ( email, nickname )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data: transactions, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Admin manually fulfills / reconciles an offline bank transfer
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminUser = auth.user!;
    const adminSupabase = createAdminClient();

    const body = await request.json();
    const validation = reconcileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu đối soát không hợp lệ' },
        { status: 400 }
      );
    }

    const { transactionId, proofReference, reason } = validation.data;

    // 1. Fetch current transaction and enforce idempotency & status check
    const { data: tx, error: fetchErr } = await adminSupabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();

    if (fetchErr || !tx) {
      return NextResponse.json({ error: 'Không tìm thấy giao dịch thanh toán' }, { status: 404 });
    }

    if (tx.status === 'COMPLETED' || tx.status === 'SUCCESS') {
      return NextResponse.json(
        { error: 'Giao dịch này đã được hoàn tất trước đó. Không được phép duyệt lặp lại.' },
        { status: 400 }
      );
    }

    if (tx.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Không thể đối soát giao dịch ở trạng thái ${tx.status}.` },
        { status: 400 }
      );
    }

    // ADM-03: Kiểm tra tính duy nhất của mã chứng từ ngân hàng proofReference
    const { data: existingProof } = await adminSupabase
      .from('payment_transactions')
      .select('id, transaction_reference')
      .neq('id', transactionId)
      .eq('transaction_reference', proofReference)
      .in('status', ['COMPLETED', 'SUCCESS'])
      .maybeSingle();

    if (existingProof) {
      return NextResponse.json(
        {
          error: `Mã chứng từ ngân hàng "${proofReference}" đã được đối soát cho giao dịch ${existingProof.transaction_reference}. Không được phép dùng trùng lặp mã chứng từ.`,
        },
        { status: 400 }
      );
    }

    // 2. Fulfill transaction via atomic database RPC
    const { data: rpcResult, error: rpcErr } = await adminSupabase.rpc(
      'fulfill_payment_transaction',
      {
        p_transaction_id: transactionId,
        p_provider_ref: proofReference,
        p_raw_payload: {
          manualBy: adminUser.id,
          adminEmail: adminUser.email,
          proofReference,
          reason,
          reconciledAt: new Date().toISOString(),
        },
      }
    );

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    // 3. Record privileged audit log
    await recordAdminAudit({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'TRANSACTION_MANUALLY_RECONCILED',
      targetType: 'TRANSACTION',
      targetId: transactionId,
      details: {
        proofReference,
        reason,
        amount: tx.amount,
        planCode: tx.plan_code,
        userId: tx.user_id,
        transactionReference: tx.transaction_reference,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã đối soát thành công giao dịch ${tx.transaction_reference}`,
      result: rpcResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
