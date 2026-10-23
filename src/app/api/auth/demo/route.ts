import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const REAL_ACCOUNTS: Record<string, { email: string; pass: string; defaultPath: string }> = {
  LEARNER: {
    email: 'learner@nexa.edu.vn',
    pass: 'Nexa@2026',
    defaultPath: '/learner/dashboard',
  },
  EVALUATOR: {
    email: 'evaluator@nexa.edu.vn',
    pass: 'Nexa@2026',
    defaultPath: '/evaluator/dashboard',
  },
  ADMIN: {
    email: 'admin.nexa@gmail.com',
    pass: 'Nexa@2026',
    defaultPath: '/admin/dashboard',
  },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Handle logout / clear
  if (searchParams.get('action') === 'clear') {
    const clearResponse = NextResponse.redirect(new URL('/', request.url));
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            clearResponse.cookies.set(name, value, options);
          });
        },
      },
    });
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearResponse.cookies.delete('nexa_demo_role');
    return clearResponse;
  }

  // Get requested role
  const rawRole = searchParams.get('role')?.toUpperCase() || 'LEARNER';
  const role = ['LEARNER', 'EVALUATOR', 'ADMIN'].includes(rawRole) ? rawRole : 'LEARNER';
  const acc = REAL_ACCOUNTS[role];
  const target = searchParams.get('target') || acc.defaultPath;

  const response = NextResponse.redirect(new URL(target, request.url));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Perform clean Supabase authentication with matching account credentials
  try {
    // Clear any previous session first to avoid role/profile collisions
    await supabase.auth.signOut();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });
    if (signInErr) {
      console.warn('Demo signIn note:', signInErr.message);
    }
  } catch (err) {
    console.error('Demo account authentication error:', err);
  }

  response.cookies.set('nexa_demo_role', role, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}

