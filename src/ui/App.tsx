import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, CodeMessage, RawExtractionResult, BridgeProject, SyncConfig } from '../types/messages';
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
 * Also returns the full list of projects for the project selector.
 */
async function refreshFromBridge(
  token: string,
  cachedCredentials: CredentialPayload | null,
): Promise<{ credentials: CredentialPayload | null; projects: BridgeProject[] }> {
  try {
    // Fetch latest GitHub token from bridge
    const keysRes = await fetch(BRIDGE_API_URL + '/api/plugin/keys', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!keysRes.ok) return { credentials: null, projects: [] };
    const keys = await keysRes.json();

    // Fetch latest project config from bridge
    const configRes = await fetch(BRIDGE_API_URL + '/api/plugin/config', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!configRes.ok) return { credentials: null, projects: [] };
    const config = await configRes.json();

    const projects: BridgeProject[] = config.projects ?? [];

    // Use the first project if available
    const project = projects[0];

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
    return { credentials: freshCredentials, projects };
  } catch (err) {
    logger.error('Failed to refresh from bridge:', err);
    return { credentials: null, projects: [] };
  }
}

/**
 * Send a heartbeat to the bridge dashboard so the web UI can show plugin status.
 */
async function sendHeartbeat(
  token: string,
  projectId: string | null,
  figmaFileName?: string,
) {
  try {
    await fetch(BRIDGE_API_URL + '/api/plugin/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({
        projectId: projectId ?? undefined,
        figmaFileName: figmaFileName ?? undefined,
      }),
    });
  } catch {
    // Heartbeat failures are non-critical — silently ignore
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
  const [bridgeProjects, setBridgeProjects] = useState<BridgeProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Track heartbeat interval
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start heartbeat when bridge is connected and on dashboard
  useEffect(() => {
    if (bridgeToken && view === 'dashboard') {
      // Send immediate heartbeat
      sendHeartbeat(bridgeToken, selectedProjectId, rawData?.figmaFileName);

      // Then every 30 seconds
      heartbeatRef.current = setInterval(() => {
        sendHeartbeat(bridgeToken, selectedProjectId, rawData?.figmaFileName);
      }, 30000);

      return () => {
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
      };
    }
  }, [bridgeToken, view, selectedProjectId, rawData?.figmaFileName]);

  useEffect(() => {
    const unsubscribe = onCodeMessage((msg: CodeMessage) => {
      switch (msg.type) {
        case 'CREDENTIALS_LOADED': {
          if (msg.payload && msg.payload.githubToken) {
            // Credentials exist from a previous session — go directly to dashboard.
            setCredentials(msg.payload);
            setConnectionState({ github: 'connected' });
            setView('dashboard');
          } else {
            setView('connect');
          }
          break;
        }

        // Bridge token loaded — activate GitHub proxy and refresh credentials + projects
        case 'BRIDGE_TOKEN_LOADED': {
          if (msg.token) {
            setBridgeToken(msg.token);
            setGitHubProxy(BRIDGE_API_URL, msg.token);

            // Refresh credentials AND load projects from bridge
            refreshFromBridge(msg.token, credentials).then((result) => {
              if (result.credentials) {
                setCredentials(result.credentials);
                setConnectionState({ github: 'connected' });
                setView('dashboard');
              }
              if (result.projects.length > 0) {
                setBridgeProjects(result.projects);
                // Auto-select first project if none selected yet
                setSelectedProjectId((prev) => prev ?? result.projects[0].id);
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
          setBridgeProjects([]);
          setSelectedProjectId(null);
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

  const handleCredentialsChange = useCallback((creds: CredentialPayload) => {
    setCredentials(creds);
  }, []);

  const handleDisconnect = useCallback(() => {
    clearGitHubProxy();
    setCredentials(null);
    setConnectionState({ github: 'disconnected' });
    setRawData(null);
    setExtractionProgress(null);
    setBridgeProjects([]);
    setSelectedProjectId(null);
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setView('connect');
  }, []);

  // Handle project selection change from the dashboard
  const handleProjectChange = useCallback((projectId: string) => {
    const project = bridgeProjects.find((p) => p.id === projectId);
    if (!project) return;

    setSelectedProjectId(projectId);

    // Apply the project's config to credentials and sync config
    const updatedCredentials: CredentialPayload = {
      githubToken: credentials?.githubToken ?? '',
      githubRepo: project.githubRepo,
      githubBranch: project.githubBranch,
      githubFilePath: project.githubFilePath,
    };

    sendToCode({ type: 'SAVE_CREDENTIALS', payload: updatedCredentials });
    setCredentials(updatedCredentials);

    const config: SyncConfig = {
      syncMode: project.syncMode,
      pushMode: project.pushMode,
      fileMapping: project.fileMapping,
      defaultDirectory: project.defaultDirectory,
      baseBranch: project.githubBranch,
    };
    sendToCode({ type: 'SAVE_SYNC_CONFIG', config });

    showToast(`Switched to "${project.name}"`, 'success');
  }, [bridgeProjects, credentials]);

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
          onCredentialsChange={handleCredentialsChange}
          onDisconnect={handleDisconnect}
          rawData={rawData}
          extractionProgress={extractionProgress}
          bridgeProjects={bridgeProjects}
          selectedProjectId={selectedProjectId}
          onProjectChange={handleProjectChange}
          bridgeToken={bridgeToken}
        />
      )}

      <ToastContainer />
    </div>
  );
}
