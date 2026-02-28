/**
 * Groq API client for design system generation.
 * Uses Llama 3.3 70B — fast inference with generous free tier.
 * Free: 14,400 requests/day, 6,000 tokens/min.
 *
 * Falls back through models if rate limited:
 *   1. llama-3.3-70b-versatile (best quality)
 *   2. llama-3.1-8b-instant (fastest, highest limits)
 */

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

const RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGroq(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error(
      'No Groq API key provided. Add your key in Dashboard > API Keys.',
    );
  }

  let lastError: Error | null = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= 1; attempt++) {
      if (attempt > 0) {
        console.log(`Retrying ${model} after ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS);
      }

      try {
        console.log(`Calling Groq model: ${model} (attempt ${attempt + 1})`);

        const response = await fetch(GROQ_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 8192,
            temperature: 0.7,
          }),
        });

        if (response.status === 429) {
          const errorBody = await response.text();
          lastError = new Error(`Groq rate limited [${model}]: ${errorBody}`);
          console.warn(`${model} rate limited:`, errorBody);
          continue;
        }

        if (response.status === 401) {
          throw new Error('GROQ_API_KEY_INVALID: Your Groq API key is invalid.');
        }

        if (!response.ok) {
          const errorBody = await response.text();
          if (response.status === 404) {
            console.warn(`Model ${model} not available, trying next...`);
            lastError = new Error(`Model ${model} not found`);
            break;
          }
          throw new Error(`Groq API error (${response.status}) [${model}]: ${errorBody}`);
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;

        if (!text) {
          throw new Error(`${model} returned an empty or malformed response.`);
        }

        console.log(`Successfully generated with Groq ${model}`);
        return text;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (error.message.includes('429') || error.message.includes('rate')) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    if (lastError) {
      console.warn(`${model} exhausted retries, falling back to next model...`);
    }
  }

  throw lastError || new Error('All Groq models failed. Please try again later.');
}
