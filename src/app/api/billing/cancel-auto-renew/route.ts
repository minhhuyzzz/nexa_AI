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

    // Cập nhật subscription của user: auto_renew = false
    const { data: sub, error: subErr } = await adminSupabase
      .from('subscriptions')
      .update({
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã hủy tính năng nhắc gia hạn chu kỳ sau. Gói dịch vụ của bạn sẽ chuyển về Gói Cơ Bản khi hết hạn chu kỳ hiện tại.',
      subscription: sub,
    });
  } catch (err) {
    console.error('[API_ROUTE_ERROR] /api/billing/cancel-auto-renew:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
