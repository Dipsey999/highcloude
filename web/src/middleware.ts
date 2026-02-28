import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';

/**
 * Use the edge-compatible auth config (no Prisma adapter) for middleware.
 * The full config with PrismaAdapter only runs in the Node.js runtime
 * (route handler at /api/auth/[...nextauth]).
 *
 * Auth.js v5 wraps the middleware function and adds `req.auth` to the request.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
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

  // Auth check for dashboard routes — redirect to Auth.js sign-in if not authenticated
  if (!req.auth && pathname.startsWith('/dashboard')) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}) as any;

export const config = {
  matcher: ['/dashboard/:path*', '/api/plugin/:path*'],
};
