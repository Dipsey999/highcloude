import { logger } from '../utils/logger';
import { githubFetch } from './github-fetch';
import type { GitHubPRInfo } from '../types/messages';

const GITHUB_API_BASE = 'https://api.github.com';

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

// ========================================
// Branch Operations
// ========================================

/**
 * Get the SHA of the latest commit on a branch.
 */
export async function getBranchSha(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`;
  const response = await githubFetch(url, { headers: headers(token) });

  if (!response.ok) {
    throw new Error(`Failed to get branch SHA for ${branch}: ${response.status}`);
  }

  const data = (await response.json()) as { object: { sha: string } };
  return data.object.sha;
}

/**
 * Create a new branch from a base SHA.
 */
export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  branchName: string,
  baseSha: string,
): Promise<void> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`;
  const response = await githubFetch(url, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Failed to create branch ${branchName}: ${errorBody.message ?? response.status}`);
  }

  logger.info(`Branch created: ${branchName}`);
}

// ========================================
// Atomic Multi-File Commit
// ========================================

interface FileToCommit {
  path: string;
  content: string;
}

/**
 * Commit multiple files atomically using the Git Data API.
 * Steps: create blobs → create tree → create commit → update ref.
 */
export async function commitMultipleFiles(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  files: FileToCommit[],
  message: string,
): Promise<{ commitSha: string }> {
  // 1. Get the current commit SHA for this branch
  const branchSha = await getBranchSha(token, owner, repo, branch);

  // 2. Get the tree SHA of the current commit
  const commitUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits/${branchSha}`;
  const commitResp = await githubFetch(commitUrl, { headers: headers(token) });
  if (!commitResp.ok) throw new Error(`Failed to get commit: ${commitResp.status}`);
  const commitData = (await commitResp.json()) as { tree: { sha: string } };
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blobs for each file
  const treeEntries: Array<{
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string;
  }> = [];

  for (const file of files) {
    const blobUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/blobs`;
    const blobResp = await githubFetch(blobUrl, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        content: file.content,
        encoding: 'utf-8',
      }),
    });

    if (!blobResp.ok) throw new Error(`Failed to create blob for ${file.path}: ${blobResp.status}`);
    const blobData = (await blobResp.json()) as { sha: string };

    treeEntries.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    });
  }

  // 4. Create a new tree with all the file entries
  const treeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`;
  const treeResp = await githubFetch(treeUrl, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeEntries,
    }),
  });

  if (!treeResp.ok) throw new Error(`Failed to create tree: ${treeResp.status}`);
  const treeData = (await treeResp.json()) as { sha: string };

  // 5. Create a new commit pointing to the new tree
  const newCommitUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`;
  const newCommitResp = await githubFetch(newCommitUrl, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [branchSha],
    }),
  });

  if (!newCommitResp.ok) throw new Error(`Failed to create commit: ${newCommitResp.status}`);
  const newCommitData = (await newCommitResp.json()) as { sha: string };

  // 6. Update the branch ref to point to the new commit
  const refUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`;
  const refResp = await githubFetch(refUrl, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({
      sha: newCommitData.sha,
    }),
  });

  if (!refResp.ok) throw new Error(`Failed to update ref: ${refResp.status}`);

  logger.info(`Atomic commit ${newCommitData.sha} with ${files.length} files on ${branch}`);
  return { commitSha: newCommitData.sha };
}

// ========================================
// Pull Requests
// ========================================

/**
 * Create a pull request.
 */
export async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string,
): Promise<{ number: number; htmlUrl: string }> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`;
  const response = await githubFetch(url, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ title, body, head, base }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Failed to create PR: ${errorBody.message ?? response.status}`);
  }

  const data = (await response.json()) as { number: number; html_url: string };
  logger.info(`PR #${data.number} created: ${data.html_url}`);
  return { number: data.number, htmlUrl: data.html_url };
}

/**
 * List open pull requests, optionally filtering by head branch prefix.
 */
export async function listPullRequests(
  token: string,
  owner: string,
  repo: string,
  headPrefix?: string,
): Promise<GitHubPRInfo[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=open&per_page=30`;
  const response = await githubFetch(url, { headers: headers(token) });

  if (!response.ok) {
    throw new Error(`Failed to list PRs: ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    number: number;
    title: string;
    html_url: string;
    head: { ref: string };
    created_at: string;
    mergeable: boolean | null;
    user: { login: string };
  }>;

  let prs: GitHubPRInfo[] = data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    htmlUrl: pr.html_url,
    headBranch: pr.head.ref,
    createdAt: pr.created_at,
    mergeable: pr.mergeable,
    user: pr.user.login,
  }));

  if (headPrefix) {
    prs = prs.filter((pr) => pr.headBranch.startsWith(headPrefix));
  }

  return prs;
}

/**
 * Merge a pull request.
 */
export async function mergePullRequest(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number,
  mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash',
): Promise<{ sha: string; merged: boolean }> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}/merge`;
  const response = await githubFetch(url, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ merge_method: mergeMethod }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Failed to merge PR #${pullNumber}: ${errorBody.message ?? response.status}`);
  }

  const data = (await response.json()) as { sha: string; merged: boolean };
  logger.info(`PR #${pullNumber} merged: ${data.merged}`);
  return { sha: data.sha, merged: data.merged };
}

// ========================================
// File Commit Info
// ========================================

/**
 * Get the latest commit info for a specific file.
 */
export async function getFileCommitInfo(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
): Promise<{ sha: string; author: string; date: string } | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?path=${encodeURIComponent(filePath)}&sha=${encodeURIComponent(branch)}&per_page=1`;
  const response = await githubFetch(url, { headers: headers(token) });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to get file commit info: ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    sha: string;
    commit: { author: { name: string; date: string } };
  }>;

  if (data.length === 0) return null;

  return {
    sha: data[0].sha,
    author: data[0].commit.author.name,
    date: data[0].commit.author.date,
  };
}
