import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { encrypt, decrypt, getHint } from '@/lib/encryption';

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
    return NextResponse.json({ hasKeys: false, claudeHint: null, githubHint: null });
  }

  return NextResponse.json({
    hasKeys: true,
    claudeHint: apiKeys.claudeKeyHint,
    githubHint: apiKeys.githubTokenHint,
  });
}

// POST /api/keys — save encrypted keys
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { claudeApiKey, githubToken } = body;

  if (!claudeApiKey && !githubToken) {
    return NextResponse.json({ error: 'At least one key is required' }, { status: 400 });
  }

  // Check if keys already exist (for merging partial updates)
  const existing = await prisma.apiKeys.findUnique({ where: { userId } });

  const claudeEnc = claudeApiKey ? encrypt(claudeApiKey) : (existing?.claudeKeyEnc ?? '');
  const githubEnc = githubToken ? encrypt(githubToken) : (existing?.githubTokenEnc ?? '');
  const claudeHintVal = claudeApiKey ? getHint(claudeApiKey) : (existing?.claudeKeyHint ?? null);
  const githubHintVal = githubToken ? getHint(githubToken) : (existing?.githubTokenHint ?? null);

  await prisma.apiKeys.upsert({
    where: { userId },
    update: {
      claudeKeyEnc: claudeEnc,
      githubTokenEnc: githubEnc,
      claudeKeyHint: claudeHintVal,
      githubTokenHint: githubHintVal,
    },
    create: {
      userId,
      claudeKeyEnc: claudeEnc,
      githubTokenEnc: githubEnc,
      claudeKeyHint: claudeHintVal,
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
