import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const supabase = await createClient();

    // 1. Sign in with password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      if (authError?.message.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json(
          { error: 'Email chưa được xác thực. Vui lòng mở liên kết xác thực trong hộp thư của bạn.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // 2. Fetch profile and enforce Superadmin Authority (email only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    const isSuperadmin = isSuperadminEmail(authData.user.email);

    let role = profile?.role || authData.user.user_metadata?.role || 'LEARNER';
    if (isSuperadmin) {
      role = 'ADMIN';
    } else if (role === 'ADMIN') {
      role = 'LEARNER';
    }

    let redirectUrl = '/personal/dashboard';
    let targetOrgId: string | null = null;
    let targetOrgSlug: string | null = null;

    if (role === 'ADMIN') {
      redirectUrl = '/admin/dashboard';
    } else {
      // 3. Check organization memberships
      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select(`
          organization_id,
          org_role,
          organizations (
            id,
            name,
            slug,
            is_active
          )
        `)
        .eq('user_id', authData.user.id)
        .eq('status', 'ACTIVE');

      interface OrgMemberRow {
        organization_id: string;
        org_role: string;
        organizations: {
          id: string;
          name: string;
          slug: string;
          is_active?: boolean;
        } | null;
      }

      const activeOrgs = ((userOrgs as unknown as OrgMemberRow[]) || [])
        .filter((m) => m.organizations && m.organizations.is_active !== false)
        .map((m) => ({
          id: m.organization_id,
          slug: m.organizations!.slug,
          name: m.organizations!.name,
          role: m.org_role,
        }));

      if (activeOrgs.length > 0) {
        const isOrgLeader = activeOrgs.some((o) =>
          ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(o.role)
        );
        if (isOrgLeader || role === 'EVALUATOR') {
          const primaryOrg = activeOrgs[0];
          redirectUrl = `/org/${primaryOrg.slug}`;
          targetOrgId = primaryOrg.id;
          targetOrgSlug = primaryOrg.slug;
        }
      }
    }

    if (role === 'LEARNER') {
      // Daily check-in: +1 point, total days + 1, streak logic
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const todayStr = formatter.format(now);
        const yesterdayStr = formatter.format(new Date(now.getTime() - 24 * 60 * 60 * 1000));

        const { data: p } = await supabase
          .from('profiles')
          .select('points, total_login_days, login_streak, last_login_date')
          .eq('id', authData.user.id)
          .single();

        if (p && p.last_login_date !== todayStr) {
          const nextPoints = (p.points ?? 0) + 1;
          const nextTotalDays = (p.total_login_days ?? 1) + 1;
          const nextStreak = p.last_login_date === yesterdayStr ? (p.login_streak ?? 1) + 1 : 1;

          await supabase
            .from('profiles')
            .update({
              points: nextPoints,
              total_login_days: nextTotalDays,
              login_streak: nextStreak,
              last_login_date: todayStr,
            })
            .eq('id', authData.user.id);
        }
      } catch (err) {
        console.error('Error in daily checkin during login:', err);
      }
    }

    const response = NextResponse.json({
      success: true,
      role,
      redirectUrl,
    });
    response.cookies.delete('nexa_demo_role');

    if (targetOrgId && targetOrgSlug) {
      response.cookies.set('nexa_active_workspace', `org_${targetOrgId}`, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
      response.cookies.set('nexa_active_org_slug', targetOrgSlug, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
    } else if (role !== 'ADMIN') {
      response.cookies.set('nexa_active_workspace', 'personal', {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
