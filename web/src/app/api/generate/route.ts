import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
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

  try {
    const designSystem = await generateDesignSystem(input);
    return NextResponse.json({ designSystem });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Authenticated generation failed:', message);
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact the administrator.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'Design system generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
