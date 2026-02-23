import { logger } from '../utils/logger';

const CLAUDE_API_BASE = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';

export interface ClaudeValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate a Claude API key by sending a minimal request. */
export async function validateClaudeKey(
  apiKey: string
): Promise<ClaudeValidationResult> {
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return { valid: false, error: 'API key must start with sk-ant-' };
  }

  try {
    const response = await fetch(`${CLAUDE_API_BASE}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });

    if (response.ok) {
      logger.info('Claude API key validated successfully');
      return { valid: true };
    }

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (response.status === 429) {
      // Rate limited but key is valid
      logger.warn('Claude API rate limited during validation');
      return { valid: true };
    }

    const body = await response.json().catch(() => ({}));
    return {
      valid: false,
      error: `API error (${response.status}): ${
        (body as { error?: { message?: string } }).error?.message ?? 'Unknown error'
      }`,
    };
  } catch (err) {
    logger.error('Claude API validation failed:', err);
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
