import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { refineDesignSystem } from '@/lib/ai/refinement-engine';
import type { GeneratedDesignSystem } from '@/lib/ai/types';

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKeys = await prisma.apiKeys.findUnique({ where: { userId } });
  if (!apiKeys?.claudeApiKeyEnc) {
    return NextResponse.json(
      { error: 'Claude API key not configured.' },
      { status: 400 },
    );
  }

  let claudeApiKey: string;
  try {
    claudeApiKey = decrypt(apiKeys.claudeApiKeyEnc);
  } catch {
    return NextResponse.json(
      { error: 'Failed to decrypt Claude API key.' },
      { status: 500 },
    );
  }

  let body: { currentSystem?: GeneratedDesignSystem; instruction?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { currentSystem, instruction } = body;
  if (!currentSystem || !instruction) {
    return NextResponse.json(
      { error: 'Both currentSystem and instruction are required.' },
      { status: 400 },
    );
  }

  try {
    const result = await refineDesignSystem(currentSystem, instruction, claudeApiKey);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Refinement failed:', message);
    return NextResponse.json(
      { error: 'Refinement failed. Please try again.' },
      { status: 500 },
    );
  }
}
