import { useState, useCallback } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, SyncConfig, BridgeProject, CodeMessage } from '../../types/messages';
import { validateGitHubOnly } from '../../api/auth-manager';
import { fetchUserRepos, type GitHubRepo } from '../../api/github-client';
import { setGitHubProxy, clearGitHubProxy } from '../../api/github-fetch';
import { sendToCode, onCodeMessage } from '../../utils/ui-message-bus';
import { StatusBadge } from '../components/StatusBadge';
import { SyncConfigPanel } from '../components/SyncConfigPanel';
import { showToast } from '../components/Toast';

var BRIDGE_API_URL = 'https://web-pied-iota-65.vercel.app';

type AuthTab = 'manual' | 'bridge';

interface ConnectViewProps {
  onConnected: () => void;
  initialCredentials?: CredentialPayload | null;
  initialSyncConfig?: SyncConfig | null;
  initialBridgeToken?: string | null;
}

export function ConnectView({ onConnected, initialCredentials, initialSyncConfig, initialBridgeToken }: ConnectViewProps) {
  const [authTab, setAuthTab] = useState<AuthTab>(initialBridgeToken ? 'bridge' : 'manual');

  // Bridge state
  const [bridgeToken, setBridgeToken] = useState(initialBridgeToken ?? '');
  const [bridgeConnecting, setBridgeConnecting] = useState(false);
  const [bridgeError, setBridgeError] = useState('');
  const [bridgeProjects, setBridgeProjects] = useState<BridgeProject[]>([]);
  const [bridgeConnected, setBridgeConnected] = useState(!!initialBridgeToken);
  const [selectedBridgeProject, setSelectedBridgeProject] = useState('');

  // Manual state
  const [githubToken, setGitHubToken] = useState(initialCredentials?.githubToken ?? '');
  const [selectedRepo, setSelectedRepo] = useState(initialCredentials?.githubRepo ?? '');
  const [branch, setBranch] = useState(initialCredentials?.githubBranch ?? 'main');
  const [filePath, setFilePath] = useState(initialCredentials?.githubFilePath ?? 'tokens.json');
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(initialSyncConfig ?? null);

  const [connection, setConnection] = useState<ConnectionState>({
    github: initialCredentials?.githubToken ? 'connected' : 'disconnected',
  });

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubError, setGitHubError] = useState('');

  // ========== Bridge Handlers ==========

  const handleBridgeConnect = useCallback(async () => {
    if (!bridgeToken.trim()) {
      setBridgeError('Please paste your bridge token');
      return;
    }

    setBridgeConnecting(true);
    setBridgeError('');

    try {
      // Fetch keys from bridge API
      var keysRes = await fetch(BRIDGE_API_URL + '/api/plugin/keys', {
        headers: { 'Authorization': 'Bearer ' + bridgeToken },
      });
      if (!keysRes.ok) {
        var keysErr = await keysRes.json().catch(function() { return { error: 'Invalid token' }; });
        throw new Error(keysErr.error || 'Failed to fetch keys (HTTP ' + keysRes.status + ')');
      }
      var keysMsg = await keysRes.json();

      // Fetch config from bridge API
      var configRes = await fetch(BRIDGE_API_URL + '/api/plugin/config', {
        headers: { 'Authorization': 'Bearer ' + bridgeToken },
      });
      if (!configRes.ok) {
        throw new Error('Failed to fetch projects (HTTP ' + configRes.status + ')');
      }
      var configMsg = await configRes.json();

      // Save bridge token to storage
      sendToCode({ type: 'SAVE_BRIDGE_TOKEN', token: bridgeToken });

      // Activate GitHub proxy through bridge so API calls work from iframe
      setGitHubProxy(BRIDGE_API_URL, bridgeToken);

      // Save the credentials from bridge (GitHub token only needed)
      const credentials: CredentialPayload = {
        githubToken: keysMsg.githubToken || '',
      };
      sendToCode({ type: 'SAVE_CREDENTIALS', payload: credentials });

      setBridgeProjects(configMsg.projects || []);
      setBridgeConnected(true);
      showToast('Connected to Cosmikit', 'success');

      // If only one project, auto-select it
      if (configMsg.projects && configMsg.projects.length === 1) {
        setSelectedBridgeProject(configMsg.projects[0].id);
        applyBridgeProject(configMsg.projects[0], credentials);
      }
    } catch (err) {
      setBridgeError(err instanceof Error ? err.message : 'Connection failed');
      showToast('Bridge connection failed', 'error');
    } finally {
      setBridgeConnecting(false);
    }
  }, [bridgeToken]);

  const applyBridgeProject = useCallback((project: BridgeProject, creds?: CredentialPayload) => {
    const credentials: CredentialPayload = {
      githubToken: creds?.githubToken || githubToken,
      githubRepo: project.githubRepo,
      githubBranch: project.githubBranch,
      githubFilePath: project.githubFilePath,
    };

    sendToCode({ type: 'SAVE_CREDENTIALS', payload: credentials });

    const config: SyncConfig = {
      syncMode: project.syncMode,
      pushMode: project.pushMode,
      fileMapping: project.fileMapping,
      defaultDirectory: project.defaultDirectory,
      baseBranch: project.githubBranch,
    };
    sendToCode({ type: 'SAVE_SYNC_CONFIG', config });

    showToast(`Project "${project.name}" configured`, 'success');
    onConnected();
  }, [githubToken, onConnected]);

  const handleBridgeProjectSelect = useCallback((projectId: string) => {
    setSelectedBridgeProject(projectId);
    const project = bridgeProjects.find((p) => p.id === projectId);
    if (project) {
      applyBridgeProject(project);
    }
  }, [bridgeProjects, applyBridgeProject]);

  // ========== Manual Handlers ==========

  const handleValidateGitHub = useCallback(async () => {
    setGitHubError('');
    setConnection((prev) => ({ ...prev, github: 'validating' }));

    const result = await validateGitHubOnly(githubToken);

    if (result.valid) {
      setConnection((prev) => ({ ...prev, github: 'connected' }));
      showToast(`GitHub connected as ${result.username}`, 'success');

      try {
        const userRepos = await fetchUserRepos(githubToken);
        setRepos(userRepos);
      } catch {
        showToast('Failed to fetch repositories', 'error');
      }
    } else {
      setConnection((prev) => ({ ...prev, github: 'error' }));
      setGitHubError(result.error ?? 'Validation failed');
      showToast(result.error ?? 'Invalid GitHub token', 'error');
    }
  }, [githubToken]);

  const handleSyncConfigSave = useCallback((config: SyncConfig) => {
    setSyncConfig(config);
    sendToCode({ type: 'SAVE_SYNC_CONFIG', config });
    showToast('Sync configuration saved', 'success');
  }, []);

  const handleConnect = useCallback(() => {
    const credentials: CredentialPayload = {
      githubToken: githubToken,
      githubRepo: selectedRepo,
      githubBranch: branch,
      githubFilePath: filePath,
    };

    sendToCode({ type: 'SAVE_CREDENTIALS', payload: credentials });

    // Save sync config if configured
    if (syncConfig) {
      sendToCode({ type: 'SAVE_SYNC_CONFIG', config: syncConfig });
    }

    showToast('Credentials saved', 'success');
    onConnected();
  }, [githubToken, selectedRepo, branch, filePath, syncConfig, onConnected]);

  const githubConnected = connection.github === 'connected';

  const tabStyle = (tab: AuthTab) => ({
    flex: 1,
    padding: 'var(--spacing-sm) var(--spacing-md)',
    border: 'none',
    borderBottom: authTab === tab ? '2px solid var(--color-brand)' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: authTab === tab ? 600 : 400,
    color: authTab === tab ? 'var(--color-brand)' : 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center' as const,
  });

  return (
    <div class="plugin-body">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
          Connect GitHub
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Connect your GitHub account to sync design tokens. AI features are free through Claude MCP.
        </p>
      </div>

      {/* MCP Info Banner */}
      <div style={{
        padding: 'var(--spacing-md)',
        background: 'linear-gradient(135deg, #f3e8ff, #faf5ff)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-xl)',
        border: '1px solid #e9d5ff',
      }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px' }}>&#10024;</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: '#6b21a8', marginBottom: '4px' }}>
              AI Features — Free with Claude MCP
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#7c3aed' }}>
              Design generation, chat, and AI features work through Figma's built-in Claude MCP integration — no API key needed.
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-xl)' }}>
        <button style={tabStyle('bridge')} onClick={() => setAuthTab('bridge')}>
          Cosmikit
        </button>
        <button style={tabStyle('manual')} onClick={() => setAuthTab('manual')}>
          Manual Setup
        </button>
      </div>

      {/* ===== Bridge Tab ===== */}
      {authTab === 'bridge' && (
        <div>
          {!bridgeConnected ? (
            <div>
              <div class="form-group">
                <label class="form-label">Bridge Token</label>
                <input
                  class={`form-input ${bridgeError ? 'error' : ''}`}
                  type="password"
                  placeholder="Paste your token from the web dashboard..."
                  value={bridgeToken}
                  onInput={(e) => setBridgeToken((e.target as HTMLInputElement).value)}
                />
                {bridgeError && <span class="form-error">{bridgeError}</span>}
                <span class="form-hint">
                  Get your token at web-pied-iota-65.vercel.app/dashboard/plugin-token
                </span>
              </div>
              <button
                class="btn btn-primary"
                style={{ width: '100%' }}
                onClick={handleBridgeConnect}
                disabled={!bridgeToken.trim() || bridgeConnecting}
              >
                {bridgeConnecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-bg-success)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-lg)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-success)',
              }}>
                Connected to Cosmikit
              </div>

              {bridgeProjects.length > 0 && (
                <div class="form-group">
                  <label class="form-label">Select Project</label>
                  <select
                    class="form-input"
                    value={selectedBridgeProject}
                    onChange={(e) => handleBridgeProjectSelect((e.target as HTMLSelectElement).value)}
                  >
                    <option value="">Choose a project...</option>
                    {bridgeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.githubRepo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {bridgeProjects.length === 0 && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  No projects found. Create one at web-pied-iota-65.vercel.app/dashboard
                </p>
              )}

              <button
                class="btn btn-secondary"
                style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                onClick={() => {
                  sendToCode({ type: 'CLEAR_BRIDGE_TOKEN' });
                  clearGitHubProxy();
                  setBridgeConnected(false);
                  setBridgeToken('');
                  setBridgeProjects([]);
                  showToast('Disconnected from bridge', 'info');
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== Manual Tab ===== */}
      {authTab === 'manual' && (
        <div>
          {/* GitHub Token */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
              <span style={{ fontWeight: 600 }}>GitHub</span>
              <StatusBadge status={connection.github} label="GitHub" />
            </div>
            <div class="form-group">
              <label class="form-label">Personal Access Token</label>
              <input
                class={`form-input ${githubError ? 'error' : ''}`}
                type="password"
                placeholder="github_pat_... or ghp_..."
                value={githubToken}
                onInput={(e) => setGitHubToken((e.target as HTMLInputElement).value)}
              />
              {githubError && <span class="form-error">{githubError}</span>}
              <span class="form-hint">Needs Contents and Pull requests read/write permissions</span>
            </div>
            <button
              class="btn btn-secondary"
              onClick={handleValidateGitHub}
              disabled={!githubToken || connection.github === 'validating'}
            >
              {connection.github === 'validating' ? 'Validating...' : 'Validate Token'}
            </button>
          </div>

          {/* Repo Selection */}
          {repos.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <div class="form-group">
                <label class="form-label">Repository</label>
                <select
                  class="form-input"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo((e.target as HTMLSelectElement).value)}
                >
                  <option value="">Select a repository...</option>
                  {repos.map((repo) => (
                    <option key={repo.full_name} value={repo.full_name}>
                      {repo.full_name} {repo.private ? '(private)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Branch</label>
                <input
                  class="form-input"
                  type="text"
                  value={branch}
                  onInput={(e) => setBranch((e.target as HTMLInputElement).value)}
                />
              </div>
              <div class="form-group">
                <label class="form-label">Token file path</label>
                <input
                  class="form-input"
                  type="text"
                  placeholder="tokens.json"
                  value={filePath}
                  onInput={(e) => setFilePath((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          )}

          {/* Sync Config (shown after repo selection) */}
          {selectedRepo && (
            <SyncConfigPanel
              initialConfig={syncConfig}
              collectionNames={[]}
              onSave={handleSyncConfigSave}
            />
          )}

          {/* Connect Button */}
          <button
            class="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleConnect}
            disabled={!githubConnected}
          >
            Save & Connect
          </button>
        </div>
      )}
    </div>
  );
}
