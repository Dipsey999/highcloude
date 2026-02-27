import { NextRequest } from 'next/server';
import { verifyPluginToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { corsJson, corsOptions } from '@/lib/cors';

// GET /api/plugin/keys — fetch decrypted GitHub token (requires JWT)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return corsJson({ error: 'Missing authorization token' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const userId = await verifyPluginToken(token);
  if (!userId) {
    return corsJson({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const apiKeys = await prisma.apiKeys.findUnique({
    where: { userId },
  });

  if (!apiKeys) {
    return corsJson({ error: 'No API keys configured' }, { status: 404 });
  }

  const result: Record<string, string> = {};

  if (apiKeys.githubTokenEnc) {
    try {
      result.githubToken = decrypt(apiKeys.githubTokenEnc);
    } catch {
      return corsJson({ error: 'Failed to decrypt GitHub token' }, { status: 500 });
    }
  }

  return corsJson(result);
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return corsOptions();
}
