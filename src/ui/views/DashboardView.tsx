import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, RawExtractionResult, DesignTokensDocument, SyncConfig } from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/ui-message-bus';
import { transformToDocument } from '../../core/token-transformer';
import { normalizeGithubRepo } from '../../utils/parse-repo';
import { StatusBadge } from '../components/StatusBadge';
import { BuildView } from './BuildView';
import { TokenBrowserView } from './TokenBrowserView';
import { HistoryView } from './HistoryView';
import { ChatView } from './ChatView';
import { showToast } from '../components/Toast';

type DashboardTab = 'tokens' | 'build' | 'history' | 'chat';

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
  const [editingSettings, setEditingSettings] = useState(false);
  const [editRepo, setEditRepo] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editFilePath, setEditFilePath] = useState('');

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

  // Format sync mode display
  const syncModeLabel = syncConfig
    ? `${syncConfig.syncMode === 'multi' ? 'Multi-file' : 'Single file'} \u00b7 ${syncConfig.pushMode === 'pr' ? 'PR mode' : 'Direct push'}`
    : null;

  return (
    <div class="plugin-body">
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
          Claude Bridge
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Connected and ready to sync design tokens.
        </p>
      </div>

      {/* Connection Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <StatusBadge status={connectionState.github} label="GitHub" />
      </div>

      {/* Repo Info / Settings */}
      <div style={{
        padding: 'var(--spacing-md)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
      }}>
        {!editingSettings ? (
          <>
            {credentials.githubRepo ? (
              <>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <strong>Repo:</strong> {credentials.githubRepo}
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <strong>Branch:</strong> {credentials.githubBranch ?? 'main'}
                </div>
                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <strong>File:</strong> {credentials.githubFilePath ?? 'tokens.json'}
                </div>
                {syncModeLabel && (
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>Sync:</strong> {syncModeLabel}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>
                No repository configured. Click Settings to add one.
              </div>
            )}
            <button
              class="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: 'var(--spacing-xs)' }}
              onClick={() => {
                setEditRepo(credentials.githubRepo ?? '');
                setEditBranch(credentials.githubBranch ?? 'main');
                setEditFilePath(credentials.githubFilePath ?? 'tokens.json');
                setEditingSettings(true);
              }}
            >
              Settings
            </button>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>Repository Settings</div>
            <div class="form-group" style={{ marginBottom: 'var(--spacing-sm)' }}>
              <label class="form-label">Repository</label>
              <input
                class="form-input"
                type="text"
                placeholder="owner/repo"
                value={editRepo}
                onInput={(e) => setEditRepo((e.target as HTMLInputElement).value)}
              />
              <span class="form-hint">Format: owner/repo-name</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
              <div class="form-group" style={{ flex: 1 }}>
                <label class="form-label">Branch</label>
                <input
                  class="form-input"
                  type="text"
                  placeholder="main"
                  value={editBranch}
                  onInput={(e) => setEditBranch((e.target as HTMLInputElement).value)}
                />
              </div>
              <div class="form-group" style={{ flex: 1 }}>
                <label class="form-label">File Path</label>
                <input
                  class="form-input"
                  type="text"
                  placeholder="tokens.json"
                  value={editFilePath}
                  onInput={(e) => setEditFilePath((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                class="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  const normalized = editRepo.trim() ? normalizeGithubRepo(editRepo.trim()) : '';
                  const updated: CredentialPayload = {
                    ...credentials,
                    githubRepo: normalized,
                    githubBranch: editBranch.trim() || 'main',
                    githubFilePath: editFilePath.trim() || 'tokens.json',
                  };
                  sendToCode({ type: 'SAVE_CREDENTIALS', payload: updated });
                  onCredentialsChange(updated);
                  setEditingSettings(false);
                  showToast('Repository settings saved', 'success');
                }}
                disabled={!editRepo.trim()}
              >
                Save
              </button>
              <button
                class="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => setEditingSettings(false)}
              >
                Cancel
              </button>
            </div>
          </>
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

      {/* Disconnect */}
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <button
          class="btn btn-danger"
          style={{ width: '100%' }}
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
