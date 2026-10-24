import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Fetch framework with all domains & competencies
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
    const { data: framework, error: fwErr } = await adminSupabase
      .from('assessment_frameworks')
      .select('id, code, title, version, description, status')
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (fwErr || !framework) {
      return NextResponse.json({ error: 'Không tìm thấy khung năng lực' }, { status: 404 });
    }

    const { data: domains, error: domErr } = await adminSupabase
      .from('competency_domains')
      .select(`
        id,
        domain_index,
        code,
        title,
        description,
        competencies (
          id,
          skill_code,
          title,
          description,
          target_level,
          display_order
        )
      `)
      .eq('framework_id', framework.id)
      .order('domain_index', { ascending: true });

    if (domErr) {
      return NextResponse.json({ error: domErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      framework,
      domains: domains || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Update Domain or Competency
export async function PATCH(request: NextRequest) {
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
      return NextResponse.json({ error: 'Không có quyền quản trị' }, { status: 403 });
    }

    const body = await request.json();
    const { entityType, id, title, code, skill_code, description, target_level } = body;

    if (!id || !entityType) {
      return NextResponse.json({ error: 'Thiếu thông tin entityType hoặc id' }, { status: 400 });
    }

    if (entityType === 'DOMAIN') {
      const updates: Record<string, any> = {};
      if (title) updates.title = title.trim();
      if (code) updates.code = code.trim();
      if (description !== undefined) updates.description = description.trim();

      const { data, error } = await adminSupabase
        .from('competency_domains')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, domain: data });
    }

    if (entityType === 'COMPETENCY') {
      const updates: Record<string, any> = {};
      if (title) updates.title = title.trim();
      if (skill_code) updates.skill_code = skill_code.trim();
      if (description !== undefined) updates.description = description.trim();
      if (target_level !== undefined) updates.target_level = Number(target_level);

      const { data, error } = await adminSupabase
        .from('competencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, competency: data });
    }

    return NextResponse.json({ error: 'entityType không hợp lệ' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Add new competency to a domain
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Không có quyền quản trị' }, { status: 403 });
    }

    const body = await request.json();
    const { domain_id, skill_code, title, description, target_level } = body;

    if (!domain_id || !skill_code || !title) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ Miền, Mã kỹ năng và Tên kỹ năng' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('competencies')
      .insert({
        domain_id,
        skill_code: skill_code.trim(),
        title: title.trim(),
        description: (description || '').trim(),
        target_level: Number(target_level) || 2,
        display_order: 99,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, competency: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
