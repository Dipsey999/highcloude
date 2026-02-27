/**
 * Message bus for use in code.ts (Main Thread) ONLY.
 * This module references the `figma` global which is only available
 * in Figma's plugin sandbox. Do NOT import this from UI code.
 *
 * For UI iframe messaging, use `ui-message-bus.ts` instead.
 */
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
      console.warn('[Cosmikit] Unknown message from UI:', msg);
    }
  };
  return () => {
    figma.ui.onmessage = undefined;
  };
}

// ========================================
// Type Guard
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
  // Phase 7
  'SAVE_SYNC_CONFIG',
  'LOAD_SYNC_CONFIG',
  // Phase 8: Web Bridge
  'SAVE_BRIDGE_TOKEN',
  'LOAD_BRIDGE_TOKEN',
  'CLEAR_BRIDGE_TOKEN',
  'FETCH_BRIDGE_CONFIG',
  'FETCH_BRIDGE_KEYS',
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
