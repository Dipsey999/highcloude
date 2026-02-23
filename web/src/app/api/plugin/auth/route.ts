import { NextRequest, NextResponse } from 'next/server';
import { signPluginToken } from '@/lib/jwt';
import { getSessionUserId } from '@/lib/session';

// POST /api/plugin/auth — generate a plugin JWT for the authenticated user
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await signPluginToken(userId);

  return NextResponse.json({ token, expiresIn: '24h' });
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.figma.com',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  });
}
