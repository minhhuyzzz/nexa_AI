import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { maskInternalError } from '@/lib/security/response-sanitizer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting on public feedback submission
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`feedback:${clientIp}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000, // 5 requests per 10 minutes
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Bạn đang gửi phản hồi quá nhanh. Vui lòng thử lại sau ${rateLimit.retryAfterSeconds} giây.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      organizationId,
      category = 'GENERAL',
      subject = 'Góp ý nền tảng',
      content,
      email,
      name,
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Nội dung phản hồi không được để trống' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: ticket, error: insertErr } = await adminSupabase
      .from('feedback_tickets')
      .insert({
        user_id: user?.id || null,
        organization_id: organizationId || null,
        user_email: email || user?.email || 'Khách vãng lai',
        user_name: name || user?.user_metadata?.nickname || 'Người dùng',
        category,
        subject: subject.trim(),
        content: content.trim(),
        status: 'OPEN',
      })
      .select()
      .single();

    if (insertErr) {
      console.warn('Feedback ticket insert warning:', insertErr.message);
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket?.id,
      message: 'Cảm ơn bạn đã gửi đóng góp ý kiến. Ban quản trị sẽ tiếp nhận và xử lý.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: maskInternalError(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await requirePlatformAdmin('MANAGE_SETTINGS');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();
    const { data: tickets, error } = await adminSupabase
      .from('feedback_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ tickets: [] });
    }

    return NextResponse.json({ tickets: tickets || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_SETTINGS');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const body = await request.json();
    const { ticketId, status, adminNotes } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Thiếu ID phiếu phản hồi' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const updateData: Record<string, any> = {
      status: status || 'RESOLVED',
      resolved_at: status === 'RESOLVED' ? new Date().toISOString() : null,
      resolved_by: auth.user!.id,
    };

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    const { data: updated, error } = await adminSupabase
      .from('feedback_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
