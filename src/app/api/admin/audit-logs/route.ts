import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const targetType = searchParams.get('target_type');
    const period = searchParams.get('period') || 'all';
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);

    const adminSupabase = createAdminClient();
    const now = Date.now();

    // 1. Fetch Summary Stats
    const { count: totalCount } = await adminSupabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true });

    const past24hIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const { count: recent24hCount } = await adminSupabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', past24hIso);

    // 2. Build Query for Logs
    let query = adminSupabase
      .from('admin_audit_logs')
      .select('id, admin_id, admin_email, action, target_type, target_id, details, ip_address, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (period === '24h') {
      query = query.gte('created_at', past24hIso);
    } else if (period === '7d') {
      const past7dIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', past7dIso);
    } else if (period === '30d') {
      const past30dIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', past30dIso);
    }

    if (action && action !== 'ALL') {
      query = query.eq('action', action);
    }

    if (targetType && targetType !== 'ALL') {
      query = query.eq('target_type', targetType);
    }

    if (search) {
      query = query.or(`admin_email.ilike.%${search}%,action.ilike.%${search}%,target_id.ilike.%${search}%`);
    }

    const { data: logs, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Tự động khôi phục email từ bảng profiles cho các bản ghi lịch sử bị thiếu email
    const missingAdminIds = Array.from(
      new Set(
        (logs || [])
          .filter((l) => !l.admin_email && l.admin_id)
          .map((l) => l.admin_id as string)
      )
    );

    const profileMap: Record<string, string> = {};
    if (missingAdminIds.length > 0) {
      try {
        const { data: profiles } = await adminSupabase
          .from('profiles')
          .select('id, email')
          .in('id', missingAdminIds);
        if (profiles) {
          profiles.forEach((p) => {
            if (p.id && p.email) profileMap[p.id] = p.email;
          });
        }
      } catch (err) {
        console.warn('Could not backfill audit emails from profiles:', err);
      }
    }

    const resolvedLogs = (logs || []).map((l) => {
      const resolvedEmail = l.admin_email || (l.admin_id ? profileMap[l.admin_id] : null) || null;
      return {
        ...l,
        admin_email: resolvedEmail,
        ip_address: l.ip_address || '127.0.0.1',
      };
    });

    // Calculate unique admins count from recent logs
    const adminSet = new Set(resolvedLogs.map((l) => l.admin_email).filter(Boolean));

    return NextResponse.json({
      success: true,
      stats: {
        totalActions: totalCount || 0,
        actions24h: recent24hCount || 0,
        activeAdmins: Math.max(1, adminSet.size),
      },
      logs: resolvedLogs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
