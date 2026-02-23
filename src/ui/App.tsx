import { useState, useEffect, useCallback } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, CodeMessage, RawExtractionResult } from '../types/messages';
import { onCodeMessage, sendToCode } from '../utils/message-bus';
import { validateCredentials } from '../api/auth-manager';
import { ConnectView } from './views/ConnectView';
import { DashboardView } from './views/DashboardView';
import { ToastContainer, showToast } from './components/Toast';

type AppView = 'loading' | 'connect' | 'dashboard';

export function App() {
  const [view, setView] = useState<AppView>('loading');
  const [credentials, setCredentials] = useState<CredentialPayload | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    claude: 'disconnected',
    github: 'disconnected',
  });
  const [rawData, setRawData] = useState<RawExtractionResult | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<{ stage: string; percent: number } | null>(null);

  useEffect(() => {
    const unsubscribe = onCodeMessage((msg: CodeMessage) => {
      switch (msg.type) {
        case 'CREDENTIALS_LOADED': {
          if (msg.payload) {
            setCredentials(msg.payload);
            setConnectionState({ claude: 'validating', github: 'validating' });
            validateCredentials(msg.payload).then((result) => {
              setConnectionState(result.connectionState);
              if (
                result.connectionState.claude === 'connected' &&
                result.connectionState.github === 'connected'
              ) {
                setView('dashboard');
              } else {
                setView('connect');
              }
            });
          } else {
            setView('connect');
          }
          break;
        }

        case 'CREDENTIALS_SAVED':
          break;

        case 'CREDENTIALS_CLEARED': {
          setCredentials(null);
          setConnectionState({ claude: 'disconnected', github: 'disconnected' });
          setRawData(null);
          setExtractionProgress(null);
          setView('connect');
          break;
        }

        case 'TOKENS_EXTRACTED': {
          setRawData(msg.data);
          setExtractionProgress(null);
          break;
        }

        case 'EXTRACTION_PROGRESS': {
          setExtractionProgress({ stage: msg.stage, percent: msg.percent });
          break;
        }

        case 'SELECTION_DATA':
          break;

        case 'TOKENS_APPLIED':
          // Handled by SyncView directly
          break;

        case 'APPLY_PROGRESS':
          // Handled by SyncView directly
          break;

        case 'DESIGN_CREATED':
          // Handled by GenerateView directly
          break;

        case 'DESIGN_CREATION_PROGRESS':
          // Handled by GenerateView / InspectView directly
          break;

        case 'SELECTION_EXPORTED':
          // Handled by InspectView directly
          break;

        case 'EXPORT_PROGRESS':
          // Handled by InspectView directly
          break;

        case 'AUTO_MAP_RESULT':
          // Handled by InspectView directly
          break;

        case 'AUTO_MAP_PROGRESS':
          // Handled by InspectView directly
          break;

        case 'BINDINGS_APPLIED':
          // Handled by InspectView directly
          break;

        // Phase 6: Token Browser
        case 'TOKEN_USAGE_RESULT':
          // Handled by TokenBrowserView directly
          break;
        case 'TOKEN_VALUE_UPDATED':
          // Handled by TokenBrowserView directly
          break;
        case 'VARIABLE_MODES_RESULT':
          // Handled by TokenBrowserView directly
          break;

        // Phase 6: Sync History
        case 'SYNC_HISTORY_LOADED':
          // Handled by HistoryView directly
          break;
        case 'SYNC_ENTRY_SAVED':
          // Handled by SyncView directly
          break;
        case 'REVERT_COMPLETE':
          // Handled by HistoryView directly
          break;
        case 'SYNC_HISTORY_CLEARED':
          // Handled by HistoryView directly
          break;

        // Phase 6: Batch Operations
        case 'BATCH_AUTO_MAP_ALL_RESULT':
          // Handled by BatchActionsMenu directly
          break;
        case 'BATCH_AUTO_MAP_ALL_PROGRESS':
          // Handled by TokenBrowserView directly
          break;
        case 'DTCG_VALIDATION_RESULT':
          // Handled by BatchActionsMenu directly
          break;
        case 'UNUSED_TOKENS_RESULT':
          // Handled by BatchActionsMenu directly
          break;
        case 'ORPHANED_VALUES_RESULT':
          // Handled by BatchActionsMenu directly
          break;

        case 'ERROR': {
          showToast(msg.message, 'error');
          setExtractionProgress(null);
          break;
        }
      }
    });

    sendToCode({ type: 'LOAD_CREDENTIALS' });

    return unsubscribe;
  }, []);

  const handleConnected = useCallback(() => {
    setConnectionState({ claude: 'connected', github: 'connected' });
    setView('dashboard');
  }, []);

  const handleDisconnect = useCallback(() => {
    setCredentials(null);
    setConnectionState({ claude: 'disconnected', github: 'disconnected' });
    setRawData(null);
    setExtractionProgress(null);
    setView('connect');
  }, []);

  return (
    <div class="plugin-container">
      <div class="plugin-header">
        <h1>Claude Bridge</h1>
        {view === 'dashboard' && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <span class={`status-badge ${connectionState.claude}`}>
              <span class="dot" /> C
            </span>
            <span class={`status-badge ${connectionState.github}`}>
              <span class="dot" /> G
            </span>
          </div>
        )}
      </div>

      {view === 'loading' && (
        <div class="plugin-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>Loading...</span>
        </div>
      )}

      {view === 'connect' && (
        <ConnectView
          onConnected={handleConnected}
          initialCredentials={credentials}
        />
      )}

      {view === 'dashboard' && credentials && (
        <DashboardView
          connectionState={connectionState}
          credentials={credentials}
          onDisconnect={handleDisconnect}
          rawData={rawData}
          extractionProgress={extractionProgress}
        />
      )}

      <ToastContainer />
    </div>
  );
}
