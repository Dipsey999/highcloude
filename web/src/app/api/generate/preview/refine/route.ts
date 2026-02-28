import { NextRequest, NextResponse } from 'next/server';
import { refineDesignSystem } from '@/lib/ai/refinement-engine';
import type { GeneratedDesignSystem } from '@/lib/ai/types';

// Shared rate limiter (generous for refinements — 10/hour/IP)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => t > hourAgo);
  rateLimitMap.set(ip, timestamps);
  return timestamps.length >= 10;
}

function recordUsage(ip: string) {
  const timestamps = rateLimitMap.get(ip) || [];
  timestamps.push(Date.now());
  rateLimitMap.set(ip, timestamps);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for refinements. Sign in for unlimited access.' },
      { status: 429 },
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
    const result = await refineDesignSystem(currentSystem, instruction);
    recordUsage(ip);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Pre-signup refinement failed:', message);
    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Sign in and add your Gemini API key in Dashboard > API Keys to continue.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'Refinement failed. Please try again.' },
      { status: 500 },
    );
  }
}
