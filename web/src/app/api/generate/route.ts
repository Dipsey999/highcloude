import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { generateDesignSystem } from '@/lib/ai/system-generator';
import type { OnboardingInput } from '@/lib/ai/types';

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKeys = await prisma.apiKeys.findUnique({ where: { userId } });
  if (!apiKeys?.claudeApiKeyEnc) {
    return NextResponse.json(
      { error: 'Claude API key not configured. Add it in Dashboard > API Keys.' },
      { status: 400 },
    );
  }

  let claudeApiKey: string;
  try {
    claudeApiKey = decrypt(apiKeys.claudeApiKeyEnc);
  } catch {
    return NextResponse.json(
      { error: 'Failed to decrypt Claude API key. Please re-enter it in API Keys settings.' },
      { status: 500 },
    );
  }

  let body: { input?: OnboardingInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { input } = body;
  if (!input?.productDescription || input.productDescription.trim().length < 10) {
    return NextResponse.json(
      { error: 'Please provide a product description (at least 10 characters).' },
      { status: 400 },
    );
  }

  try {
    const designSystem = await generateDesignSystem(input, claudeApiKey);
    return NextResponse.json({ designSystem });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('401') || message.includes('invalid_api_key')) {
      return NextResponse.json(
        { error: 'Your stored Claude API key is invalid. Please update it in API Keys settings.' },
        { status: 401 },
      );
    }
    console.error('Authenticated generation failed:', message);
    return NextResponse.json(
      { error: 'Design system generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
