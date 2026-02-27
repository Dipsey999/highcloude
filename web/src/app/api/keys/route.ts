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
    return NextResponse.json({
      hasKeys: false,
      githubHint: null,
      claudeHint: null,
      hasClaudeKey: false,
    });
  }

  return NextResponse.json({
    hasKeys: true,
    githubHint: apiKeys.githubTokenHint,
    claudeHint: apiKeys.claudeApiKeyHint ?? null,
    hasClaudeKey: !!apiKeys.claudeApiKeyEnc,
  });
}

// POST /api/keys — save encrypted keys (GitHub token and/or Claude API key)
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { githubToken, claudeApiKey } = body;

  if (!githubToken && !claudeApiKey) {
    return NextResponse.json({ error: 'At least one key is required' }, { status: 400 });
  }

  const updateData: Record<string, string> = {};

  if (githubToken) {
    updateData.githubTokenEnc = encrypt(githubToken);
    updateData.githubTokenHint = getHint(githubToken);
  }

  if (claudeApiKey) {
    updateData.claudeApiKeyEnc = encrypt(claudeApiKey);
    updateData.claudeApiKeyHint = getHint(claudeApiKey);
  }

  await prisma.apiKeys.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      githubTokenEnc: updateData.githubTokenEnc ?? '',
      githubTokenHint: updateData.githubTokenHint,
      claudeApiKeyEnc: updateData.claudeApiKeyEnc,
      claudeApiKeyHint: updateData.claudeApiKeyHint,
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/keys — remove keys (all or specific)
// ?key=claude — delete only Claude API key
// ?key=github — delete only GitHub token
// no param — delete entire record
export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keyType = req.nextUrl.searchParams.get('key');

  if (keyType === 'claude') {
    await prisma.apiKeys.update({
      where: { userId },
      data: { claudeApiKeyEnc: null, claudeApiKeyHint: null },
    });
  } else if (keyType === 'github') {
    await prisma.apiKeys.update({
      where: { userId },
      data: { githubTokenEnc: '', githubTokenHint: null },
    });
  } else {
    await prisma.apiKeys.deleteMany({ where: { userId } });
  }

  return NextResponse.json({ success: true });
}
