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
      groqHint: null,
      hasGroqKey: false,
      geminiHint: null,
      hasGeminiKey: false,
      openaiHint: null,
      hasOpenaiKey: false,
      claudeHint: null,
      hasClaudeKey: false,
    });
  }

  return NextResponse.json({
    hasKeys: true,
    githubHint: apiKeys.githubTokenHint,
    groqHint: apiKeys.groqApiKeyHint ?? null,
    hasGroqKey: !!apiKeys.groqApiKeyEnc,
    geminiHint: apiKeys.geminiApiKeyHint ?? null,
    hasGeminiKey: !!apiKeys.geminiApiKeyEnc,
    openaiHint: apiKeys.openaiApiKeyHint ?? null,
    hasOpenaiKey: !!apiKeys.openaiApiKeyEnc,
    claudeHint: apiKeys.claudeApiKeyHint ?? null,
    hasClaudeKey: !!apiKeys.claudeApiKeyEnc,
  });
}

// POST /api/keys — save encrypted keys
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { githubToken, groqApiKey, geminiApiKey, openaiApiKey, claudeApiKey } = body;

  if (!githubToken && !groqApiKey && !geminiApiKey && !openaiApiKey && !claudeApiKey) {
    return NextResponse.json({ error: 'At least one key is required' }, { status: 400 });
  }

  const updateData: Record<string, string> = {};

  if (githubToken) {
    updateData.githubTokenEnc = encrypt(githubToken);
    updateData.githubTokenHint = getHint(githubToken);
  }
  if (groqApiKey) {
    updateData.groqApiKeyEnc = encrypt(groqApiKey);
    updateData.groqApiKeyHint = getHint(groqApiKey);
  }
  if (geminiApiKey) {
    updateData.geminiApiKeyEnc = encrypt(geminiApiKey);
    updateData.geminiApiKeyHint = getHint(geminiApiKey);
  }
  if (openaiApiKey) {
    updateData.openaiApiKeyEnc = encrypt(openaiApiKey);
    updateData.openaiApiKeyHint = getHint(openaiApiKey);
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
      groqApiKeyEnc: updateData.groqApiKeyEnc,
      groqApiKeyHint: updateData.groqApiKeyHint,
      geminiApiKeyEnc: updateData.geminiApiKeyEnc,
      geminiApiKeyHint: updateData.geminiApiKeyHint,
      openaiApiKeyEnc: updateData.openaiApiKeyEnc,
      openaiApiKeyHint: updateData.openaiApiKeyHint,
      claudeApiKeyEnc: updateData.claudeApiKeyEnc,
      claudeApiKeyHint: updateData.claudeApiKeyHint,
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/keys — remove keys (all or specific)
export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keyType = req.nextUrl.searchParams.get('key');

  if (keyType === 'groq') {
    await prisma.apiKeys.update({
      where: { userId },
      data: { groqApiKeyEnc: null, groqApiKeyHint: null },
    });
  } else if (keyType === 'gemini') {
    await prisma.apiKeys.update({
      where: { userId },
      data: { geminiApiKeyEnc: null, geminiApiKeyHint: null },
    });
  } else if (keyType === 'openai') {
    await prisma.apiKeys.update({
      where: { userId },
      data: { openaiApiKeyEnc: null, openaiApiKeyHint: null },
    });
  } else if (keyType === 'claude') {
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
