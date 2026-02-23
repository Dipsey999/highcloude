import { useState } from 'preact/hooks';
import type { TokenDiffResult, TokenDiffEntry, DiffChangeType } from '../../types/messages';
import { formatTokenValue } from '../../core/diff-engine';

interface DiffViewerProps {
  diff: TokenDiffResult;
}

type FilterType = 'all' | DiffChangeType;

const CHANGE_LABELS: Record<DiffChangeType, string> = {
  added: 'Added',
  removed: 'Removed',
  modified: 'Modified',
  unchanged: 'Unchanged',
};

export function DiffViewer({ diff }: DiffViewerProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showUnchanged, setShowUnchanged] = useState(false);

  const filtered = diff.entries.filter((entry) => {
    if (filter === 'all') {
      return entry.changeType !== 'unchanged' || showUnchanged;
    }
    return entry.changeType === filter;
  });

  const { summary } = diff;

  return (
    <div class="diff-viewer">
      {/* Summary Bar */}
      <div class="diff-summary">
        <span class="diff-badge diff-added">{summary.added} added</span>
        <span class="diff-badge diff-removed">{summary.removed} removed</span>
        <span class="diff-badge diff-modified">{summary.modified} modified</span>
        <span class="diff-badge diff-unchanged">{summary.unchanged} unchanged</span>
      </div>

      {/* Filter Controls */}
      <div class="diff-filters">
        {(['all', 'added', 'removed', 'modified'] as FilterType[]).map((f) => (
          <button
            key={f}
            class={`btn btn-filter ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Changes' : CHANGE_LABELS[f as DiffChangeType]}
          </button>
        ))}
        <label class="diff-toggle">
          <input
            type="checkbox"
            checked={showUnchanged}
            onChange={() => setShowUnchanged(!showUnchanged)}
          />
          <span>Show unchanged</span>
        </label>
      </div>

      {/* Diff List */}
      <div class="diff-list">
        {filtered.length === 0 && (
          <div class="diff-empty">No changes to display.</div>
        )}
        {filtered.map((entry) => (
          <DiffRow key={entry.path} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function DiffRow({ entry }: { entry: TokenDiffEntry }) {
  const [expanded, setExpanded] = useState(entry.changeType === 'modified');

  return (
    <div class={`diff-row diff-row-${entry.changeType}`}>
      <div
        class="diff-row-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span class={`diff-indicator diff-indicator-${entry.changeType}`}>
          {entry.changeType === 'added' && '+'}
          {entry.changeType === 'removed' && '-'}
          {entry.changeType === 'modified' && '~'}
          {entry.changeType === 'unchanged' && '='}
        </span>
        <span class="diff-path">{entry.path}</span>
        <span class="diff-type-badge">
          {entry.localToken?.$type ?? entry.remoteToken?.$type}
        </span>
      </div>

      {expanded && (
        <div class="diff-row-detail">
          {entry.changeType === 'added' && entry.localToken && (
            <div class="diff-value diff-value-new">
              <span class="diff-value-label">New:</span>
              <code>{formatTokenValue(entry.localToken)}</code>
            </div>
          )}
          {entry.changeType === 'removed' && entry.remoteToken && (
            <div class="diff-value diff-value-old">
              <span class="diff-value-label">Removed:</span>
              <code>{formatTokenValue(entry.remoteToken)}</code>
            </div>
          )}
          {entry.changeType === 'modified' && (
            <>
              {entry.remoteToken && (
                <div class="diff-value diff-value-old">
                  <span class="diff-value-label">Remote:</span>
                  <code>{formatTokenValue(entry.remoteToken)}</code>
                </div>
              )}
              {entry.localToken && (
                <div class="diff-value diff-value-new">
                  <span class="diff-value-label">Local:</span>
                  <code>{formatTokenValue(entry.localToken)}</code>
                </div>
              )}
            </>
          )}
          {entry.changeType === 'unchanged' && entry.localToken && (
            <div class="diff-value">
              <span class="diff-value-label">Value:</span>
              <code>{formatTokenValue(entry.localToken)}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
