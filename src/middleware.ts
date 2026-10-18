import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Identify route categories
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProtectedDashboard =
    pathname.startsWith('/learner') ||
    pathname.startsWith('/evaluator') ||
    pathname.startsWith('/admin');

  // 2. Fast check: Demo Test Mode (Bypass auth immediately for testing)
  const demoCookie = request.cookies.get('nexa_demo_role')?.value?.toUpperCase();
  const demoParam = request.nextUrl.searchParams.get('demo')?.toUpperCase();
  const activeDemoRole = demoParam || demoCookie;

  if (activeDemoRole && ['LEARNER', 'EVALUATOR', 'ADMIN'].includes(activeDemoRole)) {
    const res = NextResponse.next({ request });
    if (demoParam) {
      res.cookies.set('nexa_demo_role', demoParam, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return res;
  }

  // 3. Fast Short-Circuit: Public pages require ZERO auth checks or Supabase calls
  if (!isAuthPage && !isProtectedDashboard) {
    return NextResponse.next({ request });
  }

  // 4. Fast Cookie Check: If user has no Supabase auth cookie, avoid remote HTTPS calls
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some((c) => c.name.includes('-auth-token'));

  // If visiting protected dashboard without any auth cookie
  if (isProtectedDashboard && !hasAuthCookie) {
    // In development / prototype testing mode, automatically allow demo access for seamless testing
    if (process.env.NODE_ENV !== 'production' || activeDemoRole) {
      const res = NextResponse.next({ request });
      const inferredRole = pathname.startsWith('/evaluator')
        ? 'EVALUATOR'
        : pathname.startsWith('/admin')
        ? 'ADMIN'
        : 'LEARNER';
      res.cookies.set('nexa_demo_role', inferredRole, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If visiting /login or /register without any auth cookie -> immediate allow in 0ms
  if (isAuthPage && !hasAuthCookie) {
    return NextResponse.next({ request });
  }

  // 5. Authenticated flow: Only execute when an actual auth cookie exists
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If token is invalid or expired
  if (!user) {
    if (isProtectedDashboard) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // User is valid: Query profile and enforce RBAC
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'LEARNER';

  // If on /login or /register, redirect to corresponding dashboard
  if (isAuthPage) {
    const url = request.nextUrl.clone();
    if (role === 'ADMIN') url.pathname = '/admin/dashboard';
    else if (role === 'EVALUATOR') url.pathname = '/evaluator/dashboard';
    else url.pathname = '/learner/dashboard';
    return NextResponse.redirect(url);
  }

  // RBAC: Learner route strictly for LEARNER
  if (pathname.startsWith('/learner') && role !== 'LEARNER') {
    const url = request.nextUrl.clone();
    url.pathname = role === 'ADMIN' ? '/admin/dashboard' : '/evaluator/dashboard';
    return NextResponse.redirect(url);
  }

  // RBAC: Evaluator route strictly for EVALUATOR or ADMIN
  if (pathname.startsWith('/evaluator') && role !== 'EVALUATOR' && role !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/learner/dashboard';
    return NextResponse.redirect(url);
  }

  // RBAC: Admin route strictly for ADMIN
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = role === 'EVALUATOR' ? '/evaluator/dashboard' : '/learner/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
