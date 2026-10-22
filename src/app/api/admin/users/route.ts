import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, specialization')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('GET /api/admin/users query error:', error.message);
      return NextResponse.json({ users: [] });
    }

    const formatted = (data || []).map((p) => ({
      id: p.id,
      displayName: p.full_name || p.email.split('@')[0],
      email: p.email,
      role: (p.role as 'LEARNER' | 'EVALUATOR' | 'ADMIN') || 'LEARNER',
      organization: p.specialization || 'NEXA Platform',
      status: 'ACTIVE',
      joinedAt: new Date(p.created_at).toLocaleDateString('vi-VN'),
      assessmentsTaken: 0,
    }));

    return NextResponse.json({ users: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.warn('GET /api/admin/users exception:', message);
    return NextResponse.json({ users: [] });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
