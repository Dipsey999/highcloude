import { signPluginToken } from '@/lib/jwt';
import { getSessionUserId } from '@/lib/session';
import { corsJson, corsOptions } from '@/lib/cors';

// POST /api/plugin/auth — generate a plugin JWT for the authenticated user
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return corsJson({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await signPluginToken(userId);

  return corsJson({ token, expiresIn: '24h' });
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return corsOptions();
}
