import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
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

    const rawId = (validated.data.identifier || validated.data.email || '').trim().toLowerCase();
    const { password } = validated.data;

    if (!rawId) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tài khoản' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let email = rawId;

    // If identifier doesn't have an @, check if it's a registered username or account
    if (!rawId.includes('@')) {
      const cleanUsername = rawId.replace(/^@/, '');
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', cleanUsername)
        .single();

      if (profileRow?.email) {
        email = profileRow.email;
      } else {
        email = `${cleanUsername}@nexa.edu.vn`;
      }
    }

    // 1. Sign in with password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Tài khoản hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // 2. Fetch profile and enforce Superadmin Authority
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username')
      .eq('id', authData.user.id)
      .single();

    const superadminConfig =
      process.env.SUPERADMIN_ACCOUNTS ||
      process.env.SUPERADMIN_EMAILS ||
      'admin,huy868762@gmail.com,admin@nexa.edu.vn';
    const superadminList = superadminConfig
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = (authData.user.email || '').toLowerCase();
    const userName = (profile?.username || '').toLowerCase();
    const isSuperadmin =
      (userName && superadminList.includes(userName)) ||
      (userEmail && superadminList.includes(userEmail)) ||
      userName === 'admin';

    let role = profile?.role || authData.user.user_metadata?.role || 'LEARNER';
    if (isSuperadmin) {
      role = 'ADMIN';
    } else if (role === 'ADMIN') {
      role = 'LEARNER';
    }

    let redirectUrl = '/learner/dashboard';
    if (role === 'ADMIN') {
      redirectUrl = '/admin/dashboard';
    } else if (role === 'EVALUATOR') {
      redirectUrl = '/evaluator/dashboard';
    } else if (role === 'LEARNER') {
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

    return NextResponse.json({
      success: true,
      role,
      redirectUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
