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
    const designSystem = await generateDesignSystem(input);

    rateLimitMap.set(ip, now);
    if (rateLimitMap.size > 10000) cleanRateLimitMap();

    return NextResponse.json({ designSystem });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Sign in and add your Gemini API key in Dashboard > API Keys to continue.' },
        { status: 503 },
      );
    }
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'AI service rate limit reached. Please wait a moment and try again.' },
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
