import { useState, useMemo } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, RawExtractionResult, DesignTokensDocument } from '../../types/messages';
import { sendToCode } from '../../utils/message-bus';
import { transformToDocument } from '../../core/token-transformer';
import { StatusBadge } from '../components/StatusBadge';
import { SyncView } from './SyncView';
import { BuildView } from './BuildView';
import { TokenBrowserView } from './TokenBrowserView';
import { HistoryView } from './HistoryView';
import { ChatView } from './ChatView';

type DashboardTab = 'tokens' | 'build' | 'history' | 'chat';

interface DashboardViewProps {
  connectionState: ConnectionState;
  credentials: CredentialPayload;
  onDisconnect: () => void;
  rawData: RawExtractionResult | null;
  extractionProgress: { stage: string; percent: number } | null;
}

export function DashboardView({
  connectionState,
  credentials,
  onDisconnect,
  rawData,
  extractionProgress,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('tokens');

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
        <StatusBadge status={connectionState.claude} label="Claude API" />
        <StatusBadge status={connectionState.github} label="GitHub" />
      </div>

      {/* Repo Info */}
      {credentials.githubRepo && (
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-md)',
          fontSize: 'var(--font-size-sm)',
        }}>
          <div style={{ marginBottom: 'var(--spacing-xs)' }}>
            <strong>Repo:</strong> {credentials.githubRepo}
          </div>
          <div style={{ marginBottom: 'var(--spacing-xs)' }}>
            <strong>Branch:</strong> {credentials.githubBranch ?? 'main'}
          </div>
          <div>
            <strong>File:</strong> {credentials.githubFilePath ?? 'tokens.json'}
          </div>
        </div>
      )}

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
