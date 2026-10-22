import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase organizations query returned empty or restricted:', error.message);
      return NextResponse.json({ organizations: [] });
    }

    const formatted = (data || []).map((org) => {
      const mappedType =
        org.type === 'EDUCATIONAL' ? 'ACADEMY' : (org.type || 'ENTERPRISE');

      return {
        id: org.id,
        code: (org.slug || org.name.slice(0, 4)).toUpperCase(),
        name: org.name,
        type: mappedType,
        licensePlan: 'ENTERPRISE',
        activeLearners: 0,
        maxLearners: org.max_members || 1000,
        monthlyAiQuota: org.quota_assessments || 20000,
        usedAiQuota: 0,
        contractValidUntil: '31/12/2026',
        status: org.is_active ? 'ACTIVE' : 'SUSPENDED',
      };
    });

    return NextResponse.json({ organizations: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.warn('GET /api/admin/organizations error:', message);
    return NextResponse.json({ organizations: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, type, maxLearners, aiQuota } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Tên và mã tổ chức là bắt buộc' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const dbType = type === 'ACADEMY' ? 'EDUCATIONAL' : type;
    const cleanSlug = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        type: dbType,
        max_members: Number(maxLearners) || 1000,
        quota_assessments: Number(aiQuota) || 20000,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ organization: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
