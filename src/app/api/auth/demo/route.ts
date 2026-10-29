import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

interface WorkspaceTarget {
  email: string;
  pass: string;
  defaultPath: string;
  activeWorkspaceId: string;
}

const DEMO_TARGETS: Record<string, WorkspaceTarget> = {
  PERSONAL: {
    email: 'learner@nexa.edu.vn',
    pass: 'Nexa@2026',
    defaultPath: '/personal/dashboard',
    activeWorkspaceId: 'personal',
  },
  ORG: {
    email: 'learner@nexa.edu.vn',
    pass: 'Nexa@2026',
    defaultPath: '/org/fpt-polytechnic',
    activeWorkspaceId: 'org_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  },
  ADMIN: {
    email: 'admin.nexa@gmail.com',
    pass: 'Nexa@2026',
    defaultPath: '/admin/dashboard',
    activeWorkspaceId: 'admin',
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
    clearResponse.cookies.delete('nexa_active_workspace');
    return clearResponse;
  }

  // Determine requested space (supports space or role param)
  const rawParam = (searchParams.get('space') || searchParams.get('role') || 'PERSONAL').toUpperCase();
  let selectedSpace = 'PERSONAL';
  if (['ORG', 'ORGANIZATION', 'SCHOOL'].includes(rawParam)) {
    selectedSpace = 'ORG';
  } else if (['ADMIN', 'SUPERADMIN'].includes(rawParam)) {
    selectedSpace = 'ADMIN';
  } else {
    selectedSpace = 'PERSONAL';
  }

  const targetConfig = DEMO_TARGETS[selectedSpace];
  const target = searchParams.get('target') || targetConfig.defaultPath;

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
    await supabase.auth.signOut();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: targetConfig.email,
      password: targetConfig.pass,
    });
    if (signInErr) {
      console.warn('Demo signIn note:', signInErr.message);
    }
  } catch (err) {
    console.error('Demo account authentication error:', err);
  }

  // Set cookies for workspace and demo role
  response.cookies.set('nexa_active_workspace', targetConfig.activeWorkspaceId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    httpOnly: false,
  });

  response.cookies.set('nexa_demo_role', selectedSpace, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}

