/**
 * Google Gemini API client for design system generation.
 * Users provide their own Gemini API key (stored encrypted in the database).
 * Falls back to GEMINI_API_KEY env var only for development/testing.
 *
 * Tries multiple models in order of preference with automatic fallback:
 *   1. gemini-2.0-flash (best quality)
 *   2. gemini-2.0-flash-lite (higher free tier limits)
 *   3. gemini-1.5-flash (most widely available)
 */

const GEMINI_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

/** Models in order of preference — falls back on 429 / RESOURCE_EXHAUSTED */
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

const MAX_RETRIES_PER_MODEL = 1; // 1 retry per model before falling back
const RETRY_DELAY_MS = 2000;

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

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      if (attempt > 0) {
        console.log(`Retrying ${model} after ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS);
      }

      try {
        const endpoint = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
        console.log(`Calling Gemini model: ${model} (attempt ${attempt + 1})`);

        const response = await fetch(endpoint, {
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
          lastError = new Error(`Gemini API error (429) [${model}]: ${errorBody}`);
          console.warn(`${model} rate limited:`, errorBody);
          continue; // Retry this model
        }

        if (!response.ok) {
          const errorBody = await response.text();
          // If model not found, skip to next model
          if (response.status === 404) {
            console.warn(`Model ${model} not available, trying next...`);
            lastError = new Error(`Model ${model} not found`);
            break; // Skip retries, go to next model
          }
          throw new Error(`Gemini API error (${response.status}) [${model}]: ${errorBody}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error(`${model} returned an empty or malformed response.`);
        }

        console.log(`Successfully generated with ${model}`);
        return text;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
          lastError = error;
          continue; // Retry this model
        }
        throw error; // Non-rate-limit errors propagate immediately
      }
    }

    // This model exhausted retries — fall back to next model
    if (lastError) {
      console.warn(`${model} exhausted retries, falling back to next model...`);
    }
  }

  // All models exhausted
  throw lastError || new Error('All Gemini models failed. Please try again later.');
}
