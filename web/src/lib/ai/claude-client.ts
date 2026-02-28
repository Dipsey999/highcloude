/**
 * Anthropic Claude API client for design system generation.
 * Uses Claude 3.5 Sonnet — paid tier (~$0.02 per generation).
 */

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error('No Claude API key provided. Add your key in Dashboard > API Keys.');
  }

  console.log(`Calling Anthropic model: ${MODEL}`);

  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (response.status === 401) {
    throw new Error('CLAUDE_API_KEY_INVALID: Your Claude API key is invalid.');
  }

  if (response.status === 429) {
    throw new Error('Claude rate limit reached. Please wait and try again.');
  }

  if (response.status === 402 || response.status === 403) {
    throw new Error('Claude billing issue. Check your usage at console.anthropic.com.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;

  if (!text) {
    throw new Error('Claude returned an empty or malformed response.');
  }

  console.log('Successfully generated with Claude');
  return text;
}
