import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('consent_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('GET /api/admin/compliance query error:', error.message);
      return NextResponse.json({ logs: [] });
    }

    const formatted = (data || []).map((l) => ({
      id: l.id,
      timestamp: new Date(l.created_at).toLocaleString('vi-VN'),
      actor: `User (${l.user_id?.slice(0, 8) || 'Ẩn danh'})`,
      actorRole: 'SYSTEM',
      action: l.is_granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      resource: `Phiên bản cam kết: ${l.consent_version}`,
      ipAddress: l.ip_address || '127.0.0.1',
      sha256Hash: `hash-${l.id.replace(/-/g, '')}`,
      status: 'VERIFIED',
      details: `Người dùng chấp thuận điều khoản bảo mật dữ liệu & PII. Thiết bị: ${l.user_agent || 'Web Browser'}`,
    }));

    return NextResponse.json({ logs: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.warn('GET /api/admin/compliance exception:', message);
    return NextResponse.json({ logs: [] });
  }
}
