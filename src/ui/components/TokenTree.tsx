import { useState, useCallback, useMemo } from 'preact/hooks';
import type { DesignTokensDocument, DTCGToken, DTCGGroup } from '../../types/messages';
import { TokenTreeNode, TokenTreeGroup } from './TokenTreeNode';

interface TokenTreeProps {
  document: DesignTokensDocument;
  searchQuery: string;
  activeModeId?: string;
  usageCounts: Map<string, number>;
  onRequestUsage: (variableId: string) => void;
}

export function TokenTree({
  document,
  searchQuery,
  activeModeId,
  usageCounts,
  onRequestUsage,
}: TokenTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>();
    function collectPaths(node: unknown, path: string) {
      if (!node || typeof node !== 'object') return;
      const obj = node as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (key === 'metadata' || key.startsWith('$')) continue;
        const child = obj[key];
        if (child && typeof child === 'object' && !('$type' in (child as Record<string, unknown>))) {
          const childPath = path ? `${path}.${key}` : key;
          allPaths.add(childPath);
          collectPaths(child, childPath);
        }
      }
    }
    collectPaths(document, '');
    setExpandedPaths(allPaths);
  }, [document]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  // Filter tokens by search query
  const queryLower = searchQuery.toLowerCase();

  return (
    <div class="token-tree">
      <div class="token-tree-controls">
        <button class="btn-filter" onClick={expandAll}>Expand All</button>
        <button class="btn-filter" onClick={collapseAll}>Collapse All</button>
      </div>
      <div class="token-tree-body">
        {renderNode(document, '', expandedPaths, togglePath, queryLower, activeModeId, usageCounts, onRequestUsage)}
      </div>
    </div>
  );
}

function renderNode(
  node: unknown,
  path: string,
  expandedPaths: Set<string>,
  togglePath: (path: string) => void,
  query: string,
  activeModeId: string | undefined,
  usageCounts: Map<string, number>,
  onRequestUsage: (variableId: string) => void,
): preact.ComponentChildren {
  if (!node || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;

  const entries: preact.ComponentChildren[] = [];

  for (const key of Object.keys(obj)) {
    if (key === 'metadata' || key.startsWith('$')) continue;
    const child = obj[key] as DTCGToken | DTCGGroup;
    const childPath = path ? `${path}.${key}` : key;

    if (!child || typeof child !== 'object') continue;

    // Check if it's a leaf token ($type + $value)
    if ('$type' in child && '$value' in child) {
      const token = child as DTCGToken;
      // Filter by search query
      if (query && !childPath.toLowerCase().includes(query) && !String(token.$value).toLowerCase().includes(query)) {
        continue;
      }

      const variableId = token.$extensions?.figma?.variableId;
      const usage = variableId ? usageCounts.get(variableId) : undefined;

      entries.push(
        <TokenTreeNode
          key={childPath}
          name={key}
          path={childPath}
          token={token}
          activeModeId={activeModeId}
          usageCount={usage}
          onRequestUsage={onRequestUsage}
        />,
      );
    } else {
      // It's a group
      const childCount = countTokensInGroup(child);

      // Check if any descendant matches the query
      if (query && !groupMatchesQuery(child, childPath, query)) {
        continue;
      }

      const isExpanded = expandedPaths.has(childPath) || !!query;

      entries.push(
        <TokenTreeGroup
          key={childPath}
          name={key}
          expanded={isExpanded}
          onToggle={() => togglePath(childPath)}
          childCount={childCount}
        >
          {renderNode(child, childPath, expandedPaths, togglePath, query, activeModeId, usageCounts, onRequestUsage)}
        </TokenTreeGroup>,
      );
    }
  }

  return entries;
}

function countTokensInGroup(node: unknown): number {
  if (!node || typeof node !== 'object') return 0;
  const obj = node as Record<string, unknown>;
  let count = 0;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) continue;
    const child = obj[key];
    if (child && typeof child === 'object') {
      if ('$type' in (child as Record<string, unknown>)) {
        count++;
      } else {
        count += countTokensInGroup(child);
      }
    }
  }
  return count;
}

function groupMatchesQuery(node: unknown, path: string, query: string): boolean {
  if (!node || typeof node !== 'object') return false;
  const obj = node as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) continue;
    const child = obj[key];
    const childPath = `${path}.${key}`;

    if (child && typeof child === 'object') {
      if ('$type' in (child as Record<string, unknown>)) {
        const token = child as DTCGToken;
        if (childPath.toLowerCase().includes(query) || String(token.$value).toLowerCase().includes(query)) {
          return true;
        }
      } else {
        if (groupMatchesQuery(child, childPath, query)) return true;
      }
    }
  }
  return false;
}
