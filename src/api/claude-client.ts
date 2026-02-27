import { logger } from '../utils/logger';

const CLAUDE_API_BASE = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';

// Model tiers for different complexity levels
export type ClaudeModel = 'claude-sonnet-4-20250514' | 'claude-haiku-4-5-20251001';
const DEFAULT_MODEL: ClaudeModel = 'claude-sonnet-4-20250514';
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000]; // ms backoff

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

// ========================================
// Streaming Design Generation
// ========================================

export interface GenerateDesignCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

export interface GenerateDesignOptions {
  model?: ClaudeModel;
  maxTokens?: number;
  temperature?: number;
  /** Multi-turn messages for conversational refinement */
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Call Claude API with streaming to generate a design spec.
 * Supports prompt caching, model selection, retry logic, and multi-turn conversation.
 */
export async function generateDesign(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  callbacks: GenerateDesignCallbacks,
  signal?: AbortSignal,
  options?: GenerateDesignOptions,
): Promise<void> {
  const model = options?.model ?? DEFAULT_MODEL;
  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.3;

  // Build messages array — support multi-turn for refinement
  const messages = options?.messages
    ? [...options.messages, { role: 'user' as const, content: userMessage }]
    : [{ role: 'user' as const, content: userMessage }];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
          model,
          max_tokens: maxTokens,
          temperature,
          stream: true,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages,
        }),
        signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorMessage = `API error (${response.status})`;
        try {
          const parsed = JSON.parse(errorBody) as { error?: { message?: string } };
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          }
        } catch {
          // Use default error message
        }

        // Retry on overloaded (529) or server errors (500+)
        if ((response.status === 529 || response.status >= 500) && attempt < MAX_RETRIES) {
          logger.warn(`Claude API returned ${response.status}, retrying in ${RETRY_DELAYS[attempt]}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        callbacks.onError(errorMessage);
        return;
      }

      if (!response.body) {
        callbacks.onError('No response body — streaming not supported');
        return;
      }

      // Successfully connected, stream the response
      await streamResponse(response.body, callbacks);
      return;
    } catch (err) {
      if (signal?.aborted) {
        logger.info('Design generation cancelled by user');
        return;
      }

      // Retry on network errors
      if (attempt < MAX_RETRIES) {
        logger.warn(`Network error, retrying in ${RETRY_DELAYS[attempt]}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }

      logger.error('Design generation failed:', err);
      callbacks.onError(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}

/**
 * Stream and process an SSE response body.
 */
async function streamResponse(
  body: ReadableStream<Uint8Array>,
  callbacks: GenerateDesignCallbacks,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines from the buffer
    const lines = buffer.split('\n');
    // Keep the last (potentially incomplete) line in the buffer
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();

        if (data === '[DONE]') {
          callbacks.onComplete(fullText);
          return;
        }

        try {
          const event = JSON.parse(data) as SSEEvent;
          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullText += event.delta.text;
            callbacks.onChunk(event.delta.text);
          } else if (event.type === 'message_stop') {
            callbacks.onComplete(fullText);
            return;
          } else if (event.type === 'error') {
            const errMsg = (event as SSEErrorEvent).error?.message ?? 'Stream error';
            callbacks.onError(errMsg);
            return;
          }
        } catch {
          // Skip non-JSON lines (e.g. event: type lines)
        }
      }
    }
  }

  // If we exit the loop without an explicit message_stop, complete with what we have
  if (fullText.length > 0) {
    callbacks.onComplete(fullText);
  } else {
    callbacks.onError('Stream ended without content');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// SSE event types from Claude API
interface SSEEvent {
  type: string;
  delta?: {
    type?: string;
    text?: string;
  };
  index?: number;
}

interface SSEErrorEvent extends SSEEvent {
  error?: {
    type?: string;
    message?: string;
  };
}
