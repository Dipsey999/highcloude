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
  let keyLookupError: string | null = null;
  try {
    const apiKeys = await prisma.apiKeys.findUnique({
      where: { userId },
      select: { geminiApiKeyEnc: true },
    });
    if (apiKeys?.geminiApiKeyEnc) {
      geminiApiKey = decrypt(apiKeys.geminiApiKeyEnc);
    }
  } catch (err) {
    keyLookupError = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to retrieve/decrypt Gemini API key:', keyLookupError);
  }

  if (!geminiApiKey) {
    const error = keyLookupError
      ? 'Failed to decrypt your Gemini API key. Please re-save it in Dashboard > API Keys.'
      : 'Gemini API key required. Add your free key in Dashboard > API Keys to generate design systems.';
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    const designSystem = await generateDesignSystem(input, geminiApiKey);
    return NextResponse.json({ designSystem });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Authenticated generation failed:', message);
    if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { error: 'Your Gemini API key is invalid or the Generative Language API is not enabled. Check your key in Dashboard > API Keys and ensure the API is enabled at console.cloud.google.com.' },
        { status: 403 },
      );
    }
    if (message.includes('401') || message.includes('403')) {
      return NextResponse.json(
        { error: 'Your Gemini API key was rejected by Google. Please verify it in Dashboard > API Keys.' },
        { status: 403 },
      );
    }
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'Gemini API quota exhausted even after retries. Your free tier limit may have been reached — wait a minute or check your quota at console.cloud.google.com.' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 500 },
    );
  }
}
