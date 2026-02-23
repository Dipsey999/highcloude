import { useState, useCallback, useEffect } from 'preact/hooks';
import type {
  CredentialPayload,
  RawExtractionResult,
  DesignTokensDocument,
  TokenExtractionSummary,
  TokenDiffResult,
  SyncHistoryEntry,
  SyncHistoryChange,
} from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/message-bus';
import { transformToDocument, computeSummary } from '../../core/token-transformer';
import { readFileFromRepo, writeFileToRepo } from '../../api/github-client';
import { diffTokenDocuments } from '../../core/diff-engine';
import { buildUpdateInstructions } from '../../core/token-applier';
import { TokenCard } from '../components/TokenCard';
import { DiffViewer } from '../components/DiffViewer';
import { showToast } from '../components/Toast';

type SyncState =
  | 'idle'
  | 'extracting'
  | 'extracted'
  | 'comparing'
  | 'compared'
  | 'pushing'
  | 'pulling'
  | 'synced'
  | 'error';

interface SyncViewProps {
  credentials: CredentialPayload;
  rawData: RawExtractionResult | null;
  extractionProgress: { stage: string; percent: number } | null;
}

export function SyncView({ credentials, rawData, extractionProgress }: SyncViewProps) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [localDocument, setLocalDocument] = useState<DesignTokensDocument | null>(null);
  const [remoteDocument, setRemoteDocument] = useState<DesignTokensDocument | null>(null);
  const [remoteSha, setRemoteSha] = useState<string | null>(null);
  const [summary, setSummary] = useState<TokenExtractionSummary | null>(null);
  const [diffResult, setDiffResult] = useState<TokenDiffResult | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [applyProgress, setApplyProgress] = useState<{ stage: string; percent: number } | null>(null);

  // Listen for TOKENS_APPLIED and APPLY_PROGRESS from code.ts
  useEffect(() => {
    const unsubscribe = onCodeMessage((msg) => {
      if (msg.type === 'TOKENS_APPLIED') {
        const r = msg.result;
        setApplyProgress(null);
        setLastSynced(new Date().toISOString());
        setSyncState('synced');
        showToast(
          `Pull complete: ${r.updatedCount} updated, ${r.skippedCount} skipped` +
            (r.errors.length > 0 ? `, ${r.errors.length} errors` : ''),
          r.errors.length > 0 ? 'info' : 'success',
        );

        // Save sync history entry for pull
        if (remoteDocument && diffResult) {
          const historyEntry: SyncHistoryEntry = {
            id: `pull-${Date.now()}`,
            timestamp: new Date().toISOString(),
            direction: 'pull',
            changes: diffResult.entries
              .filter((e) => e.changeType !== 'unchanged')
              .map((e): SyncHistoryChange => ({
                path: e.path,
                changeType: e.changeType,
                oldValue: e.localToken ? JSON.stringify(e.localToken.$value) : undefined,
                newValue: e.remoteToken ? JSON.stringify(e.remoteToken.$value) : undefined,
              })),
            tokenDocumentSnapshot: JSON.stringify(remoteDocument),
          };
          sendToCode({ type: 'SAVE_SYNC_ENTRY', entry: historyEntry });
        }
      }
      if (msg.type === 'APPLY_PROGRESS') {
        setApplyProgress({ stage: msg.stage, percent: msg.percent });
      }
    });
    return unsubscribe;
  }, [remoteDocument, diffResult]);

  // Transform raw data when it arrives from code.ts
  useEffect(() => {
    if (!rawData) return;

    try {
      const doc = transformToDocument(rawData);
      const sum = computeSummary(doc);
      setLocalDocument(doc);
      setSummary(sum);
      setSyncState('extracted');
      showToast(`Extracted ${sum.totalCount} tokens`, 'success');
    } catch {
      setSyncState('error');
      showToast('Failed to transform tokens', 'error');
    }
  }, [rawData]);

  const handleExtract = useCallback(() => {
    setSyncState('extracting');
    setLocalDocument(null);
    setRemoteDocument(null);
    setDiffResult(null);
    setSummary(null);
    setRemoteSha(null);
    sendToCode({ type: 'EXTRACT_TOKENS' });
  }, []);

  const handleCompare = useCallback(async () => {
    if (!localDocument || !credentials.githubRepo) return;

    setSyncState('comparing');

    try {
      const [owner, repo] = credentials.githubRepo.split('/');
      const branch = credentials.githubBranch ?? 'main';
      const filePath = credentials.githubFilePath ?? 'tokens.json';

      const existing = await readFileFromRepo(
        credentials.githubToken, owner, repo, filePath, branch,
      );

      if (!existing) {
        // No remote file: everything is "added"
        setRemoteDocument(null);
        setRemoteSha(null);
        const emptyRemote: DesignTokensDocument = {
          metadata: {
            source: 'claude-bridge',
            figmaFileName: '',
            lastSynced: '',
            version: '1.0.0',
          },
        };
        const result = diffTokenDocuments(localDocument, emptyRemote);
        setDiffResult(result);
        setSyncState('compared');
        showToast('No remote file found. All tokens are new.', 'info');
        return;
      }

      const remoteDoc = JSON.parse(existing.content) as DesignTokensDocument;
      setRemoteDocument(remoteDoc);
      setRemoteSha(existing.sha);

      const result = diffTokenDocuments(localDocument, remoteDoc);
      setDiffResult(result);
      setSyncState('compared');

      const { summary: ds } = result;
      if (ds.added === 0 && ds.removed === 0 && ds.modified === 0) {
        showToast('Local and remote are in sync!', 'success');
      } else {
        showToast(
          `${ds.added} added, ${ds.removed} removed, ${ds.modified} modified`,
          'info',
        );
      }
    } catch (err) {
      setSyncState('extracted');
      showToast(
        `Compare failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error',
      );
    }
  }, [localDocument, credentials]);

  const handlePush = useCallback(async () => {
    if (!localDocument || !credentials.githubRepo) return;

    setSyncState('pushing');

    try {
      const [owner, repo] = credentials.githubRepo.split('/');
      const branch = credentials.githubBranch ?? 'main';
      const filePath = credentials.githubFilePath ?? 'tokens.json';
      const content = JSON.stringify(localDocument, null, 2);

      // Use cached SHA if available, otherwise fetch
      let sha = remoteSha;
      if (!sha) {
        const existing = await readFileFromRepo(
          credentials.githubToken, owner, repo, filePath, branch,
        );
        sha = existing?.sha ?? null;
      }

      const result = await writeFileToRepo(
        credentials.githubToken, owner, repo, filePath, branch,
        content, sha ?? undefined,
        'chore: sync design tokens from Figma via Claude Bridge',
      );

      setRemoteSha(result.sha);
      setLastSynced(new Date().toISOString());
      setSyncState('synced');
      showToast('Tokens pushed to GitHub', 'success');

      // Save sync history entry
      if (diffResult) {
        const historyEntry: SyncHistoryEntry = {
          id: `push-${Date.now()}`,
          timestamp: new Date().toISOString(),
          direction: 'push',
          commitSha: result.sha,
          changes: diffResult.entries
            .filter((e) => e.changeType !== 'unchanged')
            .map((e): SyncHistoryChange => ({
              path: e.path,
              changeType: e.changeType,
              oldValue: e.remoteToken ? JSON.stringify(e.remoteToken.$value) : undefined,
              newValue: e.localToken ? JSON.stringify(e.localToken.$value) : undefined,
            })),
          tokenDocumentSnapshot: JSON.stringify(localDocument),
        };
        sendToCode({ type: 'SAVE_SYNC_ENTRY', entry: historyEntry });
      }
    } catch (err) {
      setSyncState('error');
      showToast(
        `Push failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error',
      );
    }
  }, [localDocument, credentials, remoteSha, diffResult]);

  const handlePull = useCallback(() => {
    if (!remoteDocument) return;

    setSyncState('pulling');

    try {
      const instructions = buildUpdateInstructions(remoteDocument);

      if (instructions.length === 0) {
        setSyncState('compared');
        showToast('No variable tokens to pull (only variables with Figma IDs can be pulled)', 'info');
        return;
      }

      sendToCode({ type: 'APPLY_TOKENS', instructions });
      // Result will come back via TOKENS_APPLIED message (handled in useEffect)
    } catch (err) {
      setSyncState('error');
      showToast(
        `Pull failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error',
      );
    }
  }, [remoteDocument]);

  // Detect potential conflict: both have changes
  const hasConflict = diffResult
    ? diffResult.summary.added > 0 && diffResult.summary.removed > 0
    : false;

  const isBusy = syncState === 'extracting' || syncState === 'pushing' || syncState === 'pulling';

  return (
    <div class="sync-view">
      {/* Step 1: Extract */}
      <button
        class="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleExtract}
        disabled={isBusy}
      >
        {syncState === 'extracting' ? 'Extracting...' : 'Extract Tokens from Figma'}
      </button>

      {/* Extraction Progress */}
      {syncState === 'extracting' && extractionProgress && (
        <div class="extraction-progress">
          <div class="progress-bar">
            <div class="progress-fill" style={{ width: `${extractionProgress.percent}%` }} />
          </div>
          <span class="progress-label">{extractionProgress.stage}</span>
        </div>
      )}

      {/* Token Summary */}
      {summary && (
        <div class="token-summary">
          <h3 style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
            Local Tokens ({summary.totalCount} total)
          </h3>
          <div class="token-cards-grid">
            {summary.colorCount > 0 && <TokenCard label="Colors" count={summary.colorCount} icon="C" />}
            {summary.dimensionCount > 0 && <TokenCard label="Dimensions" count={summary.dimensionCount} icon="D" />}
            {summary.typographyCount > 0 && <TokenCard label="Typography" count={summary.typographyCount} icon="T" />}
            {summary.shadowCount > 0 && <TokenCard label="Shadows" count={summary.shadowCount} icon="S" />}
            {summary.stringCount > 0 && <TokenCard label="Strings" count={summary.stringCount} icon="A" />}
            {summary.booleanCount > 0 && <TokenCard label="Booleans" count={summary.booleanCount} icon="B" />}
          </div>
          {summary.collectionNames.length > 0 && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-sm)' }}>
              Collections: {summary.collectionNames.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Compare */}
      {syncState === 'comparing' && (
        <button class="btn btn-secondary" style={{ width: '100%' }} disabled>
          Comparing...
        </button>
      )}
      {(syncState === 'extracted' || syncState === 'compared' || syncState === 'synced') && (
        <button
          class="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={handleCompare}
          disabled={!credentials.githubRepo}
        >
          Compare with GitHub
        </button>
      )}

      {/* Diff Viewer */}
      {diffResult && syncState === 'compared' && (
        <>
          {/* Conflict Warning */}
          {hasConflict && (
            <div class="conflict-warning">
              <span class="conflict-warning-icon">!</span>
              <div>
                <strong>Potential conflict detected.</strong> There are both new local tokens
                and tokens that exist only on GitHub. Review the diff carefully before choosing
                Push or Pull.
              </div>
            </div>
          )}

          <DiffViewer diff={diffResult} />

          {/* Step 3: Push or Pull */}
          <div class="sync-actions">
            <button
              class="btn btn-primary"
              onClick={handlePush}
              disabled={!credentials.githubRepo}
              title="Overwrite GitHub with local tokens"
            >
              Push to GitHub
            </button>
            <button
              class="btn btn-pull"
              onClick={handlePull}
              disabled={!remoteDocument}
              title="Apply GitHub tokens to Figma variables"
            >
              Pull to Figma
            </button>
          </div>
        </>
      )}

      {/* Pull Progress */}
      {syncState === 'pulling' && applyProgress && (
        <div class="extraction-progress">
          <div class="progress-bar">
            <div class="progress-fill" style={{ width: `${applyProgress.percent}%` }} />
          </div>
          <span class="progress-label">{applyProgress.stage}</span>
        </div>
      )}

      {/* Pushing state */}
      {syncState === 'pushing' && (
        <button class="btn btn-primary" style={{ width: '100%' }} disabled>
          Pushing...
        </button>
      )}

      {/* Pulling state (without progress data) */}
      {syncState === 'pulling' && !applyProgress && (
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
