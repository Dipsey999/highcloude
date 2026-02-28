import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * Diagnostic endpoint for debugging auth issues on production.
 * DELETE THIS FILE once authentication is working.
 */
export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check environment variables (existence only, never expose values)
  results.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length ?? 0,
    AUTH_URL: process.env.AUTH_URL ?? 'NOT SET',
    AUTH_GITHUB_ID: !!process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_ID_PREFIX: process.env.AUTH_GITHUB_ID?.substring(0, 6) ?? 'NOT SET',
    AUTH_GITHUB_SECRET: !!process.env.AUTH_GITHUB_SECRET,
    AUTH_GITHUB_SECRET_LENGTH: process.env.AUTH_GITHUB_SECRET?.length ?? 0,
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_HOST: (() => {
      try {
        const url = new URL(process.env.DATABASE_URL ?? '');
        return url.hostname;
      } catch {
        return 'INVALID';
      }
    })(),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'NOT SET',
    VERCEL_URL: process.env.VERCEL_URL ?? 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };

  // 2. Test database connection
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    results.database = { connected: true };

    // Count tables
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    results.database = {
      connected: true,
      users: userCount,
      accounts: accountCount,
      sessions: sessionCount,
    };
  } catch (e: any) {
    results.database = {
      connected: false,
      error: e.message,
    };
  }

  // 3. Test auth() session retrieval
  try {
    const session = await auth();
    results.session = {
      exists: !!session,
      userId: session?.user?.id ?? null,
      userEmail: session?.user?.email ?? null,
    };
  } catch (e: any) {
    results.session = {
      exists: false,
      error: e.message,
    };
  }

  // 4. Check Auth.js internal route works
  try {
    const providersUrl = `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/auth/providers`;
    results.authProviders = {
      url: providersUrl,
      note: 'Fetch this URL separately to see configured providers and callback URLs',
    };
  } catch (e: any) {
    results.authProviders = { error: e.message };
  }

  // 5. Runtime info
  results.runtime = {
    timestamp: new Date().toISOString(),
    nextVersion: process.env.__NEXT_VERSION ?? 'unknown',
  };

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
