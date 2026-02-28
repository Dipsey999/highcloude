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

  // Look up user's stored Gemini API key — required for generation
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
    // Decryption or DB lookup failed
  }

  if (!geminiApiKey) {
    return NextResponse.json(
      { error: 'Gemini API key required. Add your free key in Dashboard > API Keys to generate design systems.' },
      { status: 403 },
    );
  }

  try {
    const designSystem = await generateDesignSystem(input, geminiApiKey);
    return NextResponse.json({ designSystem });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Authenticated generation failed:', message);
    if (message.includes('API_KEY_INVALID') || message.includes('401') || message.includes('403')) {
      return NextResponse.json(
        { error: 'Your Gemini API key is invalid. Please update it in Dashboard > API Keys.' },
        { status: 403 },
      );
    }
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'Gemini rate limit reached. Please wait a moment and try again.' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: 'Design system generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
