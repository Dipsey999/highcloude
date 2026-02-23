import { useState } from 'preact/hooks';
import type { SyncHistoryEntry } from '../../types/messages';

interface TimelineEntryProps {
  entry: SyncHistoryEntry;
  onRevert: (entryId: string) => void;
}

export function TimelineEntry({ entry, onRevert }: TimelineEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);

  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const added = entry.changes.filter((c) => c.changeType === 'added').length;
  const modified = entry.changes.filter((c) => c.changeType === 'modified').length;
  const removed = entry.changes.filter((c) => c.changeType === 'removed').length;

  const handleRevert = () => {
    if (!confirmRevert) {
      setConfirmRevert(true);
      return;
    }
    onRevert(entry.id);
    setConfirmRevert(false);
  };

  return (
    <div class="timeline-entry">
      <div class="timeline-entry-header" onClick={() => setExpanded(!expanded)}>
        <div class="timeline-entry-left">
          <span class={`timeline-direction ${entry.direction}`}>
            {entry.direction === 'push' ? '\u2191' : '\u2193'}
          </span>
          <div class="timeline-entry-info">
            <span class="timeline-entry-date">{dateStr} {timeStr}</span>
            <span class="timeline-entry-summary">
              {entry.direction === 'push' ? 'Pushed to GitHub' : 'Pulled from GitHub'}
            </span>
          </div>
        </div>
        <div class="timeline-entry-badges">
          {added > 0 && <span class="diff-badge diff-added">+{added}</span>}
          {modified > 0 && <span class="diff-badge diff-modified">~{modified}</span>}
          {removed > 0 && <span class="diff-badge diff-removed">-{removed}</span>}
        </div>
      </div>

      {expanded && (
        <div class="timeline-entry-detail">
          {entry.commitSha && (
            <div class="timeline-commit">
              Commit: <code>{entry.commitSha.slice(0, 7)}</code>
            </div>
          )}

          <div class="timeline-changes">
            {entry.changes.map((change, i) => (
              <div key={i} class={`timeline-change timeline-change-${change.changeType}`}>
                <span class="timeline-change-type">{changeTypeLabel(change.changeType)}</span>
                <span class="timeline-change-path">{change.path}</span>
              </div>
            ))}
          </div>

          {entry.tokenDocumentSnapshot && (
            <div class="timeline-actions">
              {confirmRevert ? (
                <div class="timeline-confirm">
                  <span>Revert to this state?</span>
                  <button class="btn btn-danger" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={handleRevert}>
                    Confirm
                  </button>
                  <button class="btn btn-secondary" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={() => setConfirmRevert(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button class="btn-filter" onClick={handleRevert}>
                  Revert
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function changeTypeLabel(type: string): string {
  switch (type) {
    case 'added': return '+';
    case 'modified': return '~';
    case 'removed': return '-';
    default: return '=';
  }
}
