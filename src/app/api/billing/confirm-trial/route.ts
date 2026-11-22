import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const adminSupabase = createAdminClient();

    const body = await request.json().catch(() => ({}));
    const rawPlanCode = (body.planCode || 'STANDARD').toUpperCase();
    const planCode = rawPlanCode === 'LEARNER_PLUS' ? 'STANDARD' : rawPlanCode;

    // 1. Kiểm tra xem người dùng đã từng dùng thử gói này chưa
    const { data: existingTrial } = await adminSupabase
      .from('user_trial_history')
      .select('id, trial_started_at')
      .eq('user_id', user.id)
      .eq('plan_code', planCode)
      .maybeSingle();

    if (existingTrial) {
      return NextResponse.json(
        {
          error: 'Tài khoản của bạn đã từng kích hoạt 30 ngày dùng thử Gói Tiêu Chuẩn trước đây. Vui lòng thanh toán gói để tiếp tục sử dụng.',
        },
        { status: 400 }
      );
    }

    // 2. Tra cứu service_plans
    const { data: plan } = await adminSupabase
      .from('service_plans')
      .select('*')
      .in('code', [planCode, 'STANDARD', 'LEARNER_PLUS'])
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    const creditsIncluded = plan?.credits_included || 100;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const orderCode = `TRIAL_${String(Date.now()).slice(-8)}`;

    // 3. Ghi nhận giao dịch đối soát 0đ
    const { data: tx, error: txErr } = await adminSupabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan_id: plan?.id || null,
        plan_code: planCode,
        amount: 0,
        currency: 'VND',
        provider: 'SYSTEM_FREE_TRIAL',
        transaction_reference: orderCode,
        idempotency_key: `trial_${user.id}_${planCode}_${now.getTime()}`,
        status: 'SUCCESS',
        verified_at: now.toISOString(),
        raw_payload: {
          benefit: '30 ngày dùng thử miễn phí 0đ',
          credits_granted: creditsIncluded,
        },
      })
      .select('id')
      .single();

    if (txErr) {
      console.error('Failed to record trial payment transaction:', txErr);
    }

    // 4. Ghi nhận lịch sử dùng thử (Chống lạm dụng)
    await adminSupabase.from('user_trial_history').insert({
      user_id: user.id,
      plan_code: planCode,
      trial_started_at: now.toISOString(),
      trial_expires_at: expiresAt.toISOString(),
    });

    // 5. Khởi tạo Subscription với trạng thái TRIALING
    await adminSupabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        plan_id: plan?.id || null,
        plan_code: planCode,
        status: 'TRIALING',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        trial_ended_at: expiresAt.toISOString(),
        auto_renew: true,
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' }
    );

    // 6. Cập nhật profile plan_tier thành STANDARD
    await adminSupabase
      .from('profiles')
      .update({
        plan_tier: 'STANDARD',
        updated_at: now.toISOString(),
      })
      .eq('id', user.id);

    // 7. Cấp 100 AI credits dùng thử
    try {
      await adminSupabase.from('ai_credit_ledgers').insert({
        user_id: user.id,
        amount: creditsIncluded,
        action: 'TRIAL_ACTIVATION',
        reason: 'Tặng 100 AI credits kích hoạt 30 ngày dùng thử Gói Tiêu Chuẩn',
        created_at: now.toISOString(),
      });
    } catch (ledgerErr) {
      console.error('[API_ROUTE_ERROR] Trial ledger credit insert error:', ledgerErr);
      try {
        await adminSupabase.rpc('increment_user_points', {
          p_user_id: user.id,
          p_points: creditsIncluded,
        });
      } catch (rpcErr) {
        console.error('[API_ROUTE_ERROR] Trial increment_user_points fallback error:', rpcErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kích hoạt 30 ngày dùng thử Gói Tiêu Chuẩn (0đ) thành công!',
      subscription: {
        planCode,
        planName: plan?.name || 'Gói Tiêu Chuẩn',
        status: 'TRIALING',
        creditsIncluded,
        expiresAt: expiresAt.toISOString(),
      },
      transactionId: tx?.id,
    });
  } catch (err) {
    console.error('[API_ROUTE_ERROR] /api/billing/confirm-trial:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
