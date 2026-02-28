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

  // Look up user's stored Gemini API key (optional — falls back to server env var)
  let geminiApiKey: string | undefined;
  try {
    const apiKeys = await prisma.apiKeys.findUnique({
      where: { userId },
      select: { geminiApiKeyEnc: true },
    });
    if (apiKeys?.geminiApiKeyEnc) {
      geminiApiKey = decrypt(apiKeys.geminiApiKeyEnc);
    }
  } catch {
    // If key lookup fails, proceed with server env var
  }

  try {
    const result = await refineDesignSystem(currentSystem, instruction, geminiApiKey);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Refinement failed:', message);
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add your key in Dashboard > API Keys to refine design systems.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'Refinement failed. Please try again.' },
      { status: 500 },
    );
  }
}
