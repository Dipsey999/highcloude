/**
 * Normalize a GitHub repo string into "owner/repo" format.
 *
 * Handles all common formats users might enter:
 *   - "owner/repo"
 *   - "owner/repo.git"
 *   - "https://github.com/owner/repo"
 *   - "https://github.com/owner/repo.git"
 *   - "http://github.com/owner/repo"
 *   - "github.com/owner/repo"
 */
export function normalizeGithubRepo(input: string): string {
  let cleaned = input.trim();

  // Remove trailing .git
  if (cleaned.endsWith('.git')) {
    cleaned = cleaned.slice(0, -4);
  }

  // Remove trailing slash
  while (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }

  // If it looks like a full URL, extract owner/repo from the path
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const url = new URL(cleaned);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
    } catch {
      // Not a valid URL, continue
    }
  }

  // Handle github.com/ prefix without protocol
  if (cleaned.startsWith('github.com/')) {
    cleaned = cleaned.slice('github.com/'.length);
  }

  // At this point it should be "owner/repo" — extract first two segments
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }

  // Return as-is if we can't parse it (caller will get an error from GitHub API)
  return cleaned;
}
