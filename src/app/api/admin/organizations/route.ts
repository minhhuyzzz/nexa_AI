import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch organizations
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('GET /api/admin/organizations error:', error.message);
      return NextResponse.json({ organizations: [] });
    }

    // 2. Fetch member counts per organization
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

    return NextResponse.json({ organizations: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.warn('GET /api/admin/organizations exception:', message);
    return NextResponse.json({ organizations: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, contactName, contactEmail, contactPhone, expectedLearners, notes, type } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Tên và mã tổ chức (org_code) là bắt buộc' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const cleanSlug = cleanCode.toLowerCase();

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        code: cleanCode,
        slug: cleanSlug,
        type: type === 'ACADEMY' ? 'EDUCATIONAL' : (type || 'EDUCATIONAL'),
        contact_name: (contactName || '').trim(),
        contact_email: (contactEmail || '').trim().toLowerCase(),
        contact_phone: (contactPhone || '').trim(),
        expected_learners: Number(expectedLearners) || 500,
        max_members: Number(expectedLearners) || 500,
        quota_assessments: (Number(expectedLearners) || 500) * 10,
        status: 'ACTIVE',
        is_active: true,
        notes: (notes || '').trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `Mã tổ chức "${cleanCode}" đã tồn tại. Vui lòng chọn mã khác.` }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let inviteUrl = '';
    if (contactEmail && contactEmail.trim()) {
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase.from('organization_invitations').insert({
        organization_id: data.id,
        email: contactEmail.trim().toLowerCase(),
        org_role: 'ORG_ADMIN',
        token,
        status: 'PENDING',
        expires_at: expiresAt.toISOString(),
      });

      const origin = request.nextUrl.origin || 'http://localhost:3000';
      inviteUrl = `${origin}/evaluator/accept-invite?token=${token}`;
    }

    return NextResponse.json({ success: true, organization: data, inviteUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, code, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID tổ chức' }, { status: 400 });
    }

    const supabase = await createClient();
    const updates: Record<string, any> = {};

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
