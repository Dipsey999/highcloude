import { sendToUI, onUIMessage } from './utils/message-bus';
import { saveCredentials, loadCredentials, clearCredentials, saveSyncConfig, loadSyncConfig, saveBridgeToken, loadBridgeToken, clearBridgeToken } from './utils/storage';
import { logger } from './utils/logger';
import { extractAllTokens } from './core/variable-extractor';
import { applyVariableUpdates } from './core/variable-writer';
import { buildDesign } from './core/design-spec-parser';
import { exportSelection } from './core/selection-exporter';
import { autoMapTokens } from './core/token-auto-mapper';
import { applyTokenBindings } from './core/binding-applier';
// Phase 6 imports
import { scanTokenUsage } from './core/token-usage-scanner';
import { updateTokenValue, getVariableModes } from './core/token-editor';
import { loadSyncHistory, saveSyncEntry, getSyncEntryById, clearSyncHistory } from './utils/sync-history-storage';
import { buildUpdateInstructions } from './core/token-applier';
import { batchAutoMapAllPages, findUnusedTokens, findOrphanedValues } from './core/batch-operations';
import { validateDTCG } from './core/dtcg-validator';
import { transformToDocument } from './core/token-transformer';
import type { UIMessage, DesignTokensDocument } from './types/messages';

// Show the plugin UI — wrap in try-catch for safety
try {
  figma.showUI(__html__, {
    width: 400,
    height: 600,
    themeColors: true,
  });
} catch (e) {
  // Fallback without themeColors if not supported
  figma.showUI(__html__, {
    width: 400,
    height: 600,
  });
}

// Handle messages from UI
onUIMessage(async (msg: UIMessage) => {
  try {
    logger.info('Received message from UI:', msg.type);

    switch (msg.type) {
      case 'LOAD_CREDENTIALS': {
        const credentials = await loadCredentials();
        sendToUI({ type: 'CREDENTIALS_LOADED', payload: credentials });
        break;
      }

      case 'SAVE_CREDENTIALS': {
        try {
          await saveCredentials(msg.payload);
          sendToUI({ type: 'CREDENTIALS_SAVED' });
        } catch (e) {
          sendToUI({ type: 'ERROR', message: 'Failed to save credentials' });
        }
        break;
      }

      case 'CLEAR_CREDENTIALS': {
        try {
          await clearCredentials();
          sendToUI({ type: 'CREDENTIALS_CLEARED' });
        } catch (e) {
          sendToUI({ type: 'ERROR', message: 'Failed to clear credentials' });
        }
        break;
      }

      case 'EXTRACT_TOKENS': {
        try {
          const rawResult = await extractAllTokens();
          sendToUI({ type: 'TOKENS_EXTRACTED', data: rawResult });
        } catch (err) {
          logger.error('Token extraction failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'GET_SELECTION': {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
          sendToUI({ type: 'ERROR', message: 'No selection' });
        } else {
          const node = selection[0];
          sendToUI({
            type: 'SELECTION_DATA',
            data: {
              nodeId: node.id,
              name: node.name,
              type: node.type,
            },
          });
        }
        break;
      }

      case 'APPLY_TOKENS': {
        try {
          const result = await applyVariableUpdates(msg.instructions);
          sendToUI({ type: 'TOKENS_APPLIED', result });
        } catch (err) {
          logger.error('Token application failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Apply failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'CREATE_DESIGN': {
        try {
          const result = await buildDesign(msg.spec);
          sendToUI({ type: 'DESIGN_CREATED', result });
        } catch (err) {
          logger.error('Design creation failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Design creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'EXPORT_SELECTION': {
        try {
          const result = await exportSelection();
          sendToUI({ type: 'SELECTION_EXPORTED', result });
        } catch (err) {
          logger.error('Selection export failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'AUTO_MAP_TOKENS': {
        try {
          const result = await autoMapTokens();
          sendToUI({ type: 'AUTO_MAP_RESULT', result });
        } catch (err) {
          logger.error('Auto-map failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Auto-map failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'APPLY_TOKEN_BINDINGS': {
        try {
          const result = await applyTokenBindings(msg.bindings);
          sendToUI({ type: 'BINDINGS_APPLIED', result });
        } catch (err) {
          logger.error('Binding application failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Binding failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      // ========================================
      // Phase 6: Token Browser handlers
      // ========================================

      case 'GET_TOKEN_USAGE': {
        try {
          const usage = await scanTokenUsage(msg.variableId);
          sendToUI({
            type: 'TOKEN_USAGE_RESULT',
            variableId: msg.variableId,
            count: usage.count,
            nodeNames: usage.nodeNames,
          });
        } catch (err) {
          logger.error('Token usage scan failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Usage scan failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'UPDATE_TOKEN_VALUE': {
        try {
          const result = await updateTokenValue(msg.variableId, msg.modeId, msg.newValue);
          sendToUI({
            type: 'TOKEN_VALUE_UPDATED',
            variableId: msg.variableId,
            success: result.success,
            error: result.error,
          });
        } catch (err) {
          logger.error('Token value update failed:', err);
          sendToUI({
            type: 'TOKEN_VALUE_UPDATED',
            variableId: msg.variableId,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
        break;
      }

      case 'GET_VARIABLE_MODES': {
        try {
          const modes = await getVariableModes(msg.collectionId);
          sendToUI({
            type: 'VARIABLE_MODES_RESULT',
            collectionId: msg.collectionId,
            modes,
          });
        } catch (err) {
          logger.error('Get variable modes failed:', err);
          sendToUI({
            type: 'VARIABLE_MODES_RESULT',
            collectionId: msg.collectionId,
            modes: [],
          });
        }
        break;
      }

      // ========================================
      // Phase 6: Sync History handlers
      // ========================================

      case 'LOAD_SYNC_HISTORY': {
        try {
          const entries = await loadSyncHistory();
          sendToUI({ type: 'SYNC_HISTORY_LOADED', entries });
        } catch (err) {
          logger.error('Load sync history failed:', err);
          sendToUI({ type: 'SYNC_HISTORY_LOADED', entries: [] });
        }
        break;
      }

      case 'SAVE_SYNC_ENTRY': {
        try {
          await saveSyncEntry(msg.entry);
          sendToUI({ type: 'SYNC_ENTRY_SAVED' });
        } catch (err) {
          logger.error('Save sync entry failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Save history failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'REVERT_TO_SYNC': {
        try {
          const entry = await getSyncEntryById(msg.entryId);
          if (!entry || !entry.tokenDocumentSnapshot) {
            sendToUI({ type: 'ERROR', message: 'No snapshot found for this entry' });
            break;
          }

          const snapshotDoc = JSON.parse(entry.tokenDocumentSnapshot) as DesignTokensDocument;
          const instructions = buildUpdateInstructions(snapshotDoc);

          if (instructions.length === 0) {
            sendToUI({
              type: 'REVERT_COMPLETE',
              result: { updatedCount: 0, skippedCount: 0, errors: ['No variable tokens to revert'] },
            });
            break;
          }

          const result = await applyVariableUpdates(instructions);
          sendToUI({ type: 'REVERT_COMPLETE', result });
        } catch (err) {
          logger.error('Revert failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Revert failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'CLEAR_SYNC_HISTORY': {
        try {
          await clearSyncHistory();
          sendToUI({ type: 'SYNC_HISTORY_CLEARED' });
        } catch (err) {
          logger.error('Clear sync history failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Clear history failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      // ========================================
      // Phase 6: Batch Operations handlers
      // ========================================

      case 'BATCH_AUTO_MAP_ALL_PAGES': {
        try {
          const result = await batchAutoMapAllPages();
          sendToUI({ type: 'BATCH_AUTO_MAP_ALL_RESULT', result });
        } catch (err) {
          logger.error('Batch auto-map failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Batch auto-map failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'VALIDATE_TOKENS_DTCG': {
        try {
          // Extract current tokens, transform, then validate
          const rawResult = await extractAllTokens();
          const doc = transformToDocument(rawResult);
          const result = validateDTCG(doc);
          sendToUI({ type: 'DTCG_VALIDATION_RESULT', result });
        } catch (err) {
          logger.error('DTCG validation failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'FIND_UNUSED_TOKENS': {
        try {
          const result = await findUnusedTokens();
          sendToUI({ type: 'UNUSED_TOKENS_RESULT', result });
        } catch (err) {
          logger.error('Find unused tokens failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Find unused failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      case 'FIND_ORPHANED_VALUES': {
        try {
          const result = await findOrphanedValues();
          sendToUI({ type: 'ORPHANED_VALUES_RESULT', result });
        } catch (err) {
          logger.error('Find orphaned values failed:', err);
          sendToUI({
            type: 'ERROR',
            message: `Find orphaned failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
        break;
      }

      // ========================================
      // Phase 7: Multi-File & Team Sync handlers
      // ========================================

      case 'SAVE_SYNC_CONFIG': {
        try {
          await saveSyncConfig(msg.config);
          sendToUI({ type: 'SYNC_CONFIG_SAVED' });
        } catch (e) {
          sendToUI({ type: 'ERROR', message: 'Failed to save sync config' });
        }
        break;
      }

      case 'LOAD_SYNC_CONFIG': {
        try {
          const config = await loadSyncConfig();
          sendToUI({ type: 'SYNC_CONFIG_LOADED', config });
        } catch (err) {
          logger.error('Load sync config failed:', err);
          sendToUI({ type: 'SYNC_CONFIG_LOADED', config: null });
        }
        break;
      }

      // ========================================
      // Phase 8: Web Bridge handlers
      // ========================================

      case 'SAVE_BRIDGE_TOKEN': {
        try {
          await saveBridgeToken(msg.token);
          sendToUI({ type: 'BRIDGE_TOKEN_SAVED' });
        } catch (e) {
          sendToUI({ type: 'ERROR', message: 'Failed to save bridge token' });
        }
        break;
      }

      case 'LOAD_BRIDGE_TOKEN': {
        const token = await loadBridgeToken();
        sendToUI({ type: 'BRIDGE_TOKEN_LOADED', token });
        break;
      }

      case 'CLEAR_BRIDGE_TOKEN': {
        try {
          await clearBridgeToken();
          sendToUI({ type: 'BRIDGE_TOKEN_CLEARED' });
        } catch (e) {
          sendToUI({ type: 'ERROR', message: 'Failed to clear bridge token' });
        }
        break;
      }

      case 'FETCH_BRIDGE_CONFIG': {
        // Config is fetched from UI side directly (has network access)
        // This case is handled in the UI iframe
        break;
      }

      case 'FETCH_BRIDGE_KEYS': {
        // Keys are fetched from UI side directly (has network access)
        // This case is handled in the UI iframe
        break;
      }

      default: {
        const _exhaustive: never = msg;
        logger.warn('Unhandled message type:', (_exhaustive as { type: string }).type);
      }
    }
  } catch (err) {
    // Top-level catch to prevent unhandled rejections from crashing the plugin
    logger.error('Unhandled error in message handler:', err);
    try {
      sendToUI({
        type: 'ERROR',
        message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } catch (e) {
      // If even error reporting fails, just log
      console.error('[Claude Bridge] Fatal error:', err);
    }
  }
});

// On plugin startup, proactively load and send credentials to UI
(async () => {
  try {
    const credentials = await loadCredentials();
    sendToUI({ type: 'CREDENTIALS_LOADED', payload: credentials });
  } catch (err) {
    logger.error('Failed to load credentials on startup:', err);
  }
})();
