import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
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

    // Fetch real consent logs (Nghị định 13/2023/NĐ-CP)
    const { data: consentLogs, error: consentErr } = await adminSupabase
      .from('consent_logs')
      .select(`
        id,
        user_id,
        consent_version,
        is_granted,
        ip_address,
        user_agent,
        created_at,
        profiles ( email, nickname )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch proctoring suspicious events
    const { data: proctoringEvents } = await adminSupabase
      .from('proctoring_events')
      .select(`
        id,
        user_id,
        room_id,
        event_type,
        severity,
        details,
        created_at,
        profiles ( email, nickname )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      success: true,
      consentLogs: consentLogs || [],
      proctoringEvents: proctoringEvents || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
