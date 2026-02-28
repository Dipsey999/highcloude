import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { refineDesignSystem } from '@/lib/ai/refinement-engine';
import type { GeneratedDesignSystem } from '@/lib/ai/types';
import type { AICredentials } from '@/lib/ai/ai-caller';
import { PROVIDER_NAMES } from '@/lib/ai/ai-caller';

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

  // Look up user's stored AI API keys — priority: Groq > Gemini > OpenAI > Claude
  let credentials: AICredentials | null = null;
  let keyLookupError: string | null = null;
  try {
    const apiKeys = await prisma.apiKeys.findUnique({
      where: { userId },
      select: {
        groqApiKeyEnc: true,
        geminiApiKeyEnc: true,
        openaiApiKeyEnc: true,
        claudeApiKeyEnc: true,
      },
    });

    if (apiKeys?.groqApiKeyEnc) {
      credentials = { provider: 'groq', apiKey: decrypt(apiKeys.groqApiKeyEnc) };
    } else if (apiKeys?.geminiApiKeyEnc) {
      credentials = { provider: 'gemini', apiKey: decrypt(apiKeys.geminiApiKeyEnc) };
    } else if (apiKeys?.openaiApiKeyEnc) {
      credentials = { provider: 'openai', apiKey: decrypt(apiKeys.openaiApiKeyEnc) };
    } else if (apiKeys?.claudeApiKeyEnc) {
      credentials = { provider: 'claude', apiKey: decrypt(apiKeys.claudeApiKeyEnc) };
    }
  } catch (err) {
    keyLookupError = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to retrieve/decrypt API key:', keyLookupError);
  }

  if (!credentials) {
    const error = keyLookupError
      ? 'Failed to decrypt your API key. Please re-save it in Dashboard > API Keys.'
      : 'No AI API key configured. Add at least one key (Groq, Gemini, OpenAI, or Claude) in Dashboard > API Keys.';
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    console.log(`Refining design system with ${credentials.provider}...`);
    const result = await refineDesignSystem(currentSystem, instruction, credentials);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const providerName = PROVIDER_NAMES[credentials.provider] || credentials.provider;
    console.error(`Refinement failed (${providerName}):`, message);

    if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { error: `Your ${providerName} API key is invalid. Please update it in Dashboard > API Keys.` },
        { status: 403 },
      );
    }
    if (message.includes('401')) {
      return NextResponse.json(
        { error: `Your ${providerName} API key was rejected. Please verify it in Dashboard > API Keys.` },
        { status: 403 },
      );
    }
    if (message.includes('402') || message.includes('billing')) {
      return NextResponse.json(
        { error: `${providerName} billing issue — check your account for available credits.` },
        { status: 402 },
      );
    }
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('rate')) {
      return NextResponse.json(
        { error: `${providerName} rate limit reached. Please wait a minute and try again.` },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: `Refinement failed (${providerName}): ${message}` },
      { status: 500 },
    );
  }
}
