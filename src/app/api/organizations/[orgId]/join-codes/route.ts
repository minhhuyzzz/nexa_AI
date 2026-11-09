import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperadminEmail } from '@/lib/auth/superadmin';
import { normalizeOrgRole } from '@/lib/auth/org-guard';

export const dynamic = 'force-dynamic';

const createJoinCodeSchema = z.object({
  title: z.string().trim().max(100).optional(),
  maxUses: z.number().int().min(1).max(10000).default(500),
  expiresInDays: z.number().int().min(1).max(365).default(30),
  expiresInHours: z.number().min(0.5).max(8760).optional(),
});

const revokeJoinCodeSchema = z.object({
  codeId: z.string().uuid('ID mã tham gia không hợp lệ'),
});

// Simple sliding window rate limit for join code generation: max 30 requests per minute
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(key: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

/**
 * Resolves organization ID whether a UUID or slug was passed in URL params
 */
async function resolveOrgId(adminSupabase: any, orgIdOrSlug: string): Promise<string | null> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdOrSlug);
  if (isUUID) return orgIdOrSlug;
  const { data } = await adminSupabase
    .from('organizations')
    .select('id')
    .eq('slug', orgIdOrSlug)
    .maybeSingle();
  return data?.id || null;
}

/**
 * Validates whether user is authorized to manage join codes for this organization
 */
async function checkOrgManager(user: { id: string; email?: string }, resolvedOrgId: string, adminSupabase: any) {
  if (user.email && isSuperadminEmail(user.email)) return true;

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'ADMIN') return true;

  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', user.id)
    .eq('organization_id', resolvedOrgId)
    .eq('status', 'ACTIVE')
    .single();

  // Allowed manager roles: ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR']
  const norm = normalizeOrgRole(member?.org_role);
  return Boolean(norm === 'ORG_OWNER' || norm === 'ORG_ADMIN' || norm === 'ASSESSOR');
}

/**
 * Generate cryptographically secure 9-character code in 3 segments (e.g. BF8-1OV-QG8 or NX8-6M2-9K1)
 */
function generateSecureJoinCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomBytes = new Uint8Array(9);
  globalThis.crypto.getRandomValues(randomBytes);
  const raw = Array.from(randomBytes).map((b) => chars[b % chars.length]).join('');
  return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 9)}`;
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

    const adminSupabase = createAdminClient();
    const resolvedOrgId = await resolveOrgId(adminSupabase, orgId);
    if (!resolvedOrgId) {
      return NextResponse.json({ error: 'Không tìm thấy tổ chức' }, { status: 404 });
    }

    const isManager = await checkOrgManager(user, resolvedOrgId, adminSupabase);
    if (!isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền quản lý mã tham gia của tổ chức này' },
        { status: 403 }
      );
    }

    const { data: codes, error } = await adminSupabase
      .from('organization_join_codes')
      .select('*')
      .eq('organization_id', resolvedOrgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, codes: [] });
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

    const adminSupabase = createAdminClient();
    const resolvedOrgId = await resolveOrgId(adminSupabase, orgId);
    if (!resolvedOrgId) {
      return NextResponse.json({ error: 'Không tìm thấy tổ chức' }, { status: 404 });
    }

    const isManager = await checkOrgManager(user, resolvedOrgId, adminSupabase);
    if (!isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền tạo mã tham gia cho tổ chức này' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = createJoinCodeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { title, maxUses, expiresInDays, expiresInHours } = validation.data;

    // Rate limit check
    if (!checkRateLimit(`org-join-gen:${user.id}:${resolvedOrgId}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Bạn đã tạo quá nhiều mã trong thời gian ngắn. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const randomCode = generateSecureJoinCode();
    const hours = expiresInHours ?? (expiresInDays * 24);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const { data: newCode, error: insertError } = await adminSupabase
      .from('organization_join_codes')
      .insert({
        organization_id: resolvedOrgId,
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

    const origin = request.nextUrl.origin || 'http://localhost:3000';
    const joinUrl = `${origin}/join/org/${randomCode}`;

    if (insertError || !newCode) {
      console.error('[JOIN_CODE_INSERT_ERROR]', insertError);
      return NextResponse.json(
        { error: 'Không thể lưu mã tham gia vào cơ sở dữ liệu', details: insertError?.message },
        { status: 500 }
      );
    }

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

    const adminSupabase = createAdminClient();
    const resolvedOrgId = await resolveOrgId(adminSupabase, orgId);
    if (!resolvedOrgId) {
      return NextResponse.json({ error: 'Không tìm thấy tổ chức' }, { status: 404 });
    }

    const isManager = await checkOrgManager(user, resolvedOrgId, adminSupabase);
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
    const { data: updated, error } = await adminSupabase
      .from('organization_join_codes')
      .update({ is_revoked: true })
      .eq('id', codeId)
      .eq('organization_id', resolvedOrgId)
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
