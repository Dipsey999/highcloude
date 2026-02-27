import { useState, useCallback, useEffect } from 'preact/hooks';
import type { CredentialPayload, GitHubPRInfo } from '../../types/messages';
import { listPullRequests, mergePullRequest } from '../../api/github-git-api';
import { normalizeGithubRepo } from '../../utils/parse-repo';
import { showToast } from './Toast';

interface PRListPanelProps {
  credentials: CredentialPayload;
}

export function PRListPanel({ credentials }: PRListPanelProps) {
  const [prs, setPrs] = useState<GitHubPRInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState<number | null>(null);

  const loadPRs = useCallback(async () => {
    if (!credentials.githubRepo) return;

    setLoading(true);
    try {
      const normalized = normalizeGithubRepo(credentials.githubRepo);
      const [owner, repo] = normalized.split('/');
      const results = await listPullRequests(
        credentials.githubToken, owner, repo, 'claude-bridge/',
      );
      setPrs(results);
    } catch (err) {
      showToast(`Failed to load PRs: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  useEffect(() => {
    loadPRs();
  }, [loadPRs]);

  const handleMerge = useCallback(async (prNumber: number) => {
    if (!credentials.githubRepo) return;

    setMerging(prNumber);
    try {
      const normalized = normalizeGithubRepo(credentials.githubRepo);
      const [owner, repo] = normalized.split('/');
      const result = await mergePullRequest(
        credentials.githubToken, owner, repo, prNumber,
      );

      if (result.merged) {
        showToast(`PR #${prNumber} merged successfully`, 'success');
        // Refresh the list
        await loadPRs();
      } else {
        showToast(`PR #${prNumber} could not be merged`, 'error');
      }
    } catch (err) {
      showToast(`Merge failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setMerging(null);
    }
  }, [credentials, loadPRs]);

  if (loading) {
    return (
      <div class="pr-list-panel">
        <div class="pr-list-header">
          <h3>Open Pull Requests</h3>
        </div>
        <div class="pr-list-loading">Loading...</div>
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div class="pr-list-panel">
        <div class="pr-list-header">
          <h3>Open Pull Requests</h3>
          <button class="btn-filter" onClick={loadPRs}>Refresh</button>
        </div>
        <div class="pr-list-empty">No open Claude Bridge PRs</div>
      </div>
    );
  }

  return (
    <div class="pr-list-panel">
      <div class="pr-list-header">
        <h3>Open Pull Requests</h3>
        <button class="btn-filter" onClick={loadPRs}>Refresh</button>
      </div>
      <div class="pr-list-items">
        {prs.map((pr) => (
          <div key={pr.number} class="pr-list-item">
            <div class="pr-list-item-info">
              <span class="pr-list-item-title">#{pr.number} {pr.title}</span>
              <span class="pr-list-item-meta">
                {pr.headBranch} &middot; by {pr.user} &middot; {new Date(pr.createdAt).toLocaleDateString()}
              </span>
            </div>
            <button
              class="btn btn-primary btn-sm"
              onClick={() => handleMerge(pr.number)}
              disabled={merging !== null}
            >
              {merging === pr.number ? 'Merging...' : 'Merge'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
