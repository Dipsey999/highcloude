import { useState, useCallback } from 'preact/hooks';
import type { ConnectionState, CredentialPayload, SyncConfig, BridgeProject } from '../../types/messages';
import { validateClaudeOnly, validateGitHubOnly } from '../../api/auth-manager';
import { fetchUserRepos, type GitHubRepo } from '../../api/github-client';
import { sendToCode } from '../../utils/message-bus';
import { StatusBadge } from '../components/StatusBadge';
import { SyncConfigPanel } from '../components/SyncConfigPanel';
import { showToast } from '../components/Toast';

const BRIDGE_API_URL = 'https://claude-bridge.vercel.app';

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
  const [claudeKey, setClaudeKey] = useState(initialCredentials?.claudeApiKey ?? '');
  const [githubToken, setGitHubToken] = useState(initialCredentials?.githubToken ?? '');
  const [selectedRepo, setSelectedRepo] = useState(initialCredentials?.githubRepo ?? '');
  const [branch, setBranch] = useState(initialCredentials?.githubBranch ?? 'main');
  const [filePath, setFilePath] = useState(initialCredentials?.githubFilePath ?? 'tokens.json');
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(initialSyncConfig ?? null);

  const [connection, setConnection] = useState<ConnectionState>({
    claude: initialCredentials?.claudeApiKey ? 'connected' : 'disconnected',
    github: initialCredentials?.githubToken ? 'connected' : 'disconnected',
  });

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [claudeError, setClaudeError] = useState('');
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
      // Fetch keys from bridge
      const keysRes = await fetch(`${BRIDGE_API_URL}/api/plugin/keys`, {
        headers: { Authorization: `Bearer ${bridgeToken}` },
      });

      if (!keysRes.ok) {
        const err = await keysRes.json().catch(() => ({ error: 'Invalid token' }));
        throw new Error(err.error || 'Failed to fetch keys');
      }

      const keys = await keysRes.json();

      // Fetch config (projects)
      const configRes = await fetch(`${BRIDGE_API_URL}/api/plugin/config`, {
        headers: { Authorization: `Bearer ${bridgeToken}` },
      });

      if (!configRes.ok) {
        throw new Error('Failed to fetch projects');
      }

      const config = await configRes.json();

      // Save bridge token to storage
      sendToCode({ type: 'SAVE_BRIDGE_TOKEN', token: bridgeToken });

      // Save the credentials from bridge
      const credentials: CredentialPayload = {
        claudeApiKey: keys.claudeApiKey || '',
        githubToken: keys.githubToken || '',
      };
      sendToCode({ type: 'SAVE_CREDENTIALS', payload: credentials });

      setBridgeProjects(config.projects || []);
      setBridgeConnected(true);
      showToast('Connected to Claude Bridge', 'success');

      // If only one project, auto-select it
      if (config.projects?.length === 1) {
        setSelectedBridgeProject(config.projects[0].id);
        applyBridgeProject(config.projects[0], credentials);
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
      claudeApiKey: creds?.claudeApiKey || claudeKey,
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
  }, [claudeKey, githubToken, onConnected]);

  const handleBridgeProjectSelect = useCallback((projectId: string) => {
    setSelectedBridgeProject(projectId);
    const project = bridgeProjects.find((p) => p.id === projectId);
    if (project) {
      applyBridgeProject(project);
    }
  }, [bridgeProjects, applyBridgeProject]);

  // ========== Manual Handlers ==========

  const handleValidateClaude = useCallback(async () => {
    setClaudeError('');
    setConnection((prev) => ({ ...prev, claude: 'validating' }));

    const result = await validateClaudeOnly(claudeKey);

    if (result.valid) {
      setConnection((prev) => ({ ...prev, claude: 'connected' }));
      showToast('Claude API key is valid', 'success');
    } else {
      setConnection((prev) => ({ ...prev, claude: 'error' }));
      setClaudeError(result.error ?? 'Validation failed');
      showToast(result.error ?? 'Invalid Claude API key', 'error');
    }
  }, [claudeKey]);

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
      claudeApiKey: claudeKey,
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
  }, [claudeKey, githubToken, selectedRepo, branch, filePath, syncConfig, onConnected]);

  const bothConnected =
    connection.claude === 'connected' && connection.github === 'connected';

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
          Connect Your Services
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Choose how to connect — use Claude Bridge web or enter keys manually.
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-xl)' }}>
        <button style={tabStyle('bridge')} onClick={() => setAuthTab('bridge')}>
          Claude Bridge
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
                  Get your token at claude-bridge.vercel.app/dashboard/plugin-token
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
                Connected to Claude Bridge
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
                  No projects found. Create one at claude-bridge.vercel.app/dashboard
                </p>
              )}

              <button
                class="btn btn-secondary"
                style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                onClick={() => {
                  sendToCode({ type: 'CLEAR_BRIDGE_TOKEN' });
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
          {/* Claude API Key */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
              <span style={{ fontWeight: 600 }}>Claude API</span>
              <StatusBadge status={connection.claude} label="Claude" />
            </div>
            <div class="form-group">
              <label class="form-label">API Key</label>
              <input
                class={`form-input ${claudeError ? 'error' : ''}`}
                type="password"
                placeholder="sk-ant-..."
                value={claudeKey}
                onInput={(e) => setClaudeKey((e.target as HTMLInputElement).value)}
              />
              {claudeError && <span class="form-error">{claudeError}</span>}
              <span class="form-hint">Get your key from console.anthropic.com</span>
            </div>
            <button
              class="btn btn-secondary"
              onClick={handleValidateClaude}
              disabled={!claudeKey || connection.claude === 'validating'}
            >
              {connection.claude === 'validating' ? 'Validating...' : 'Validate Key'}
            </button>
          </div>

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
                placeholder="ghp_..."
                value={githubToken}
                onInput={(e) => setGitHubToken((e.target as HTMLInputElement).value)}
              />
              {githubError && <span class="form-error">{githubError}</span>}
              <span class="form-hint">Needs repo read/write scope</span>
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
            disabled={!bothConnected}
          >
            Save & Connect
          </button>
        </div>
      )}
    </div>
  );
}
