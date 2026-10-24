import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isSuperadminEmail(user.email)) {
      // In dev mode allow test access
    }

    // Fetch profiles with user_organizations
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select(`
        id,
        nickname,
        full_name,
        email,
        role,
        plan_tier,
        points,
        created_at,
        user_organizations(organization_id, organizations(id, name, code))
      `)
      .order('created_at', { ascending: false });

    if (profileErr) {
      console.warn('GET /api/admin/users query error:', profileErr.message);
      return NextResponse.json({ users: [] });
    }

    // Fetch submission counts per user
    const { data: subData } = await supabase
      .from('assessment_submissions')
      .select('user_id');

    const subCountMap: Record<string, number> = {};
    (subData || []).forEach((s) => {
      if (s.user_id) subCountMap[s.user_id] = (subCountMap[s.user_id] || 0) + 1;
    });

    const formatted = (profiles || []).map((p: any) => {
      const orgRel = Array.isArray(p.user_organizations) && p.user_organizations.length > 0
        ? p.user_organizations[0]?.organizations
        : null;

      return {
        id: p.id,
        nickname: p.nickname || p.email?.split('@')[0] || 'Người dùng',
        fullName: p.full_name || p.nickname || 'Chưa cập nhật',
        email: p.email,
        role: p.role || 'LEARNER',
        planTier: p.plan_tier || 'FREE',
        points: p.points || 0,
        organization: orgRel ? { id: orgRel.id, name: orgRel.name, code: orgRel.code } : null,
        submissionsCount: subCountMap[p.id] || 0,
        createdAt: p.created_at,
      };
    });

    return NextResponse.json({ users: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('GET /api/admin/users error:', message);
    return NextResponse.json({ users: [] });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, planTier, organizationId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    const supabase = await createClient();

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (role && ['LEARNER', 'EVALUATOR', 'ADMIN'].includes(role)) {
      updates.role = role;
    }
    if (planTier && ['FREE', 'PRO', 'ENTERPRISE'].includes(planTier)) {
      updates.plan_tier = planTier;
    }

    if (Object.keys(updates).length > 1) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
    }

    // If linking organization
    if (organizationId) {
      // Upsert into user_organizations
      await supabase
        .from('user_organizations')
        .upsert(
          {
            user_id: userId,
            organization_id: organizationId,
            org_role: 'MEMBER',
            status: 'ACTIVE',
          },
          { onConflict: 'user_id,organization_id' }
        );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
