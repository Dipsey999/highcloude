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
  'CREATE_DESIGN',
  'EXPORT_SELECTION',
  'AUTO_MAP_TOKENS',
  'APPLY_TOKEN_BINDINGS',
  // Phase 6
  'GET_TOKEN_USAGE',
  'UPDATE_TOKEN_VALUE',
  'GET_VARIABLE_MODES',
  'LOAD_SYNC_HISTORY',
  'SAVE_SYNC_ENTRY',
  'REVERT_TO_SYNC',
  'CLEAR_SYNC_HISTORY',
  'BATCH_AUTO_MAP_ALL_PAGES',
  'VALIDATE_TOKENS_DTCG',
  'FIND_UNUSED_TOKENS',
  'FIND_ORPHANED_VALUES',
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
