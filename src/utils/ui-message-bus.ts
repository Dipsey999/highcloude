/**
 * Message bus for use in the UI iframe ONLY.
 * This module does NOT reference the `figma` global,
 * making it safe to bundle into ui.html.
 */
import type { UIMessage, CodeMessage } from '../types/messages';

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
// Type Guard
// ========================================

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
  'DESIGN_CREATED',
  'DESIGN_CREATION_PROGRESS',
  'SELECTION_EXPORTED',
  'EXPORT_PROGRESS',
  'AUTO_MAP_RESULT',
  'AUTO_MAP_PROGRESS',
  'BINDINGS_APPLIED',
  // Phase 6
  'TOKEN_USAGE_RESULT',
  'TOKEN_VALUE_UPDATED',
  'VARIABLE_MODES_RESULT',
  'SYNC_HISTORY_LOADED',
  'SYNC_ENTRY_SAVED',
  'REVERT_COMPLETE',
  'SYNC_HISTORY_CLEARED',
  'BATCH_AUTO_MAP_ALL_RESULT',
  'BATCH_AUTO_MAP_ALL_PROGRESS',
  'DTCG_VALIDATION_RESULT',
  'UNUSED_TOKENS_RESULT',
  'ORPHANED_VALUES_RESULT',
  // Phase 7
  'SYNC_CONFIG_LOADED',
  'SYNC_CONFIG_SAVED',
  // Phase 8: Web Bridge
  'BRIDGE_TOKEN_LOADED',
  'BRIDGE_TOKEN_SAVED',
  'BRIDGE_TOKEN_CLEARED',
  'BRIDGE_CONFIG_RESULT',
  'BRIDGE_KEYS_RESULT',
]);

function isCodeMessage(msg: unknown): msg is CodeMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as { type: unknown }).type === 'string' &&
    CODE_MESSAGE_TYPES.has((msg as { type: string }).type)
  );
}
