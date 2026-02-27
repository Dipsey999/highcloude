import { useState, useEffect, useCallback } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, CodeMessage, RawExtractionResult } from '../types/messages';
import { onCodeMessage, sendToCode } from '../utils/ui-message-bus';
import { validateCredentials } from '../api/auth-manager';
import { setGitHubProxy, clearGitHubProxy } from '../api/github-fetch';
import { logger } from '../utils/logger';
import { ConnectView } from './views/ConnectView';
import { DashboardView } from './views/DashboardView';
import { ToastContainer, showToast } from './components/Toast';

var BRIDGE_API_URL = 'https://web-pied-iota-65.vercel.app';

/**
 * Refresh credentials and project config from the bridge dashboard.
 * This ensures the plugin always uses the latest GitHub token and project settings.
 */
async function refreshFromBridge(
  token: string,
  cachedCredentials: CredentialPayload | null,
): Promise<CredentialPayload | null> {
  try {
    // Fetch latest GitHub token from bridge
    const keysRes = await fetch(BRIDGE_API_URL + '/api/plugin/keys', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!keysRes.ok) return null;
    const keys = await keysRes.json();

    // Fetch latest project config from bridge
    const configRes = await fetch(BRIDGE_API_URL + '/api/plugin/config', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!configRes.ok) return null;
    const config = await configRes.json();

    // Use the first project if available (same logic as ConnectView auto-select)
    const project = config.projects?.[0];

    const freshCredentials: CredentialPayload = {
      githubToken: keys.githubToken || cachedCredentials?.githubToken || '',
      githubRepo: project?.githubRepo || cachedCredentials?.githubRepo,
      githubBranch: project?.githubBranch || cachedCredentials?.githubBranch,
      githubFilePath: project?.githubFilePath || cachedCredentials?.githubFilePath,
    };

    // Persist the refreshed credentials
    sendToCode({ type: 'SAVE_CREDENTIALS', payload: freshCredentials });

    if (project) {
      sendToCode({
        type: 'SAVE_SYNC_CONFIG',
        config: {
          syncMode: project.syncMode,
          pushMode: project.pushMode,
          fileMapping: project.fileMapping,
          defaultDirectory: project.defaultDirectory,
          baseBranch: project.githubBranch,
        },
      });
    }

    logger.info('Refreshed credentials from bridge');
    return freshCredentials;
  } catch (err) {
    logger.error('Failed to refresh from bridge:', err);
    return null;
  }
}

type AppView = 'loading' | 'connect' | 'dashboard';

export function App() {
  const [view, setView] = useState<AppView>('loading');
  const [credentials, setCredentials] = useState<CredentialPayload | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    github: 'disconnected',
  });
  const [rawData, setRawData] = useState<RawExtractionResult | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [bridgeToken, setBridgeToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onCodeMessage((msg: CodeMessage) => {
      switch (msg.type) {
        case 'CREDENTIALS_LOADED': {
          if (msg.payload && msg.payload.githubToken) {
            // Credentials exist from a previous session — go directly to dashboard.
            // Skip network validation here because the GitHub proxy (bridge)
            // may not be set up yet (BRIDGE_TOKEN_LOADED races with this message).
            // Actual GitHub operations (compare, push) will validate the token
            // implicitly when they run, after the proxy is ready.
            setCredentials(msg.payload);
            setConnectionState({ github: 'connected' });
            setView('dashboard');
          } else {
            setView('connect');
          }
          break;
        }

        // Bridge token loaded — activate GitHub proxy and refresh credentials
        case 'BRIDGE_TOKEN_LOADED': {
          if (msg.token) {
            setBridgeToken(msg.token);
            setGitHubProxy(BRIDGE_API_URL, msg.token);

            // Always refresh credentials from the dashboard so we use the latest
            // GitHub token (the user may have updated it on the web).
            refreshFromBridge(msg.token, credentials).then((fresh) => {
              if (fresh) {
                setCredentials(fresh);
                setConnectionState({ github: 'connected' });
                setView('dashboard');
              }
            });
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
    sendToCode({ type: 'LOAD_BRIDGE_TOKEN' });

    return unsubscribe;
  }, []);

  const handleConnected = useCallback(() => {
    setConnectionState({ github: 'connected' });
    setView('dashboard');
  }, []);

  const handleDisconnect = useCallback(() => {
    clearGitHubProxy();
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
          initialBridgeToken={bridgeToken}
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
