import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const effectiveUserId = user?.id;

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, email, role, points, total_login_days, login_streak, last_login_date, avatar_url')
      .eq('id', effectiveUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ người dùng' }, { status: 404 });
    }

    // 3. User Points and Streak - Record daily attendance check-in
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(now);
    const yesterdayStr = formatter.format(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    let points = profile.points ?? 0;
    let totalLoginDays = profile.total_login_days ?? 0;
    let loginStreak = profile.login_streak ?? 0;
    let newLoginToday = false;

    if (profile.last_login_date !== todayStr) {
      newLoginToday = true;
      points = points + 1;
      totalLoginDays = (totalLoginDays || 0) + 1;
      loginStreak = profile.last_login_date === yesterdayStr ? (loginStreak || 0) + 1 : 1;

      await supabase
        .from('profiles')
        .update({
          points,
          total_login_days: totalLoginDays,
          login_streak: loginStreak,
          last_login_date: todayStr,
        })
        .eq('id', effectiveUserId);
    } else {
      totalLoginDays = Math.max(1, totalLoginDays);
      loginStreak = Math.max(1, loginStreak);
    }

    const lastLoginDate = todayStr;

    // 4. Activity Level (Gamification XP only - NOT competency certification!)
    let levelNumber = 1;
    let levelCode = 'Level 1: Basic';
    let levelNextTarget = 150;

    if (points >= 450) {
      levelNumber = 4;
      levelCode = 'Level 4: Highly Active';
      levelNextTarget = 450;
    } else if (points >= 300) {
      levelNumber = 3;
      levelCode = 'Level 3: Active';
      levelNextTarget = 450;
    } else if (points >= 150) {
      levelNumber = 2;
      levelCode = 'Level 2: Engaged';
      levelNextTarget = 300;
    }

    // 5. Official Competency Credentials - ONLY issued via valid assessment records (not XP points)
    const { data: credentials } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('is_revoked', false)
      .order('issued_at', { ascending: false })
      .limit(1);

    const masterCredential = credentials && credentials.length > 0 ? credentials[0] : null;
    const isCertificateUnlocked = masterCredential !== null;

    return NextResponse.json(
      {
        success: true,
        user: {
          id: effectiveUserId,
          email: profile.email || user?.email || '',
          nickname: profile.nickname,
          avatarUrl: profile.avatar_url || null,
          role: profile.role,
        },
        stats: {
          points, // Activity/gamification XP
          totalLoginDays,
          loginStreak,
          lastLoginDate: lastLoginDate || null,
          newLoginToday,
          level: {
            number: levelNumber,
            code: levelCode,
            nextTarget: levelNextTarget,
            progressPercentage: Math.min(100, Math.round((points / levelNextTarget) * 100)),
          },
          certificate: {
            isUnlocked: isCertificateUnlocked,
            credentialId: masterCredential?.id || null,
            credentialTitle: masterCredential?.title || null,
            issuedAt: masterCredential?.issued_at || null,
            status: isCertificateUnlocked ? 'ISSUED' : 'UNEARNED',
            masterCredential,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi lấy thông tin học viên';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
