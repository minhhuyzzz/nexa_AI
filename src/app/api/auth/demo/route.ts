import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Clear demo session if requested
  if (searchParams.get('action') === 'clear') {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('nexa_demo_role');
    return response;
  }

  // Get requested role
  const rawRole = searchParams.get('role')?.toUpperCase() || 'LEARNER';
  const validRoles = ['LEARNER', 'EVALUATOR', 'ADMIN'];
  const role = validRoles.includes(rawRole) ? rawRole : 'LEARNER';

  // Determine redirect target
  const defaultPath = `/${role.toLowerCase()}/dashboard`;
  const target = searchParams.get('target') || defaultPath;

  const response = NextResponse.redirect(new URL(target, request.url));

  // Set demo role cookie (7 days expiry for seamless testing)
  response.cookies.set('nexa_demo_role', role, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}
