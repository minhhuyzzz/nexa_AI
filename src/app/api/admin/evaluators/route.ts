import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        specialization,
        created_at
      `)
      .eq('role', 'EVALUATOR')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('GET /api/admin/evaluators query error:', error.message);
      return NextResponse.json({ evaluators: [] });
    }

    const formatted = (data || []).map((p) => ({
      id: p.id,
      name: p.full_name || p.email.split('@')[0],
      email: p.email,
      organization: p.specialization || 'NEXA Evaluator Council',
      certificateCode: `EXP-NX-${p.id.slice(0, 4).toUpperCase()}`,
      domains: ['D1: Thông tin & Dữ liệu', 'D4: An toàn số'],
      totalGraded: 0,
      aiAgreementRate: 98.2,
      joinedDate: new Date(p.created_at).toLocaleDateString('vi-VN'),
      status: 'APPROVED',
      bio: p.specialization || 'Chuyên gia khảo thí và thẩm định năng lực số.',
    }));

    return NextResponse.json({ evaluators: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.warn('GET /api/admin/evaluators exception:', message);
    return NextResponse.json({ evaluators: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const isApproved = status === 'APPROVED';

    const { error } = await supabase.from('evaluator_profiles').upsert(
      {
        user_id: id,
        status: status,
        is_verified_badge: isApproved,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
