import { sendToUI, onUIMessage } from './utils/message-bus';
import { saveCredentials, loadCredentials, clearCredentials } from './utils/storage';
import { logger } from './utils/logger';
import { extractAllTokens } from './core/variable-extractor';
import { applyVariableUpdates } from './core/variable-writer';
import type { UIMessage } from './types/messages';

// Show the plugin UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  themeColors: true,
});

// Handle messages from UI
onUIMessage(async (msg: UIMessage) => {
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
      } catch {
        sendToUI({ type: 'ERROR', message: 'Failed to save credentials' });
      }
      break;
    }

    case 'CLEAR_CREDENTIALS': {
      try {
        await clearCredentials();
        sendToUI({ type: 'CREDENTIALS_CLEARED' });
      } catch {
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

    default: {
      const _exhaustive: never = msg;
      logger.warn('Unhandled message type:', (_exhaustive as { type: string }).type);
    }
  }
});

// On plugin startup, proactively load and send credentials to UI
(async () => {
  const credentials = await loadCredentials();
  sendToUI({ type: 'CREDENTIALS_LOADED', payload: credentials });
})();
