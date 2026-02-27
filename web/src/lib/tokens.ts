/**
 * Token utility functions for parsing, flattening, and summarizing DTCG token documents.
 */

export type DTCGTokenType = 'color' | 'dimension' | 'string' | 'boolean' | 'typography' | 'shadow';

export interface DTCGToken {
  $type: DTCGTokenType;
  $value: unknown;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

export interface FlatToken {
  path: string;
  group: string;
  name: string;
  type: DTCGTokenType;
  value: unknown;
  description?: string;
  extensions?: Record<string, unknown>;
}

export interface TokenSummary {
  total: number;
  byType: Record<string, number>;
  groups: string[];
}

function isToken(obj: unknown): obj is DTCGToken {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '$type' in obj &&
    '$value' in obj
  );
}

/**
 * Flatten a nested DTCG token document into a flat array of tokens with paths.
 */
export function flattenTokenDocument(doc: Record<string, unknown>): FlatToken[] {
  const tokens: FlatToken[] = [];

  function walk(obj: Record<string, unknown>, path: string[]) {
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'metadata' || key.startsWith('$')) continue;

      if (isToken(value)) {
        const fullPath = [...path, key].join('.');
        const group = path.length > 0 ? path.join('.') : '(root)';
        tokens.push({
          path: fullPath,
          group,
          name: key,
          type: value.$type,
          value: value.$value,
          description: value.$description,
          extensions: value.$extensions,
        });
      } else if (typeof value === 'object' && value !== null) {
        walk(value as Record<string, unknown>, [...path, key]);
      }
    }
  }

  walk(doc, []);
  return tokens;
}

/**
 * Compute summary stats from a flat token list.
 */
export function computeTokenSummary(tokens: FlatToken[]): TokenSummary {
  const byType: Record<string, number> = {};
  const groupSet = new Set<string>();

  for (const t of tokens) {
    byType[t.type] = (byType[t.type] || 0) + 1;
    groupSet.add(t.group);
  }

  return {
    total: tokens.length,
    byType,
    groups: Array.from(groupSet).sort(),
  };
}

/**
 * Format a token value for display.
 */
export function formatTokenValue(type: DTCGTokenType, value: unknown): string {
  if (value === null || value === undefined) return '—';

  switch (type) {
    case 'color':
      return String(value);
    case 'dimension':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'string':
      return String(value);
    case 'typography': {
      const t = value as Record<string, unknown>;
      return `${t.fontFamily} ${t.fontWeight} ${t.fontSize}`;
    }
    case 'shadow': {
      const s = value as Record<string, unknown>;
      return `${s.offsetX} ${s.offsetY} ${s.blur} ${s.color}`;
    }
    default:
      return JSON.stringify(value);
  }
}
