import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const response = NextResponse.redirect(`${origin}/learner/dashboard`);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie') || '';
          return cookieHeader
            .split(';')
            .map((c) => c.trim().split('='))
            .filter(([k, v]) => k && v)
            .map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const googleAvatar =
        data.user.user_metadata?.avatar_url ||
        data.user.user_metadata?.picture ||
        null;
      const googleFullName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        'Người dùng Nexa';

      // Check existing profile role & avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, avatar_url, username')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        // Sync avatar from Google if not set or updated
        if (googleAvatar && profile.avatar_url !== googleAvatar) {
          await supabase
            .from('profiles')
            .update({ avatar_url: googleAvatar, updated_at: new Date().toISOString() })
            .eq('id', data.user.id);
        }
      } else {
        // New user from Google: create default profile with Google avatar
        const defaultUsername = (data.user.email?.split('@')[0] || `user_${Date.now().toString().slice(-6)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');

        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: googleFullName,
          avatar_url: googleAvatar,
          username: defaultUsername,
          role: 'LEARNER',
          plan_tier: 'FREE',
          credits: 3,
          points: 100,
          rank_tier: 'NOVICE',
        });
      }

      let targetUrl = `${origin}/learner/dashboard`;
      if (profile?.role === 'ADMIN') {
        targetUrl = `${origin}/admin/dashboard`;
      } else if (profile?.role === 'EVALUATOR') {
        targetUrl = `${origin}/evaluator/dashboard`;
      }

      const finalResponse = NextResponse.redirect(targetUrl);
      // Transfer auth cookies
      response.cookies.getAll().forEach((cookie) => {
        finalResponse.cookies.set(cookie.name, cookie.value);
      });
      return finalResponse;
    }
  }

  // Return to login with error if OAuth failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
