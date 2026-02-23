/**
 * Multi-turn streaming Claude chat client.
 * Unlike generateDesign which does single-turn JSON generation,
 * this manages a conversation history and returns raw text.
 */

import type { ChatMessage } from '../types/messages';

interface ChatCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

export async function sendChatMessage(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string,
  callbacks: ChatCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.5,
        system: systemPrompt,
        messages: apiMessages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      callbacks.onError(`API error ${response.status}: ${errorText}`);
      return;
    }

    if (!response.body) {
      callbacks.onError('No response body');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              const text = event.delta.text;
              fullText += text;
              callbacks.onChunk(text);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (err) {
    if (signal?.aborted) return;
    callbacks.onError(err instanceof Error ? err.message : 'Unknown error');
  }
}
