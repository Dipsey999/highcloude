import { logger } from '../utils/logger';
import { githubFetch } from './github-fetch';

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubValidationResult {
  valid: boolean;
  username?: string;
  error?: string;
}

export interface GitHubRepo {
  full_name: string;
  default_branch: string;
  private: boolean;
}

/** Validate a GitHub Personal Access Token by fetching the user profile. */
export async function validateGitHubToken(
  token: string
): Promise<GitHubValidationResult> {
  if (!token || token.length < 10) {
    return { valid: false, error: 'Invalid token format' };
  }

  try {
    const response = await githubFetch(`${GITHUB_API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const data = (await response.json()) as { login: string };
      logger.info(`GitHub token validated for user: ${data.login}`);
      return { valid: true, username: data.login };
    }

    if (response.status === 401) {
      return { valid: false, error: 'Invalid token' };
    }

    return {
      valid: false,
      error: `GitHub API error (${response.status})`,
    };
  } catch (err) {
    logger.error('GitHub API validation failed:', err);
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/** Fetch repositories accessible with the given token, sorted by most recently pushed. */
export async function fetchUserRepos(
  token: string,
  page: number = 1,
  perPage: number = 30
): Promise<GitHubRepo[]> {
  const response = await githubFetch(
    `${GITHUB_API_BASE}/user/repos?sort=pushed&per_page=${perPage}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.status}`);
  }

  const repos = (await response.json()) as Array<{
    full_name: string;
    default_branch: string;
    private: boolean;
  }>;

  return repos.map((r) => ({
    full_name: r.full_name,
    default_branch: r.default_branch,
    private: r.private,
  }));
}

// ========================================
// Repository Access Check
// ========================================

export interface RepoAccessResult {
  canRead: boolean;
  canPush: boolean;
  repoExists: boolean;
  error?: string;
}

/**
 * Check if the token has read/write access to a repository.
 * Uses GET /repos/{owner}/{repo} which returns `permissions` object.
 */
export async function checkRepoAccess(
  token: string,
  owner: string,
  repo: string,
): Promise<RepoAccessResult> {
  try {
    const response = await githubFetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 404) {
      return { canRead: false, canPush: false, repoExists: false, error: `Repository "${owner}/${repo}" not found or not accessible with this token.` };
    }

    if (response.status === 403) {
      return { canRead: false, canPush: false, repoExists: true, error: 'Token does not have access to this repository. Check token permissions.' };
    }

    if (!response.ok) {
      return { canRead: false, canPush: false, repoExists: false, error: `GitHub API error: ${response.status}` };
    }

    const data = (await response.json()) as { permissions?: { push?: boolean; pull?: boolean; admin?: boolean } };
    const perms = data.permissions;

    return {
      canRead: perms?.pull ?? false,
      canPush: perms?.push ?? false,
      repoExists: true,
    };
  } catch (err) {
    return { canRead: false, canPush: false, repoExists: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ========================================
// File Read/Write Operations
// ========================================

export interface GitHubFileContent {
  content: string;
  sha: string;
  name: string;
  path: string;
}

/**
 * Read a file from a GitHub repository.
 * Returns decoded content and SHA (needed for updates), or null if 404.
 */
export async function readFileFromRepo(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<{ content: string; sha: string } | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;

  const response = await githubFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (response.status === 404) {
    logger.info(`File not found: ${path} on ${branch}`);
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.status}`);
  }

  const data = (await response.json()) as GitHubFileContent;
  const decoded = atob(data.content.replace(/\n/g, ''));

  return {
    content: decoded,
    sha: data.sha,
  };
}

/**
 * Write (create or update) a file in a GitHub repository.
 * Provide `sha` to update an existing file; omit to create new.
 */
export async function writeFileToRepo(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
  content: string,
  sha: string | undefined,
  message: string,
): Promise<{ sha: string }> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  // Base64 encode with UTF-8 support
  const encoded = btoa(unescape(encodeURIComponent(content)));

  const body: Record<string, string> = {
    message,
    content: encoded,
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await githubFetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = (errorBody as { message?: string }).message ?? `HTTP ${response.status}`;

    // Provide helpful guidance for common permission errors
    if (response.status === 403 || errorMessage.includes('Resource not accessible')) {
      throw new Error(
        `GitHub token lacks write permission. Go to your dashboard API Keys, ` +
        `ensure your token has "Contents: Read and write" permission for this repository, ` +
        `then reconnect the plugin.`
      );
    }

    throw new Error(`Failed to write file: ${errorMessage}`);
  }

  const result = (await response.json()) as { content: { sha: string } };
  logger.info(`File written to GitHub: ${path}`);
  return { sha: result.content.sha };
}
