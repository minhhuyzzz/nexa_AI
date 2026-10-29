import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Identify route categories
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isOnboardingPage = pathname === '/onboarding';
  const isAdminRoute = pathname.startsWith('/admin');
  const isProtectedDashboard =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/personal') ||
    pathname.startsWith('/org') ||
    pathname.startsWith('/learner') ||
    pathname.startsWith('/evaluator') ||
    isAdminRoute;

  // 2. Backward-compatibility redirect: /learner/* -> /personal/*
  if (pathname.startsWith('/learner/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/learner/', '/personal/');
    return NextResponse.redirect(url, 307);
  }
  // Backward-compatibility redirect: /learner or /dashboard -> /personal/dashboard
  if (pathname === '/learner' || pathname === '/dashboard') {
    const url = request.nextUrl.clone();
    url.pathname = '/personal/dashboard';
    return NextResponse.redirect(url, 307);
  }

  // Backward-compatibility redirect: /evaluator/* -> /personal/*
  if (pathname.startsWith('/evaluator')) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith('/evaluator/assessments')) {
      url.pathname = pathname.replace('/evaluator/assessments', '/personal/authoring');
    } else if (pathname.startsWith('/evaluator/live-room')) {
      url.pathname = pathname.replace('/evaluator/live-room', '/personal/live-room');
    } else if (pathname.startsWith('/evaluator/grading')) {
      url.pathname = pathname.replace('/evaluator/grading', '/personal/grading');
    } else if (pathname.startsWith('/evaluator/item-bank')) {
      url.pathname = pathname.replace('/evaluator/item-bank', '/personal/item-bank');
    } else if (pathname.startsWith('/evaluator/groups')) {
      url.pathname = pathname.replace('/evaluator/groups', '/personal/groups');
    } else {
      url.pathname = '/personal/dashboard';
    }
    return NextResponse.redirect(url, 307);
  }

  // 3. Fast check: Demo Test Mode for non-admin testing (NEVER bypass /admin)
  // Demo mode is ONLY allowed in development OR when explicit ENABLE_DEMO_MODE=true
  const isDemoPermitted =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_MODE === 'true';

  const demoCookie = request.cookies.get('nexa_demo_role')?.value?.toUpperCase();
  const demoParam = request.nextUrl.searchParams.get('demo')?.toUpperCase();
  const activeDemoRole = isDemoPermitted ? (demoParam || demoCookie) : undefined;

  if (isDemoPermitted && !isAdminRoute && activeDemoRole && ['LEARNER', 'EVALUATOR', 'USER'].includes(activeDemoRole)) {
    const res = NextResponse.next({ request });
    if (demoParam) {
      res.cookies.set('nexa_demo_role', demoParam, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return res;
  }

  // 4. Fast Short-Circuit: Public pages require ZERO auth checks or remote calls
  if (!isAuthPage && !isOnboardingPage && !isProtectedDashboard) {
    return NextResponse.next({ request });
  }

  // 5. Fast Cookie Check: If user has no Supabase auth cookie, avoid remote HTTPS calls
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some((c) => c.name.includes('-auth-token'));

  // If visiting protected dashboard or onboarding without any auth cookie
  if ((isProtectedDashboard || isOnboardingPage) && !hasAuthCookie) {
    // Admin routes and onboarding strictly require real authentication
    if (isAdminRoute || isOnboardingPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // In development / prototype testing mode, allow demo access if permitted
    if (isDemoPermitted && activeDemoRole) {
      const res = NextResponse.next({ request });
      const inferredRole = activeDemoRole || 'USER';
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

  // 6. Authenticated flow: Only execute when an actual auth cookie exists
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

  // Query profile to get role and onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_onboarded')
    .eq('id', user.id)
    .single();

  // Superadmin Master Authority: email whitelist only
  const isSuperadmin = isSuperadminEmail(user.email);

  // If user has not completed onboarding, force them to /onboarding
  if (profile && profile.is_onboarded === false) {
    if (!isOnboardingPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // If user is already onboarded but visits /onboarding, redirect to their dashboard
  if (isOnboardingPage) {
    const url = request.nextUrl.clone();
    url.pathname = isSuperadmin ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // If on /login or /register, redirect to corresponding dashboard
  if (isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = isSuperadmin ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // RBAC: Admin route strictly for verified Superadmin email
  if (isAdminRoute && !isSuperadmin) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|_not-found|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
