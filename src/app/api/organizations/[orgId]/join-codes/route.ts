import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const createJoinCodeSchema = z.object({
  title: z.string().trim().max(100).optional(),
  maxUses: z.number().int().min(1).max(10000).default(100),
  expiresInDays: z.number().int().min(1).max(365).default(30),
});

const revokeJoinCodeSchema = z.object({
  codeId: z.string().uuid('ID mã tham gia không hợp lệ'),
});

// Simple sliding window rate limit for join code generation: max 10 requests per minute
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(key: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

async function checkOrgManager(userId: string, orgId: string) {
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'ADMIN') return true;

  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .single();

  return member && ['ORG_OWNER', 'ORG_ADMIN'].includes(member.org_role);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const isManager = await checkOrgManager(user.id, orgId);
    if (!isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền quản lý mã tham gia của tổ chức này' },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: codes, error } = await adminSupabase
      .from('organization_join_codes')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, codes: codes || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const isManager = await checkOrgManager(user.id, orgId);
    if (!isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền tạo mã tham gia cho tổ chức này' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createJoinCodeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { title, maxUses, expiresInDays } = validation.data;

    // Rate limit check
    if (!checkRateLimit(`org-join-gen:${user.id}:${orgId}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Bạn đã tạo quá nhiều mã trong thời gian ngắn. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    // Cryptographically secure token generation
    const randomBytes = new Uint8Array(4);
    globalThis.crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const randomCode = `NX-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const adminSupabase = createAdminClient();
    const { data: newCode, error: insertError } = await adminSupabase
      .from('organization_join_codes')
      .insert({
        organization_id: orgId,
        code: randomCode,
        title: title || 'Mã tham gia học viên',
        max_uses: maxUses,
        used_count: 0,
        expires_at: expiresAt.toISOString(),
        is_revoked: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const origin = request.nextUrl.origin || 'http://localhost:3000';
    const joinUrl = `${origin}/join/org/${randomCode}`;

    return NextResponse.json({
      success: true,
      message: 'Đã tạo mã tham gia thành công',
      joinCode: {
        ...newCode,
        joinUrl,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const isManager = await checkOrgManager(user.id, orgId);
    if (!isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền thu hồi mã tham gia của tổ chức này' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = revokeJoinCodeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { codeId } = validation.data;
    const adminSupabase = createAdminClient();
    const { data: updated, error } = await adminSupabase
      .from('organization_join_codes')
      .update({ is_revoked: true })
      .eq('id', codeId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: 'Không tìm thấy mã tham gia hoặc không thể thu hồi' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã thu hồi mã tham gia thành công',
      joinCode: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
