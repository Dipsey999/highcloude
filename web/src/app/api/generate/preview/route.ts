import { NextRequest, NextResponse } from 'next/server';
import { generateDesignSystem } from '@/lib/ai/system-generator';
import type { OnboardingInput } from '@/lib/ai/types';

// Simple in-memory rate limiter (1 generation per IP per hour)
const rateLimitMap = new Map<string, number>();

function cleanRateLimitMap() {
  const cutoff = Date.now() - 3600000;
  for (const [key, timestamp] of rateLimitMap) {
    if (timestamp < cutoff) rateLimitMap.delete(key);
  }
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const lastGeneration = rateLimitMap.get(ip);
  if (lastGeneration && now - lastGeneration < 3600000) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. One generation per hour for unauthenticated users. Sign in for unlimited access.' },
      { status: 429 },
    );
  }

  let body: { input?: OnboardingInput; claudeApiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { input, claudeApiKey } = body;

  if (!claudeApiKey || !claudeApiKey.startsWith('sk-ant-')) {
    return NextResponse.json(
      { error: 'A valid Claude API key is required. Keys start with sk-ant-.' },
      { status: 400 },
    );
  }

  if (!input?.productDescription || input.productDescription.trim().length < 10) {
    return NextResponse.json(
      { error: 'Please provide a product description (at least 10 characters).' },
      { status: 400 },
    );
  }

  try {
    const designSystem = await generateDesignSystem(input, claudeApiKey);

    rateLimitMap.set(ip, now);
    if (rateLimitMap.size > 10000) cleanRateLimitMap();

    return NextResponse.json({ designSystem });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('401') || message.includes('invalid_api_key') || message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Invalid Claude API key. Please check your key and try again.' },
        { status: 401 },
      );
    }
    if (message.includes('429') || message.includes('rate_limit')) {
      return NextResponse.json(
        { error: 'Claude API rate limit reached. Please wait a moment and try again.' },
        { status: 429 },
      );
    }
    console.error('Generation failed:', message);
    return NextResponse.json(
      { error: 'Design system generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
