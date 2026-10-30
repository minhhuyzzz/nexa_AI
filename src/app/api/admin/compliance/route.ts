import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    // 1. Telemetry counts
    const { count: totalProfiles } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalConsents } = await adminSupabase
      .from('consent_logs')
      .select('*', { count: 'exact', head: true })
      .eq('is_granted', true);

    const { count: totalProctoringEvents } = await adminSupabase
      .from('proctoring_events')
      .select('*', { count: 'exact', head: true });

    const { count: totalHighSeverity } = await adminSupabase
      .from('proctoring_events')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'HIGH');

    const totalUsers = totalProfiles || 0;
    const grantedUsers = totalConsents || 0;
    const consentRate =
      totalUsers > 0 ? Math.min(100, Math.round((grantedUsers / totalUsers) * 100)) : 0;

    // 2. Fetch real consent logs (Nghị định 13/2023/NĐ-CP)
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

    if (consentErr) {
      console.warn('consent_logs query error:', consentErr.message);
    }

    // 3. Fetch proctoring suspicious events
    const { data: proctoringEvents, error: procErr } = await adminSupabase
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

    if (procErr) {
      console.warn('proctoring_events query error:', procErr.message);
    }

    return NextResponse.json({
      success: true,
      telemetry: {
        totalProfiles: totalUsers,
        totalConsents: grantedUsers,
        consentRate,
        totalProctoringEvents: totalProctoringEvents || 0,
        highSeverityCount: totalHighSeverity || 0,
      },
      consentLogs: consentLogs || [],
      proctoringEvents: proctoringEvents || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
