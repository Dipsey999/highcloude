import type { UIMessage, CodeMessage } from '../types/messages';

// ========================================
// For use in code.ts (Main Thread)
// ========================================

/** Send a message from the main thread to the UI iframe. */
export function sendToUI(message: CodeMessage): void {
  figma.ui.postMessage(message);
}

/**
 * Register a typed handler for messages from the UI.
 * Returns an unsubscribe function.
 */
export function onUIMessage(handler: (msg: UIMessage) => void): () => void {
  figma.ui.onmessage = (msg: unknown) => {
    if (isUIMessage(msg)) {
      handler(msg);
    } else {
      console.warn('[Claude Bridge] Unknown message from UI:', msg);
    }
  };
  return () => {
    figma.ui.onmessage = undefined;
  };
}

// ========================================
// For use in UI iframe
// ========================================

/** Send a message from the UI iframe to the main thread. */
export function sendToCode(message: UIMessage): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

/**
 * Register a typed handler for messages from the main thread.
 * Returns an unsubscribe function.
 */
export function onCodeMessage(handler: (msg: CodeMessage) => void): () => void {
  const listener = (event: MessageEvent) => {
    const msg = event.data?.pluginMessage;
    if (msg && isCodeMessage(msg)) {
      handler(msg);
    }
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

// ========================================
// Type Guards
// ========================================

const UI_MESSAGE_TYPES: Set<string> = new Set([
  'SAVE_CREDENTIALS',
  'LOAD_CREDENTIALS',
  'CLEAR_CREDENTIALS',
  'EXTRACT_TOKENS',
  'GET_SELECTION',
  'APPLY_TOKENS',
]);

const CODE_MESSAGE_TYPES: Set<string> = new Set([
  'CREDENTIALS_LOADED',
  'CREDENTIALS_SAVED',
  'CREDENTIALS_CLEARED',
  'TOKENS_EXTRACTED',
  'EXTRACTION_PROGRESS',
  'SELECTION_DATA',
  'ERROR',
  'TOKENS_APPLIED',
  'APPLY_PROGRESS',
]);

function isUIMessage(msg: unknown): msg is UIMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    UI_MESSAGE_TYPES.has((msg as { type: string }).type)
  );
}

function isCodeMessage(msg: unknown): msg is CodeMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    CODE_MESSAGE_TYPES.has((msg as { type: string }).type)
  );
}
