import type { ConnectionState, CredentialPayload, RawExtractionResult } from '../../types/messages';
import { sendToCode } from '../../utils/message-bus';
import { StatusBadge } from '../components/StatusBadge';
import { SyncView } from './SyncView';

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
  const handleDisconnect = () => {
    sendToCode({ type: 'CLEAR_CREDENTIALS' });
    onDisconnect();
  };

  return (
    <div class="plugin-body">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
          Claude Bridge
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Connected and ready to sync design tokens.
        </p>
      </div>

      {/* Connection Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)' }}>
        <StatusBadge status={connectionState.claude} label="Claude API" />
        <StatusBadge status={connectionState.github} label="GitHub" />
      </div>

      {/* Repo Info */}
      {credentials.githubRepo && (
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-xl)',
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

      {/* Token Sync */}
      <SyncView
        credentials={credentials}
        rawData={rawData}
        extractionProgress={extractionProgress}
      />

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
