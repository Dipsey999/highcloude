/**
 * OpenAI API client for design system generation.
 * Uses GPT-4o — paid tier (~$0.01 per generation).
 */

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

export async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error('No OpenAI API key provided. Add your key in Dashboard > API Keys.');
  }

  console.log(`Calling OpenAI model: ${MODEL}`);

  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    }),
  });

  if (response.status === 401) {
    throw new Error('OPENAI_API_KEY_INVALID: Your OpenAI API key is invalid.');
  }

  if (response.status === 429) {
    throw new Error('OpenAI rate limit reached. Please wait and try again.');
  }

  if (response.status === 402 || response.status === 403) {
    throw new Error('OpenAI billing issue. Check your usage at platform.openai.com.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('OpenAI returned an empty or malformed response.');
  }

  console.log('Successfully generated with OpenAI GPT-4o');
  return text;
}
