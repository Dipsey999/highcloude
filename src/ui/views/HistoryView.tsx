import { useState, useEffect, useCallback } from 'preact/hooks';
import type { SyncHistoryEntry } from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/ui-message-bus';
import { TimelineEntry } from '../components/TimelineEntry';
import { showToast } from '../components/Toast';

export function HistoryView() {
  const [entries, setEntries] = useState<SyncHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    sendToCode({ type: 'LOAD_SYNC_HISTORY' });
  }, []);

  // Listen for messages from code.ts
  useEffect(() => {
    const unsubscribe = onCodeMessage((msg) => {
      switch (msg.type) {
        case 'SYNC_HISTORY_LOADED':
          setEntries(msg.entries);
          setLoading(false);
          break;

        case 'REVERT_COMPLETE':
          setReverting(null);
          showToast(
            `Revert complete: ${msg.result.updatedCount} updated, ${msg.result.skippedCount} skipped` +
              (msg.result.errors.length > 0 ? `, ${msg.result.errors.length} errors` : ''),
            msg.result.errors.length > 0 ? 'info' : 'success',
          );
          break;

        case 'SYNC_HISTORY_CLEARED':
          setEntries([]);
          showToast('History cleared', 'success');
          break;

        case 'ERROR':
          setReverting(null);
          setLoading(false);
          break;
      }
    });
    return unsubscribe;
  }, []);

  const handleRevert = useCallback((entryId: string) => {
    setReverting(entryId);
    sendToCode({ type: 'REVERT_TO_SYNC', entryId });
  }, []);

  const handleClear = useCallback(() => {
    if (entries.length === 0) return;
    sendToCode({ type: 'CLEAR_SYNC_HISTORY' });
  }, [entries]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    sendToCode({ type: 'LOAD_SYNC_HISTORY' });
  }, []);

  if (loading) {
    return (
      <div class="history-view">
        <div class="history-empty">Loading history...</div>
      </div>
    );
  }

  return (
    <div class="history-view">
      <div class="history-header">
        <span class="history-title">Sync History</span>
        <div class="history-actions">
          <button class="btn-filter" onClick={handleRefresh}>
            Refresh
          </button>
          {entries.length > 0 && (
            <button class="btn-filter" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div class="history-empty">
          <div class="history-empty-icon">📋</div>
          <div>No sync history yet</div>
          <div class="history-empty-hint">
            Push or pull tokens to start recording history
          </div>
        </div>
      ) : (
        <div class="history-timeline">
          {reverting && (
            <div class="history-reverting">
              Reverting...
            </div>
          )}
          {entries.map((entry) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              onRevert={handleRevert}
            />
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <div class="history-footer">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} (max 50)
        </div>
      )}
    </div>
  );
}
