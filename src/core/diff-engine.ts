import type {
  DesignTokensDocument,
  DTCGToken,
  TokenDiffEntry,
  TokenDiffResult,
  DiffSummary,
  DiffChangeType,
} from '../types/messages';

/**
 * Compare local (Figma-extracted) tokens against remote (GitHub) tokens.
 * Returns a list of diff entries and a summary.
 */
export function diffTokenDocuments(
  local: DesignTokensDocument,
  remote: DesignTokensDocument,
): TokenDiffResult {
  const localMap = flattenTokens(local);
  const remoteMap = flattenTokens(remote);

  const allPaths = new Set([...localMap.keys(), ...remoteMap.keys()]);
  const entries: TokenDiffEntry[] = [];

  for (const path of allPaths) {
    const localToken = localMap.get(path);
    const remoteToken = remoteMap.get(path);

    let changeType: DiffChangeType;

    if (localToken && !remoteToken) {
      changeType = 'added';
    } else if (!localToken && remoteToken) {
      changeType = 'removed';
    } else if (localToken && remoteToken) {
      changeType = tokensEqual(localToken, remoteToken) ? 'unchanged' : 'modified';
    } else {
      continue;
    }

    entries.push({ path, changeType, localToken, remoteToken });
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));

  const summary = computeDiffSummary(entries);

  return { entries, summary };
}

/**
 * Flatten a DesignTokensDocument into a Map<path, DTCGToken>.
 * Walks the nested object structure, building "/" paths.
 */
function flattenTokens(doc: DesignTokensDocument): Map<string, DTCGToken> {
  const result = new Map<string, DTCGToken>();

  function walk(node: unknown, prefix: string): void {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;

    if (isToken(obj)) {
      result.set(prefix, {
        $type: obj.$type as DTCGToken['$type'],
        $value: obj.$value as DTCGToken['$value'],
        $description: obj.$description as DTCGToken['$description'],
        $extensions: obj.$extensions as DTCGToken['$extensions'],
      });
      return;
    }

    for (const key of Object.keys(obj)) {
      if (key === 'metadata') continue;
      const childPath = prefix ? `${prefix}/${key}` : key;
      walk(obj[key], childPath);
    }
  }

  walk(doc, '');
  return result;
}

/**
 * Type guard: a node is a token if it has both $type and $value.
 */
function isToken(obj: Record<string, unknown>): boolean {
  return '$type' in obj && '$value' in obj;
}

/**
 * Compare two tokens for equality.
 * Compares $type and $value only (not $description or $extensions).
 */
function tokensEqual(a: DTCGToken, b: DTCGToken): boolean {
  if (a.$type !== b.$type) return false;
  return JSON.stringify(a.$value) === JSON.stringify(b.$value);
}

function computeDiffSummary(entries: TokenDiffEntry[]): DiffSummary {
  const summary: DiffSummary = { added: 0, removed: 0, modified: 0, unchanged: 0, total: 0 };
  for (const entry of entries) {
    summary[entry.changeType]++;
    summary.total++;
  }
  return summary;
}

/**
 * Format a DTCGToken value as a display string.
 * Used by the DiffViewer to render old/new values.
 */
export function formatTokenValue(token: DTCGToken): string {
  const value = token.$value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}
