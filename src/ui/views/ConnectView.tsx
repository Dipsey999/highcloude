import { useState, useCallback } from 'preact/hooks';
import type { ConnectionState, CredentialPayload } from '../../types/messages';
import { validateClaudeOnly, validateGitHubOnly } from '../../api/auth-manager';
import { fetchUserRepos, type GitHubRepo } from '../../api/github-client';
import { sendToCode } from '../../utils/message-bus';
import { StatusBadge } from '../components/StatusBadge';
import { showToast } from '../components/Toast';

interface ConnectViewProps {
  onConnected: () => void;
  initialCredentials?: CredentialPayload | null;
}

export function ConnectView({ onConnected, initialCredentials }: ConnectViewProps) {
  const [claudeKey, setClaudeKey] = useState(initialCredentials?.claudeApiKey ?? '');
  const [githubToken, setGitHubToken] = useState(initialCredentials?.githubToken ?? '');
  const [selectedRepo, setSelectedRepo] = useState(initialCredentials?.githubRepo ?? '');
  const [branch, setBranch] = useState(initialCredentials?.githubBranch ?? 'main');
  const [filePath, setFilePath] = useState(initialCredentials?.githubFilePath ?? 'tokens.json');

  const [connection, setConnection] = useState<ConnectionState>({
    claude: initialCredentials?.claudeApiKey ? 'connected' : 'disconnected',
    github: initialCredentials?.githubToken ? 'connected' : 'disconnected',
  });

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [claudeError, setClaudeError] = useState('');
  const [githubError, setGitHubError] = useState('');

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

  const handleConnect = useCallback(() => {
    const credentials: CredentialPayload = {
      claudeApiKey: claudeKey,
      githubToken: githubToken,
      githubRepo: selectedRepo,
      githubBranch: branch,
      githubFilePath: filePath,
    };

    sendToCode({ type: 'SAVE_CREDENTIALS', payload: credentials });
    showToast('Credentials saved', 'success');
    onConnected();
  }, [claudeKey, githubToken, selectedRepo, branch, filePath, onConnected]);

  const bothConnected =
    connection.claude === 'connected' && connection.github === 'connected';

  return (
    <div class="plugin-body">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
          Connect Your Services
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Enter your API credentials to connect Claude and GitHub.
        </p>
      </div>

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
  );
}
