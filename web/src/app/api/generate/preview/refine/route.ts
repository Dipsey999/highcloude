import { NextResponse } from 'next/server';

// Preview refinement requires sign-in — users must add their own Gemini API key
export async function POST() {
  return NextResponse.json(
    { error: 'Sign in and add your free Gemini API key in Dashboard > API Keys to refine design systems.' },
    { status: 403 },
  );
}
