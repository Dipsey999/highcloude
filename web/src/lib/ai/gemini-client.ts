/**
 * Google Gemini 2.0 Flash API client for design system generation.
 * Users provide their own Gemini API key (stored encrypted in the database).
 * Falls back to GEMINI_API_KEY env var only for development/testing.
 * Includes automatic retry with exponential backoff for rate limits.
 */

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000; // 2 seconds

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  apiKeyOverride?: string,
): Promise<string> {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'No Gemini API key provided. Add your key in Dashboard > API Keys.',
    );
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Gemini retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
      await sleep(delay);
    }

    try {
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
          },
        }),
      });

      if (response.status === 429) {
        const errorBody = await response.text();
        lastError = new Error(`Gemini API error (429): ${errorBody}`);
        console.warn(`Gemini rate limited (attempt ${attempt + 1}):`, errorBody);
        continue; // Retry
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini returned an empty or malformed response.');
      }

      return text;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      // Only retry on rate limits (429), not on other errors
      if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  // All retries exhausted
  throw lastError || new Error('Gemini API call failed after retries.');
}
