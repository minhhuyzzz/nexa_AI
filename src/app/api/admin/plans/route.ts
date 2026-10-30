import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

const planSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(2),
  roleTarget: z.enum(['LEARNER', 'EVALUATOR', 'ORGANIZATION']).default('EVALUATOR'),
  name: z.string().min(2),
  description: z.string().optional().default(''),
  priceVnd: z.number().min(0),
  creditsIncluded: z.number().min(0),
  maxMembers: z.number().min(1).default(1),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    const { data: plans, error } = await adminSupabase
      .from('service_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plans: plans || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    const body = await request.json();
    const validation = planSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: validation.error.format() }, { status: 400 });
    }

    const { code, roleTarget, name, description, priceVnd, creditsIncluded, maxMembers, features, isActive } = validation.data;

    const { data: plan, error } = await adminSupabase
      .from('service_plans')
      .insert({
        code,
        role_target: roleTarget,
        name,
        description,
        price_vnd: priceVnd,
        credits_included: creditsIncluded,
        max_members: maxMembers,
        features,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Thiếu id gói dịch vụ' }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priceVnd !== undefined) updateData.price_vnd = body.priceVnd;
    if (body.creditsIncluded !== undefined) updateData.credits_included = body.creditsIncluded;
    if (body.maxMembers !== undefined) updateData.max_members = body.maxMembers;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const { data: plan, error } = await adminSupabase
      .from('service_plans')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
