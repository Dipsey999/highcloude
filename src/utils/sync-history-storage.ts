import { logger } from './logger';
import type { SyncHistoryEntry } from '../types/messages';

const STORAGE_KEY = 'cosmikit:sync-history';
const MAX_ENTRIES = 50;

/**
 * Load sync history from figma.clientStorage.
 */
export async function loadSyncHistory(): Promise<SyncHistoryEntry[]> {
  try {
    const data = await figma.clientStorage.getAsync(STORAGE_KEY);
    if (Array.isArray(data)) {
      return data as SyncHistoryEntry[];
    }
    return [];
  } catch (err) {
    logger.error('Failed to load sync history:', err);
    return [];
  }
}

/**
 * Save a new sync history entry. Maintains max 50 entries (FIFO).
 */
export async function saveSyncEntry(entry: SyncHistoryEntry): Promise<void> {
  try {
    const history = await loadSyncHistory();
    history.unshift(entry);
    // Cap at MAX_ENTRIES
    if (history.length > MAX_ENTRIES) {
      history.length = MAX_ENTRIES;
    }
    await figma.clientStorage.setAsync(STORAGE_KEY, history);
    logger.info(`Saved sync entry: ${entry.id}`);
  } catch (err) {
    logger.error('Failed to save sync entry:', err);
  }
}

/**
 * Get a specific sync history entry by ID.
 */
export async function getSyncEntryById(entryId: string): Promise<SyncHistoryEntry | null> {
  const history = await loadSyncHistory();
  return history.find((e) => e.id === entryId) ?? null;
}

/**
 * Clear all sync history.
 */
export async function clearSyncHistory(): Promise<void> {
  try {
    await figma.clientStorage.setAsync(STORAGE_KEY, []);
    logger.info('Sync history cleared');
  } catch (err) {
    logger.error('Failed to clear sync history:', err);
  }
}
