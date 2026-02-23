import { NextRequest, NextResponse } from 'next/server';
import { verifyPluginToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

// GET /api/plugin/keys — fetch decrypted API keys (requires JWT)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const userId = await verifyPluginToken(token);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const apiKeys = await prisma.apiKeys.findUnique({
    where: { userId },
  });

  if (!apiKeys) {
    return NextResponse.json({ error: 'No API keys configured' }, { status: 404 });
  }

  const result: Record<string, string> = {};

  if (apiKeys.claudeKeyEnc) {
    try {
      result.claudeApiKey = decrypt(apiKeys.claudeKeyEnc);
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt Claude key' }, { status: 500 });
    }
  }

  if (apiKeys.githubTokenEnc) {
    try {
      result.githubToken = decrypt(apiKeys.githubTokenEnc);
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt GitHub token' }, { status: 500 });
    }
  }

  return NextResponse.json(result);
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.figma.com',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  });
}
