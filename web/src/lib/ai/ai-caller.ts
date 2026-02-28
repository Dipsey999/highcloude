/**
 * Unified AI caller — routes to the correct provider based on user's stored keys.
 *
 * Provider priority (checks in this order):
 *   1. Groq      — Free, 14,400 req/day, Llama 3.3 70B
 *   2. Gemini    — Free, 1,500 req/day, Gemini 2.0 Flash
 *   3. OpenAI    — Paid, ~$0.01/generation, GPT-4o
 *   4. Claude    — Paid, ~$0.02/generation, Claude 3.5 Sonnet
 */

import { callGemini } from './gemini-client';
import { callGroq } from './groq-client';
import { callOpenAI } from './openai-client';
import { callClaude } from './claude-client';

export type AIProvider = 'groq' | 'gemini' | 'openai' | 'claude';

export interface AICredentials {
  provider: AIProvider;
  apiKey: string;
}

/**
 * Call the AI provider with a system prompt and user message.
 */
export async function callAI(
  systemPrompt: string,
  userMessage: string,
  credentials: AICredentials,
): Promise<string> {
  switch (credentials.provider) {
    case 'groq':
      return callGroq(systemPrompt, userMessage, credentials.apiKey);
    case 'gemini':
      return callGemini(systemPrompt, userMessage, credentials.apiKey);
    case 'openai':
      return callOpenAI(systemPrompt, userMessage, credentials.apiKey);
    case 'claude':
      return callClaude(systemPrompt, userMessage, credentials.apiKey);
    default:
      throw new Error(`Unknown AI provider: ${credentials.provider}`);
  }
}

/** Human-readable names for error messages */
export const PROVIDER_NAMES: Record<AIProvider, string> = {
  groq: 'Groq',
  gemini: 'Gemini',
  openai: 'OpenAI',
  claude: 'Claude',
};
