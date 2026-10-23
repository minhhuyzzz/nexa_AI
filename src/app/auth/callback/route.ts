import { NextResponse } from 'next/server';
import {
  createServerClient,
  parseCookieHeader,
  type CookieOptions,
} from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const otpType = searchParams.get('type') as EmailOtpType | null;

  // Hỗ trợ cả 2 dạng liên kết của Supabase: PKCE (?code=) và email OTP (?token_hash=&type=)
  if (!code && !(tokenHash && otpType)) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Giữ nguyên cookie + options do Supabase trả về để không mất httpOnly/secure/maxAge
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie') ?? '');
      },
      setAll(nextCookies: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.push(...nextCookies);
      },
    },
  });

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: otpType! });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Profile được tạo tự động bởi trigger public.handle_new_user()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, avatar_url, is_onboarded')
    .eq('id', data.user.id)
    .single();

  const googleAvatar =
    data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null;

  if (profile && googleAvatar && profile.avatar_url !== googleAvatar) {
    await supabase
      .from('profiles')
      .update({ avatar_url: googleAvatar, updated_at: new Date().toISOString() })
      .eq('id', data.user.id);
  }

  let targetPath = '/learner/dashboard';
  if (profile && profile.is_onboarded === false) {
    targetPath = '/onboarding';
  } else if (profile?.role === 'ADMIN') {
    targetPath = '/admin/dashboard';
  } else if (profile?.role === 'EVALUATOR') {
    targetPath = '/evaluator/dashboard';
  }

  const finalResponse = NextResponse.redirect(`${origin}${targetPath}`);
  cookiesToSet.forEach(({ name, value, options }) => {
    finalResponse.cookies.set(name, value, options);
  });

  return finalResponse;
}
