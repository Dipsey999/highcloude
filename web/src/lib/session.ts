import { auth } from './auth';
import { redirect } from 'next/navigation';

/**
 * Get the authenticated session or redirect to login.
 * Use in server components and API routes.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session;
}

/**
 * Get the authenticated user ID or return null.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
