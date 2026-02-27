import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, RawExtractionResult, DesignTokensDocument, SyncConfig, BridgeProject } from '../../types/messages';
import { sendToCode, onCodeMessage } from '../../utils/ui-message-bus';
import { transformToDocument } from '../../core/token-transformer';
import { BuildView } from './BuildView';
import { TokenBrowserView } from './TokenBrowserView';
import { HistoryView } from './HistoryView';
import { ChatView } from './ChatView';
import { showToast } from '../components/Toast';

var BRIDGE_API_URL = 'https://web-pied-iota-65.vercel.app';

type DashboardTab = 'tokens' | 'build' | 'history' | 'chat';

interface DashboardViewProps {
  connectionState: ConnectionState;
  credentials: CredentialPayload;
  onCredentialsChange: (creds: CredentialPayload) => void;
  onDisconnect: () => void;
  rawData: RawExtractionResult | null;
  extractionProgress: { stage: string; percent: number } | null;
  bridgeProjects: BridgeProject[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  bridgeToken: string | null;
}

export function DashboardView({
  connectionState,
  credentials,
  onCredentialsChange,
  onDisconnect,
  rawData,
  extractionProgress,
  bridgeProjects,
  selectedProjectId,
  onProjectChange,
  bridgeToken,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('tokens');
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);
  const [pushingToDashboard, setPushingToDashboard] = useState(false);

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

  // Get the currently selected project
  const selectedProject = bridgeProjects.find((p) => p.id === selectedProjectId) ?? null;

  // Format sync mode display
  const syncModeLabel = syncConfig
    ? `${syncConfig.syncMode === 'multi' ? 'Multi-file' : 'Single file'} \u00b7 ${syncConfig.pushMode === 'pr' ? 'PR mode' : 'Direct push'}`
    : null;

  // Push Figma variables to the web dashboard
  const handlePushToDashboard = useCallback(async () => {
    if (!rawData || !selectedProjectId || !bridgeToken) return;

    setPushingToDashboard(true);
    try {
      const payload = {
        ...rawData,
        figmaFileName: rawData.figmaFileName ?? 'Unknown',
      };

      const res = await fetch(
        BRIDGE_API_URL + '/api/projects/' + selectedProjectId + '/figma-variables',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + bridgeToken,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Push failed' }));
        throw new Error(err.error || 'Push failed (HTTP ' + res.status + ')');
      }

      showToast('Variables pushed to dashboard', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to push variables',
        'error',
      );
    } finally {
      setPushingToDashboard(false);
    }
  }, [rawData, selectedProjectId, bridgeToken]);

  return (
    <div class="plugin-body">
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
          Cosmikit
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {selectedProject
            ? 'Connected and ready to sync design tokens.'
            : 'Select a project to start syncing.'}
        </p>
      </div>

      {/* GitHub Account Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <span class={`status-badge ${connectionState.github}`}>
          <span class="dot" /> GitHub Account
        </span>
      </div>

      {/* ===== Project Selector Panel ===== */}
      <div class="project-selector-panel">
        <div class="project-selector-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <span
              class="project-status-dot"
              style={{ background: selectedProject ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}
            />
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Project</span>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            {selectedProject ? selectedProject.name : 'No project selected'}
          </span>
        </div>

        {/* Project Dropdown */}
        <div class="form-group" style={{ marginBottom: bridgeProjects.length > 0 ? 'var(--spacing-sm)' : 0 }}>
          {bridgeProjects.length > 0 ? (
            <select
              class="form-input"
              value={selectedProjectId ?? ''}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                if (val) onProjectChange(val);
              }}
            >
              <option value="">Choose a project...</option>
              {bridgeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.githubRepo})
                </option>
              ))}
            </select>
          ) : (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              No projects found. Create one at the web dashboard.
            </p>
          )}
        </div>

        {/* Selected Project Info (read-only) */}
        {selectedProject && (
          <div class="project-info-grid">
            <div class="project-info-item">
              <span class="project-info-label">Repository</span>
              <span class="project-info-value">{selectedProject.githubRepo}</span>
            </div>
            <div class="project-info-item">
              <span class="project-info-label">Branch</span>
              <span class="project-info-value">{selectedProject.githubBranch}</span>
            </div>
            <div class="project-info-item">
              <span class="project-info-label">File</span>
              <span class="project-info-value">{selectedProject.githubFilePath}</span>
            </div>
            {syncModeLabel && (
              <div class="project-info-item">
                <span class="project-info-label">Sync</span>
                <span class="project-info-value">{syncModeLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* Push Variables to Dashboard Button */}
        {selectedProject && rawData && (
          <button
            class="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
            onClick={handlePushToDashboard}
            disabled={pushingToDashboard}
          >
            {pushingToDashboard ? 'Pushing...' : 'Push Variables to Dashboard'}
          </button>
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
