import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Tên tổ chức tối thiểu 2 ký tự').max(100),
  code: z.string().trim().min(2, 'Mã tổ chức tối thiểu 2 ký tự').max(30),
  type: z.enum(['ACADEMY', 'EDUCATIONAL', 'ENTERPRISE', 'COMMUNITY']).default('EDUCATIONAL'),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().email('Email liên hệ không hợp lệ').optional().or(z.literal('')),
  contactPhone: z.string().trim().optional(),
  expectedLearners: z.number().int().positive().default(500),
  notes: z.string().optional(),
});

const patchOrgSchema = z.object({
  id: z.string().uuid('ID tổ chức không hợp lệ'),
  status: z.enum(['ACTIVE', 'PENDING_CONTACT', 'PROVISIONING', 'SUSPENDED', 'CLOSED']).optional(),
  code: z.string().trim().min(2).max(30).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    // 1. Enforce Platform Admin authorization
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const supabase = createAdminClient();

    // 2. Fetch organizations
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('GET /api/admin/organizations error:', error.message);
      return NextResponse.json({ organizations: [] });
    }

    // 3. Fetch member counts per organization
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id');

    const memberCountMap: Record<string, number> = {};
    (userOrgs || []).forEach((uo) => {
      if (uo.organization_id) {
        memberCountMap[uo.organization_id] = (memberCountMap[uo.organization_id] || 0) + 1;
      }
    });

    const formatted = (orgs || []).map((org) => {
      return {
        id: org.id,
        code: org.code || (org.slug || org.name.slice(0, 4)).toUpperCase(),
        name: org.name,
        type: org.type === 'EDUCATIONAL' ? 'ACADEMY' : (org.type || 'ENTERPRISE'),
        contactName: org.contact_name || 'Chưa cập nhật',
        contactEmail: org.contact_email || '—',
        contactPhone: org.contact_phone || '—',
        expectedLearners: org.expected_learners || org.max_members || 500,
        activeMembers: memberCountMap[org.id] || 0,
        status: org.status || (org.is_active ? 'ACTIVE' : 'PENDING_CONTACT'),
        notes: org.notes || '',
        createdAt: org.created_at,
      };
    });

    return NextResponse.json({ success: true, organizations: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request | NextRequest) {
  try {
    // 1. Enforce Platform Admin authorization
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const body = await request.json();
    const validation = createOrgSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, code, contactName, contactEmail, contactPhone, expectedLearners, notes, type } =
      validation.data;

    const supabase = createAdminClient();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const cleanSlug = cleanCode.toLowerCase();

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        code: cleanCode,
        slug: cleanSlug,
        type: type === 'ACADEMY' ? 'EDUCATIONAL' : type,
        contact_name: (contactName || '').trim(),
        contact_email: (contactEmail || '').trim().toLowerCase(),
        contact_phone: (contactPhone || '').trim(),
        expected_learners: expectedLearners,
        max_members: expectedLearners,
        quota_assessments: expectedLearners * 10,
        status: contactEmail && contactEmail.trim() ? 'PENDING_OWNER' : 'ACTIVE',
        is_active: true,
        notes: (notes || '').trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `Mã tổ chức "${cleanCode}" đã tồn tại. Vui lòng chọn mã khác.` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let inviteUrl = '';
    if (contactEmail && contactEmail.trim()) {
      const token =
        crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase.from('organization_invitations').insert({
        organization_id: data.id,
        email: contactEmail.trim().toLowerCase(),
        org_role: 'ORG_OWNER',
        token,
        status: 'PENDING',
        expires_at: expiresAt.toISOString(),
      });

      const origin = 'nextUrl' in request ? request.nextUrl.origin : new URL(request.url).origin;
      inviteUrl = `${origin}/personal/accept-invite?token=${token}`;
    }

    return NextResponse.json({ success: true, organization: data, inviteUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request | NextRequest) {
  try {
    // 1. Enforce Platform Admin authorization
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const body = await request.json();
    const validation = patchOrgSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { id, status, code, notes } = validation.data;

    const supabase = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (status) {
      updates.status = status;
      updates.is_active = status === 'ACTIVE';
    }

    if (code) {
      updates.code = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, organization: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
