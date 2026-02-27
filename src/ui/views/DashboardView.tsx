import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, RawExtractionResult, DesignTokensDocument, SyncConfig } from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/ui-message-bus';
import { transformToDocument } from '../../core/token-transformer';
import { normalizeGithubRepo } from '../../utils/parse-repo';
import { checkRepoAccess, type RepoAccessResult } from '../../api/github-client';
import { BuildView } from './BuildView';
import { TokenBrowserView } from './TokenBrowserView';
import { HistoryView } from './HistoryView';
import { ChatView } from './ChatView';
import { showToast } from '../components/Toast';

type DashboardTab = 'tokens' | 'build' | 'history' | 'chat';
type RepoConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface DashboardViewProps {
  connectionState: ConnectionState;
  credentials: CredentialPayload;
  onCredentialsChange: (creds: CredentialPayload) => void;
  onDisconnect: () => void;
  rawData: RawExtractionResult | null;
  extractionProgress: { stage: string; percent: number } | null;
}

export function DashboardView({
  connectionState,
  credentials,
  onCredentialsChange,
  onDisconnect,
  rawData,
  extractionProgress,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('tokens');
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);

  // Repo connection state
  const [repoUrl, setRepoUrl] = useState(credentials.githubRepo ?? '');
  const [repoBranch, setRepoBranch] = useState(credentials.githubBranch ?? 'main');
  const [repoFilePath, setRepoFilePath] = useState(credentials.githubFilePath ?? 'tokens.json');
  const [repoStatus, setRepoStatus] = useState<RepoConnectionStatus>(
    credentials.githubRepo ? 'connected' : 'disconnected'
  );
  const [repoError, setRepoError] = useState('');
  const [repoAccess, setRepoAccess] = useState<RepoAccessResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load sync config on mount
  useEffect(() => {
    sendToCode({ type: 'LOAD_SYNC_CONFIG' });

    const unsubscribe = onCodeMessage((msg) => {
      if (msg.type === 'SYNC_CONFIG_LOADED') {
        setSyncConfig(msg.config);
      }
      if (msg.type === 'SYNC_CONFIG_SAVED') {
        // Reload after save
        sendToCode({ type: 'LOAD_SYNC_CONFIG' });
      }
    });
    return unsubscribe;
  }, []);

  // Compute tokens document from raw data
  const tokensDocument = useMemo<DesignTokensDocument | null>(() => {
    if (!rawData) return null;
    try {
      return transformToDocument(rawData);
    } catch {
      return null;
    }
  }, [rawData]);

  const handleDisconnect = () => {
    sendToCode({ type: 'CLEAR_CREDENTIALS' });
    onDisconnect();
  };

  // Connect to repository — validates access and saves credentials
  const handleRepoConnect = useCallback(async () => {
    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setRepoError('Please enter a repository URL or owner/repo');
      return;
    }

    const normalized = normalizeGithubRepo(trimmed);
    const parts = normalized.split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      setRepoError('Invalid repository format. Use owner/repo or paste a GitHub URL.');
      return;
    }

    setRepoStatus('connecting');
    setRepoError('');
    setRepoAccess(null);

    try {
      const [owner, repo] = parts;
      const access = await checkRepoAccess(credentials.githubToken, owner, repo);
      setRepoAccess(access);

      if (!access.repoExists) {
        setRepoStatus('error');
        setRepoError(access.error || `Repository "${owner}/${repo}" not found or not accessible.`);
        return;
      }

      if (!access.canRead) {
        setRepoStatus('error');
        setRepoError('Your GitHub token does not have read access to this repository.');
        return;
      }

      // Connected — save credentials
      const branch = repoBranch.trim() || 'main';
      const filePath = repoFilePath.trim() || 'tokens.json';
      const updated: CredentialPayload = {
        ...credentials,
        githubRepo: normalized,
        githubBranch: branch,
        githubFilePath: filePath,
      };
      sendToCode({ type: 'SAVE_CREDENTIALS', payload: updated });
      onCredentialsChange(updated);

      setRepoUrl(normalized);
      setRepoStatus('connected');

      if (!access.canPush) {
        showToast('Connected (read-only). Token lacks write permission for push.', 'info');
      } else {
        showToast(`Connected to ${normalized}`, 'success');
      }
    } catch (err) {
      setRepoStatus('error');
      setRepoError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [repoUrl, repoBranch, repoFilePath, credentials, onCredentialsChange]);

  // Reconnect — re-verify access to the current repository
  const handleRepoReconnect = useCallback(async () => {
    if (!credentials.githubRepo) return;

    setRepoStatus('connecting');
    setRepoError('');
    setRepoAccess(null);

    try {
      const normalized = normalizeGithubRepo(credentials.githubRepo);
      const [owner, repo] = normalized.split('/');
      const access = await checkRepoAccess(credentials.githubToken, owner, repo);
      setRepoAccess(access);

      if (!access.repoExists) {
        setRepoStatus('error');
        setRepoError(access.error || 'Repository not found or not accessible.');
        return;
      }

      if (!access.canRead) {
        setRepoStatus('error');
        setRepoError('Token does not have read access to this repository.');
        return;
      }

      setRepoStatus('connected');
      if (!access.canPush) {
        showToast('Reconnected (read-only). Token lacks write permission.', 'info');
      } else {
        showToast('Reconnected successfully', 'success');
      }
    } catch (err) {
      setRepoStatus('error');
      setRepoError(err instanceof Error ? err.message : 'Reconnection failed');
    }
  }, [credentials]);

  // Revoke — disconnect from the repository (but keep GitHub token)
  const handleRepoRevoke = useCallback(() => {
    const updated: CredentialPayload = {
      ...credentials,
      githubRepo: undefined,
      githubBranch: undefined,
      githubFilePath: undefined,
    };
    sendToCode({ type: 'SAVE_CREDENTIALS', payload: updated });
    onCredentialsChange(updated);

    setRepoUrl('');
    setRepoBranch('main');
    setRepoFilePath('tokens.json');
    setRepoStatus('disconnected');
    setRepoError('');
    setRepoAccess(null);
    setShowAdvanced(false);
    showToast('Repository disconnected', 'info');
  }, [credentials, onCredentialsChange]);

  // Format sync mode display
  const syncModeLabel = syncConfig
    ? `${syncConfig.syncMode === 'multi' ? 'Multi-file' : 'Single file'} \u00b7 ${syncConfig.pushMode === 'pr' ? 'PR mode' : 'Direct push'}`
    : null;

  // Status indicator helpers
  const statusDotColor = (() => {
    switch (repoStatus) {
      case 'connected': return 'var(--color-success)';
      case 'connecting': return 'var(--color-warning)';
      case 'error': return 'var(--color-error)';
      default: return 'var(--color-text-tertiary)';
    }
  })();

  const statusLabel = (() => {
    switch (repoStatus) {
      case 'connected': return repoAccess?.canPush ? 'Connected (read/write)' : 'Connected (read-only)';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection failed';
      default: return 'Not connected';
    }
  })();

  return (
    <div class="plugin-body">
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
          Claude Bridge
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {repoStatus === 'connected'
            ? 'Connected and ready to sync design tokens.'
            : 'Connect a GitHub repository to start syncing.'}
        </p>
      </div>

      {/* GitHub Account Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <span class={`status-badge ${connectionState.github}`}>
          <span class="dot" /> GitHub Account
        </span>
      </div>

      {/* ===== Repository Connection Panel ===== */}
      <div class="repo-connection-panel">
        {/* Panel Header with Status */}
        <div class="repo-connection-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span class="repo-status-dot" style={{ background: statusDotColor }} />
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Repository</span>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: repoStatus === 'error' ? 'var(--color-error)' : 'var(--color-text-tertiary)' }}>
            {statusLabel}
          </span>
        </div>

        {/* Connected State */}
        {repoStatus === 'connected' && credentials.githubRepo && (
          <div>
            <div class="repo-info-grid">
              <div class="repo-info-item">
                <span class="repo-info-label">Repository</span>
                <span class="repo-info-value">{credentials.githubRepo}</span>
              </div>
              <div class="repo-info-item">
                <span class="repo-info-label">Branch</span>
                <span class="repo-info-value">{credentials.githubBranch ?? 'main'}</span>
              </div>
              <div class="repo-info-item">
                <span class="repo-info-label">File</span>
                <span class="repo-info-value">{credentials.githubFilePath ?? 'tokens.json'}</span>
              </div>
              {syncModeLabel && (
                <div class="repo-info-item">
                  <span class="repo-info-label">Sync</span>
                  <span class="repo-info-value">{syncModeLabel}</span>
                </div>
              )}
              {repoAccess && (
                <div class="repo-info-item">
                  <span class="repo-info-label">Permissions</span>
                  <span class="repo-info-value">
                    {repoAccess.canPush ? 'Read & Write' : 'Read Only'}
                    {!repoAccess.canPush && (
                      <span style={{ color: 'var(--color-warning)', marginLeft: '4px' }} title="Token needs 'Contents: Read and write' permission for push">
                        (!)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
              <button
                class="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={handleRepoReconnect}
              >
                Reconnect
              </button>
              <button
                class="btn btn-danger btn-sm"
                style={{ flex: 1 }}
                onClick={handleRepoRevoke}
              >
                Revoke
              </button>
            </div>
          </div>
        )}

        {/* Connecting State */}
        {repoStatus === 'connecting' && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0' }}>
            <div class="repo-connecting-spinner" />
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-sm)', display: 'block' }}>
              Verifying repository access...
            </span>
          </div>
        )}

        {/* Disconnected / Error State — show input form */}
        {(repoStatus === 'disconnected' || repoStatus === 'error') && (
          <div>
            <div class="form-group" style={{ marginBottom: 'var(--spacing-sm)' }}>
              <label class="form-label">Repository URL or owner/repo</label>
              <input
                class={`form-input ${repoError ? 'error' : ''}`}
                type="text"
                placeholder="https://github.com/owner/repo or owner/repo"
                value={repoUrl}
                onInput={(e) => {
                  setRepoUrl((e.target as HTMLInputElement).value);
                  if (repoError) setRepoError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRepoConnect();
                }}
              />
              {repoError && <span class="form-error">{repoError}</span>}
              <span class="form-hint">Paste a GitHub URL or type owner/repo-name</span>
            </div>

            {/* Advanced settings toggle */}
            <button
              class="repo-advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>
                &#9654;
              </span>
              Advanced Settings
            </button>

            {showAdvanced && (
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                <div class="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label class="form-label">Branch</label>
                  <input
                    class="form-input"
                    type="text"
                    placeholder="main"
                    value={repoBranch}
                    onInput={(e) => setRepoBranch((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div class="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label class="form-label">Token File</label>
                  <input
                    class="form-input"
                    type="text"
                    placeholder="tokens.json"
                    value={repoFilePath}
                    onInput={(e) => setRepoFilePath((e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>
            )}

            <button
              class="btn btn-primary btn-sm"
              style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
              onClick={handleRepoConnect}
              disabled={!repoUrl.trim()}
            >
              Connect Repository
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div class="dashboard-tabs">
        <button
          class={`dashboard-tab ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          Tokens
        </button>
        <button
          class={`dashboard-tab ${activeTab === 'build' ? 'active' : ''}`}
          onClick={() => setActiveTab('build')}
        >
          Build
        </button>
        <button
          class={`dashboard-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          class={`dashboard-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tokens' && (
        <TokenBrowserView
          rawData={rawData}
          tokensDocument={tokensDocument}
          credentials={credentials}
          extractionProgress={extractionProgress}
          syncConfig={syncConfig}
        />
      )}

      {activeTab === 'build' && (
        <BuildView
          apiKey={credentials.claudeApiKey}
          tokensDocument={tokensDocument}
        />
      )}

      {activeTab === 'history' && (
        <HistoryView />
      )}

      {activeTab === 'chat' && (
        <ChatView
          apiKey={credentials.claudeApiKey}
          tokensDocument={tokensDocument}
        />
      )}

      {/* Disconnect from Bridge */}
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <button
          class="btn btn-danger"
          style={{ width: '100%' }}
          onClick={handleDisconnect}
        >
          Disconnect from Bridge
        </button>
      </div>
    </div>
  );
}
