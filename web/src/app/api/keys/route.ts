import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { encrypt, getHint } from '@/lib/encryption';

// GET /api/keys — return hints (never raw keys)
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKeys = await prisma.apiKeys.findUnique({
    where: { userId },
  });

  if (!apiKeys) {
    return NextResponse.json({ hasKeys: false, githubHint: null });
  }

  return NextResponse.json({
    hasKeys: true,
    githubHint: apiKeys.githubTokenHint,
  });
}

// POST /api/keys — save encrypted GitHub token
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { githubToken } = body;

  if (!githubToken) {
    return NextResponse.json({ error: 'GitHub token is required' }, { status: 400 });
  }

  const githubEnc = encrypt(githubToken);
  const githubHintVal = getHint(githubToken);

  await prisma.apiKeys.upsert({
    where: { userId },
    update: {
      githubTokenEnc: githubEnc,
      githubTokenHint: githubHintVal,
    },
    create: {
      userId,
      githubTokenEnc: githubEnc,
      githubTokenHint: githubHintVal,
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/keys — remove all keys
export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.apiKeys.deleteMany({ where: { userId } });

  return NextResponse.json({ success: true });
}
