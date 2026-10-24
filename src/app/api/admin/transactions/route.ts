import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

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
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.transactionId) {
      return NextResponse.json({ error: 'Thiếu transactionId' }, { status: 400 });
    }

    const { data: rpcResult, error: rpcErr } = await adminSupabase.rpc(
      'fulfill_payment_transaction',
      {
        p_transaction_id: body.transactionId,
        p_provider_ref: `ADMIN_MANUAL_${user.id}`,
        p_raw_payload: { manualBy: user.id, note: body.note || 'Admin confirmed receipt' },
      }
    );

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: rpcResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
