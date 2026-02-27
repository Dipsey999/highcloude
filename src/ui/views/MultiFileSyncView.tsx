import { useState, useCallback, useEffect } from 'preact/hooks';
import type {
  CredentialPayload,
  RawExtractionResult,
  DesignTokensDocument,
  SyncConfig,
  FileSyncInfo,
  FileSyncStatus,
  ConflictResolution,
  SyncHistoryEntry,
  SyncHistoryChange,
} from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/ui-message-bus';
import { transformToMultiDocument } from '../../core/token-transformer';
import { readFileFromRepo } from '../../api/github-client';
import {
  commitMultipleFiles,
  createBranch,
  getBranchSha,
  createPullRequest,
} from '../../api/github-git-api';
import { diffTokenDocuments } from '../../core/diff-engine';
import { buildUpdateInstructions } from '../../core/token-applier';
import { FileSyncCard } from '../components/FileSyncCard';
import { showToast } from '../components/Toast';

type MultiSyncState = 'idle' | 'extracting' | 'comparing' | 'compared' | 'pushing' | 'pulling' | 'synced' | 'error';

interface MultiFileSyncViewProps {
  credentials: CredentialPayload;
  syncConfig: SyncConfig;
  rawData: RawExtractionResult | null;
  extractionProgress: { stage: string; percent: number } | null;
}

export function MultiFileSyncView({
  credentials,
  syncConfig,
  rawData,
  extractionProgress,
}: MultiFileSyncViewProps) {
  const [syncState, setSyncState] = useState<MultiSyncState>('idle');
  const [fileInfos, setFileInfos] = useState<FileSyncInfo[]>([]);
  const [localDocs, setLocalDocs] = useState<Map<string, DesignTokensDocument>>(new Map());
  const [conflictResolutions, setConflictResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Listen for TOKENS_APPLIED when pulling
  useEffect(() => {
    const unsubscribe = onCodeMessage((msg) => {
      if (msg.type === 'TOKENS_APPLIED') {
        setSyncState('synced');
        setLastSynced(new Date().toISOString());
        showToast(
          `Pull complete: ${msg.result.updatedCount} updated, ${msg.result.skippedCount} skipped`,
          msg.result.errors.length > 0 ? 'info' : 'success',
        );
      }
    });
    return unsubscribe;
  }, []);

  // Transform raw data into multi-documents when data arrives
  useEffect(() => {
    if (!rawData) return;
    try {
      const docs = transformToMultiDocument(rawData);
      setLocalDocs(docs);
      setSyncState('idle');
    } catch {
      showToast('Failed to split tokens by collection', 'error');
    }
  }, [rawData]);

  const handleExtract = useCallback(() => {
    setSyncState('extracting');
    setFileInfos([]);
    setLocalDocs(new Map());
    setConflictResolutions(new Map());
    sendToCode({ type: 'EXTRACT_TOKENS' });
  }, []);

  const handleCompare = useCallback(async () => {
    if (localDocs.size === 0 || !credentials.githubRepo) return;

    setSyncState('comparing');
    const [owner, repo] = credentials.githubRepo.split('/');
    const branch = syncConfig.baseBranch || credentials.githubBranch || 'main';
    const infos: FileSyncInfo[] = [];

    try {
      for (const [collectionName, localDoc] of localDocs) {
        const filePath = syncConfig.fileMapping[collectionName]
          ?? `${syncConfig.defaultDirectory}${collectionName.toLowerCase().replace(/\s+/g, '-')}.json`;

        let remoteDoc: DesignTokensDocument | null = null;
        let remoteSha: string | null = null;
        let lastCommitBy: string | undefined;
        let lastCommitSha: string | undefined;

        // Try to read the remote file
        const existing = await readFileFromRepo(
          credentials.githubToken, owner, repo, filePath, branch,
        );

        if (existing) {
          remoteDoc = JSON.parse(existing.content) as DesignTokensDocument;
          remoteSha = existing.sha;
        }

        // Compute diff
        const emptyDoc: DesignTokensDocument = {
          metadata: { source: 'claude-bridge', figmaFileName: '', lastSynced: '', version: '1.0.0' },
        };
        const diffResult = diffTokenDocuments(localDoc, remoteDoc ?? emptyDoc);
        const { summary } = diffResult;

        // Determine status
        let status: FileSyncStatus;
        if (!remoteDoc) {
          status = 'local-only';
        } else if (summary.added === 0 && summary.removed === 0 && summary.modified === 0) {
          status = 'in-sync';
        } else if (summary.added > 0 && summary.removed > 0) {
          status = 'conflict';
        } else {
          status = 'modified';
        }

        infos.push({
          collectionName,
          filePath,
          status,
          localDocument: localDoc,
          remoteDocument: remoteDoc,
          remoteSha,
          diffResult,
          lastCommitBy,
          lastCommitSha,
        });
      }

      // Check for remote-only files (files in mapping but not in localDocs)
      for (const [collectionName, filePath] of Object.entries(syncConfig.fileMapping)) {
        if (!localDocs.has(collectionName)) {
          const existing = await readFileFromRepo(
            credentials.githubToken, owner, repo, filePath, branch,
          );
          if (existing) {
            const remoteDoc = JSON.parse(existing.content) as DesignTokensDocument;
            infos.push({
              collectionName,
              filePath,
              status: 'remote-only',
              localDocument: null,
              remoteDocument: remoteDoc,
              remoteSha: existing.sha,
              diffResult: null,
            });
          }
        }
      }

      setFileInfos(infos);
      setSyncState('compared');

      const modifiedCount = infos.filter((i) => i.status !== 'in-sync').length;
      if (modifiedCount === 0) {
        showToast('All files are in sync!', 'success');
      } else {
        showToast(`${modifiedCount} file(s) have changes`, 'info');
      }
    } catch (err) {
      setSyncState('error');
      showToast(`Compare failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  }, [localDocs, credentials, syncConfig]);

  const handlePush = useCallback(async () => {
    if (fileInfos.length === 0 || !credentials.githubRepo) return;

    setSyncState('pushing');
    const [owner, repo] = credentials.githubRepo.split('/');
    const baseBranch = syncConfig.baseBranch || credentials.githubBranch || 'main';

    try {
      // Build the list of files to commit
      const filesToCommit: Array<{ path: string; content: string }> = [];

      for (const info of fileInfos) {
        if (info.status === 'in-sync') continue;
        if (info.status === 'remote-only') continue;

        // For conflicts, check resolution
        if (info.status === 'conflict') {
          const resolution = conflictResolutions.get(info.collectionName);
          if (resolution === 'keep-remote') continue;
        }

        if (info.localDocument) {
          filesToCommit.push({
            path: info.filePath,
            content: JSON.stringify(info.localDocument, null, 2),
          });
        }
      }

      if (filesToCommit.length === 0) {
        setSyncState('compared');
        showToast('No files to push', 'info');
        return;
      }

      let commitSha: string;
      let prUrl: string | undefined;
      let prNumber: number | undefined;

      if (syncConfig.pushMode === 'pr') {
        // Branch + PR workflow
        const baseSha = await getBranchSha(credentials.githubToken, owner, repo, baseBranch);
        const branchName = `claude-bridge/sync-${Date.now()}`;

        await createBranch(credentials.githubToken, owner, repo, branchName, baseSha);

        const result = await commitMultipleFiles(
          credentials.githubToken, owner, repo, branchName, filesToCommit,
          'chore: sync design tokens from Figma via Claude Bridge',
        );
        commitSha = result.commitSha;

        const pr = await createPullRequest(
          credentials.githubToken, owner, repo, branchName, baseBranch,
          'Sync design tokens from Figma',
          `## Token Sync\n\nPushed ${filesToCommit.length} file(s) from Claude Bridge.\n\nFiles:\n${filesToCommit.map((f) => `- \`${f.path}\``).join('\n')}`,
        );
        prNumber = pr.number;
        prUrl = pr.htmlUrl;

        showToast(`PR #${pr.number} created`, 'success');
      } else {
        // Direct push with atomic commit
        const result = await commitMultipleFiles(
          credentials.githubToken, owner, repo, baseBranch, filesToCommit,
          'chore: sync design tokens from Figma via Claude Bridge',
        );
        commitSha = result.commitSha;
        showToast(`Pushed ${filesToCommit.length} files to ${baseBranch}`, 'success');
      }

      setLastSynced(new Date().toISOString());
      setSyncState('synced');

      // Save sync history
      const allChanges: SyncHistoryChange[] = [];
      for (const info of fileInfos) {
        if (info.diffResult) {
          for (const entry of info.diffResult.entries) {
            if (entry.changeType !== 'unchanged') {
              allChanges.push({
                path: `${info.filePath}:${entry.path}`,
                changeType: entry.changeType,
                oldValue: entry.remoteToken ? JSON.stringify(entry.remoteToken.$value) : undefined,
                newValue: entry.localToken ? JSON.stringify(entry.localToken.$value) : undefined,
              });
            }
          }
        }
      }

      const historyEntry: SyncHistoryEntry = {
        id: `push-multi-${Date.now()}`,
        timestamp: new Date().toISOString(),
        direction: 'push',
        commitSha,
        changes: allChanges,
      };
      sendToCode({ type: 'SAVE_SYNC_ENTRY', entry: historyEntry });

    } catch (err) {
      setSyncState('error');
      showToast(`Push failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  }, [fileInfos, credentials, syncConfig, conflictResolutions]);

  const handlePull = useCallback(() => {
    if (fileInfos.length === 0) return;

    setSyncState('pulling');

    try {
      // Merge all remote documents and build instructions
      const allInstructions: ReturnType<typeof buildUpdateInstructions> = [];

      for (const info of fileInfos) {
        if (!info.remoteDocument) continue;

        if (info.status === 'conflict') {
          const resolution = conflictResolutions.get(info.collectionName);
          if (resolution === 'keep-local') continue;
        }

        const instructions = buildUpdateInstructions(info.remoteDocument);
        allInstructions.push(...instructions);
      }

      if (allInstructions.length === 0) {
        setSyncState('compared');
        showToast('No tokens to pull', 'info');
        return;
      }

      sendToCode({ type: 'APPLY_TOKENS', instructions: allInstructions });
      // Result handled by TOKENS_APPLIED listener
    } catch (err) {
      setSyncState('error');
      showToast(`Pull failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  }, [fileInfos, conflictResolutions]);

  const handleResolveConflict = useCallback((collectionName: string, resolution: ConflictResolution) => {
    setConflictResolutions((prev) => {
      const next = new Map(prev);
      next.set(collectionName, resolution);
      return next;
    });
    showToast(`${collectionName}: will ${resolution === 'keep-local' ? 'keep local' : 'keep remote'}`, 'info');
  }, []);

  const isBusy = syncState === 'extracting' || syncState === 'comparing' || syncState === 'pushing' || syncState === 'pulling';

  const hasConflicts = fileInfos.some((f) => f.status === 'conflict');
  const unresolvedConflicts = fileInfos.filter(
    (f) => f.status === 'conflict' && !conflictResolutions.has(f.collectionName),
  );

  return (
    <div class="multi-file-sync-view">
      {/* Extract */}
      <button
        class="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleExtract}
        disabled={isBusy}
      >
        {syncState === 'extracting' ? 'Extracting...' : 'Extract Tokens from Figma'}
      </button>

      {syncState === 'extracting' && extractionProgress && (
        <div class="extraction-progress">
          <div class="progress-bar">
            <div class="progress-fill" style={{ width: `${extractionProgress.percent}%` }} />
          </div>
          <span class="progress-label">{extractionProgress.stage}</span>
        </div>
      )}

      {/* Local docs summary */}
      {localDocs.size > 0 && (
        <div class="multi-file-summary">
          <span>{localDocs.size} collection(s) extracted</span>
          <span class="multi-file-mode-badge">
            {syncConfig.pushMode === 'pr' ? 'PR mode' : 'Direct push'}
          </span>
        </div>
      )}

      {/* Compare button */}
      {localDocs.size > 0 && syncState !== 'comparing' && (
        <button
          class="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={handleCompare}
          disabled={isBusy || !credentials.githubRepo}
        >
          Compare with GitHub
        </button>
      )}

      {syncState === 'comparing' && (
        <button class="btn btn-secondary" style={{ width: '100%' }} disabled>
          Comparing files...
        </button>
      )}

      {/* File cards */}
      {fileInfos.length > 0 && (
        <div class="multi-file-cards">
          {fileInfos.map((info) => (
            <FileSyncCard
              key={info.collectionName}
              fileInfo={info}
              onResolveConflict={handleResolveConflict}
            />
          ))}
        </div>
      )}

      {/* Push / Pull actions */}
      {syncState === 'compared' && fileInfos.length > 0 && (
        <>
          {hasConflicts && unresolvedConflicts.length > 0 && (
            <div class="conflict-warning">
              <span class="conflict-warning-icon">!</span>
              <div>
                <strong>{unresolvedConflicts.length} unresolved conflict(s).</strong> Please choose
                keep-local or keep-remote for each conflicting file before pushing or pulling.
              </div>
            </div>
          )}

          <div class="sync-actions">
            <button
              class="btn btn-primary"
              onClick={handlePush}
              disabled={!credentials.githubRepo || (hasConflicts && unresolvedConflicts.length > 0)}
              title={syncConfig.pushMode === 'pr' ? 'Create branch + PR' : 'Push directly'}
            >
              {syncConfig.pushMode === 'pr' ? 'Create PR' : 'Push All to GitHub'}
            </button>
            <button
              class="btn btn-pull"
              onClick={handlePull}
              disabled={!fileInfos.some((f) => f.remoteDocument) || (hasConflicts && unresolvedConflicts.length > 0)}
              title="Apply remote tokens to Figma"
            >
              Pull All to Figma
            </button>
          </div>
        </>
      )}

      {/* Pushing / Pulling states */}
      {syncState === 'pushing' && (
        <button class="btn btn-primary" style={{ width: '100%' }} disabled>
          Pushing...
        </button>
      )}
      {syncState === 'pulling' && (
        <button class="btn btn-pull" style={{ width: '100%' }} disabled>
          Pulling...
        </button>
      )}

      {/* Last Synced */}
      {lastSynced && (
        <div style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)',
          textAlign: 'center',
        }}>
          Last synced: {new Date(lastSynced).toLocaleString()}
        </div>
      )}
    </div>
  );
}
