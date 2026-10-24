import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const role = request.nextUrl.searchParams.get('role');

    let query = supabase
      .from('service_plans')
      .select('id, code, role_target, name, description, price_vnd, billing_cycle, credits_included, max_members, features, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (role) {
      query = query.eq('role_target', role.toUpperCase());
    }

    const { data: plans, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      plans: plans || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
