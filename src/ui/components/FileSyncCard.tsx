import { useState } from 'preact/hooks';
import type { FileSyncInfo, ConflictResolution } from '../../types/messages';
import { DiffViewer } from './DiffViewer';

interface FileSyncCardProps {
  fileInfo: FileSyncInfo;
  onResolveConflict?: (collectionName: string, resolution: ConflictResolution) => void;
}

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  'in-sync': { text: 'In Sync', className: 'status-badge-synced' },
  'local-only': { text: 'Local Only', className: 'status-badge-local' },
  'remote-only': { text: 'Remote Only', className: 'status-badge-remote' },
  'modified': { text: 'Modified', className: 'status-badge-modified' },
  'conflict': { text: 'Conflict', className: 'status-badge-conflict' },
};

export function FileSyncCard({ fileInfo, onResolveConflict }: FileSyncCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusInfo = STATUS_LABELS[fileInfo.status] ?? { text: fileInfo.status, className: '' };

  const hasDiff = fileInfo.diffResult &&
    (fileInfo.diffResult.summary.added > 0 ||
     fileInfo.diffResult.summary.removed > 0 ||
     fileInfo.diffResult.summary.modified > 0);

  return (
    <div class="file-sync-card">
      <div class="file-sync-card-header" onClick={() => setExpanded(!expanded)}>
        <div class="file-sync-card-info">
          <span class="file-sync-card-collection">{fileInfo.collectionName}</span>
          <span class="file-sync-card-path">{fileInfo.filePath}</span>
        </div>
        <div class="file-sync-card-status-area">
          <span class={`file-sync-status-badge ${statusInfo.className}`}>
            {statusInfo.text}
          </span>
          <span class="file-sync-card-expand">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Last commit info */}
      {fileInfo.lastCommitBy && (
        <div class="file-sync-card-commit-info">
          Last commit by {fileInfo.lastCommitBy}
          {fileInfo.lastCommitSha && ` (${fileInfo.lastCommitSha.substring(0, 7)})`}
        </div>
      )}

      {/* Expandable diff */}
      {expanded && hasDiff && fileInfo.diffResult && (
        <div class="file-sync-card-diff">
          <DiffViewer diff={fileInfo.diffResult} />
        </div>
      )}

      {expanded && !hasDiff && (
        <div class="file-sync-card-diff">
          <div class="file-sync-card-no-diff">No changes detected</div>
        </div>
      )}

      {/* Conflict resolution buttons */}
      {fileInfo.status === 'conflict' && onResolveConflict && (
        <div class="file-sync-card-conflict-actions">
          <button
            class="btn btn-secondary"
            onClick={() => onResolveConflict(fileInfo.collectionName, 'keep-local')}
          >
            Keep Local
          </button>
          <button
            class="btn btn-secondary"
            onClick={() => onResolveConflict(fileInfo.collectionName, 'keep-remote')}
          >
            Keep Remote
          </button>
        </div>
      )}
    </div>
  );
}
