import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for CORS (plugin routes) and auth gating (dashboard routes).
 *
 * IMPORTANT: We use a plain Next.js middleware here instead of the Auth.js
 * `auth()` wrapper because our auth uses *database* sessions with PrismaAdapter.
 * The Edge Runtime (where middleware runs) cannot access the database, so
 * `req.auth` from the Auth.js middleware wrapper would ALWAYS be null.
 *
 * Instead, we check for the session cookie *existence* here (cheap edge check),
 * and the actual session validation happens in server components / API routes
 * via the full `auth()` call from `@/lib/auth`.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CORS for plugin API routes
  if (pathname.startsWith('/api/plugin/')) {
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
      });
    }

    // For actual requests, continue and add CORS headers
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return response;
  }

  // Auth check for dashboard routes — redirect to sign-in if no session cookie
  if (pathname.startsWith('/dashboard')) {
    const hasSession =
      req.cookies.has('authjs.session-token') ||
      req.cookies.has('__Secure-authjs.session-token');

    if (!hasSession) {
      const signInUrl = new URL('/login', req.nextUrl.origin);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/plugin/:path*'],
};
