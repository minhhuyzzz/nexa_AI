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
