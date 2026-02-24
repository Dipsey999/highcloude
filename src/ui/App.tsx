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
            setConnectionState({ github: 'validating' });
            validateCredentials(msg.payload).then((result) => {
              setConnectionState(result.connectionState);
              if (result.connectionState.github === 'connected') {
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
          setConnectionState({ github: 'disconnected' });
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
          break;

        case 'APPLY_PROGRESS':
          break;

        case 'DESIGN_CREATED':
          break;

        case 'DESIGN_CREATION_PROGRESS':
          break;

        case 'SELECTION_EXPORTED':
          break;

        case 'EXPORT_PROGRESS':
          break;

        case 'AUTO_MAP_RESULT':
          break;

        case 'AUTO_MAP_PROGRESS':
          break;

        case 'BINDINGS_APPLIED':
          break;

        // Phase 6: Token Browser
        case 'TOKEN_USAGE_RESULT':
          break;
        case 'TOKEN_VALUE_UPDATED':
          break;
        case 'VARIABLE_MODES_RESULT':
          break;

        // Phase 6: Sync History
        case 'SYNC_HISTORY_LOADED':
          break;
        case 'SYNC_ENTRY_SAVED':
          break;
        case 'REVERT_COMPLETE':
          break;
        case 'SYNC_HISTORY_CLEARED':
          break;

        // Phase 6: Batch Operations
        case 'BATCH_AUTO_MAP_ALL_RESULT':
          break;
        case 'BATCH_AUTO_MAP_ALL_PROGRESS':
          break;
        case 'DTCG_VALIDATION_RESULT':
          break;
        case 'UNUSED_TOKENS_RESULT':
          break;
        case 'ORPHANED_VALUES_RESULT':
          break;

        // Phase 7: Multi-File & Team Sync
        case 'SYNC_CONFIG_LOADED':
          break;
        case 'SYNC_CONFIG_SAVED':
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
    setConnectionState({ github: 'connected' });
    setView('dashboard');
  }, []);

  const handleDisconnect = useCallback(() => {
    setCredentials(null);
    setConnectionState({ github: 'disconnected' });
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
            <span class={`status-badge ${connectionState.github}`}>
              <span class="dot" /> GitHub
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
