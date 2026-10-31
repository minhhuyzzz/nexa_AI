import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

interface OrgRelation {
  id: string;
  name: string;
  code: string;
}

interface UserOrgRelation {
  organization_id: string;
  org_role?: string;
  organizations: OrgRelation | null;
}

interface ProfileRow {
  id: string;
  nickname: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  plan_tier: string | null;
  points: number | null;
  created_at: string;
  user_organizations?: UserOrgRelation[];
}

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }
    const adminSupabase = createAdminClient();

    // Fetch profiles with user_organizations
    const { data: profiles, error: profileErr } = await adminSupabase
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
        user_organizations(organization_id, org_role, organizations(id, name, code))
      `)
      .order('created_at', { ascending: false });

    if (profileErr) {
      return NextResponse.json(
        { error: 'Không thể tải danh sách người dùng: ' + profileErr.message },
        { status: 500 }
      );
    }

    // Fetch submission counts per user
    const { data: subData } = await adminSupabase
      .from('assessment_submissions')
      .select('user_id');

    const subCountMap: Record<string, number> = {};
    (subData || []).forEach((s) => {
      if (s.user_id) subCountMap[s.user_id] = (subCountMap[s.user_id] || 0) + 1;
    });

    const rows = (profiles || []) as unknown as ProfileRow[];
    const formatted = rows.map((p) => {
      const firstOrg =
        Array.isArray(p.user_organizations) && p.user_organizations.length > 0
          ? p.user_organizations[0]
          : null;
      const orgRel = firstOrg?.organizations || null;

      return {
        id: p.id,
        nickname: p.nickname || p.email?.split('@')[0] || 'Người dùng',
        fullName: p.full_name || p.nickname || 'Chưa cập nhật',
        email: p.email,
        role: p.role || 'LEARNER',
        planTier: p.plan_tier || 'FREE',
        points: p.points || 0,
        organization: orgRel
          ? { id: orgRel.id, name: orgRel.name, code: orgRel.code, orgRole: firstOrg?.org_role || 'MEMBER' }
          : null,
        submissionsCount: subCountMap[p.id] || 0,
        createdAt: p.created_at,
      };
    });

    return NextResponse.json({ users: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('GET /api/admin/users error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface PatchBody {
  userId: string;
  role?: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
  planTier?: 'FREE' | 'PRO' | 'ENTERPRISE';
  organizationId?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }
    const supabase = await createClient();

    const body: PatchBody = await request.json();
    const { userId, role, planTier, organizationId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    const updates: {
      updated_at: string;
      role?: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
      plan_tier?: 'FREE' | 'PRO' | 'ENTERPRISE';
    } = { updated_at: new Date().toISOString() };

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

    // Record audit log
    await recordAdminAudit({
      adminId: auth.user?.id,
      adminEmail: auth.user?.email,
      action: 'USER_ROLE_OR_PLAN_UPDATED',
      targetType: 'USER',
      targetId: userId,
      details: { role, planTier, organizationId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
