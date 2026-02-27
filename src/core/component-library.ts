/**
 * Component Pattern Library — stores reusable design patterns in Figma client storage.
 * Patterns are exported selections that Claude can reference when generating designs.
 */

import { logger } from '../utils/logger';
import type {
  ComponentPattern,
  ComponentPatternInput,
  ExportedNode,
} from '../types/messages';

const STORAGE_KEY = 'component-patterns';

/**
 * Load all saved component patterns from client storage.
 */
export async function loadPatterns(): Promise<ComponentPattern[]> {
  try {
    const data = await figma.clientStorage.getAsync(STORAGE_KEY);
    if (Array.isArray(data)) {
      return data as ComponentPattern[];
    }
    return [];
  } catch (err) {
    logger.error('Failed to load component patterns:', err);
    return [];
  }
}

/**
 * Save a new component pattern to client storage.
 */
export async function savePattern(
  input: ComponentPatternInput,
  spec: ExportedNode,
): Promise<ComponentPattern> {
  const patterns = await loadPatterns();

  // Collect token references used in the spec
  const tokensUsed = collectTokenRefs(spec);

  const pattern: ComponentPattern = {
    id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    category: input.category,
    tags: input.tags,
    description: input.description,
    spec,
    tokensUsed,
    dimensions: { width: spec.width, height: spec.height },
    createdAt: new Date().toISOString(),
  };

  patterns.push(pattern);
  await figma.clientStorage.setAsync(STORAGE_KEY, patterns);
  logger.info(`Saved component pattern: ${pattern.name}`);
  return pattern;
}

/**
 * Delete a component pattern by ID.
 */
export async function deletePattern(patternId: string): Promise<boolean> {
  const patterns = await loadPatterns();
  const filtered = patterns.filter((p) => p.id !== patternId);

  if (filtered.length === patterns.length) {
    return false; // Not found
  }

  await figma.clientStorage.setAsync(STORAGE_KEY, filtered);
  logger.info(`Deleted component pattern: ${patternId}`);
  return true;
}

/**
 * Collect all token references ($token.path) from a spec tree.
 */
function collectTokenRefs(node: ExportedNode): string[] {
  const refs = new Set<string>();

  function walk(n: ExportedNode): void {
    if (n.fill?.startsWith('$')) refs.add(n.fill);
    if (n.stroke?.startsWith('$')) refs.add(n.stroke);
    if (n.boundVariables) {
      for (const varName of Object.values(n.boundVariables)) {
        refs.add(`$${varName}`);
      }
    }
    if (n.children) {
      for (const child of n.children) {
        walk(child);
      }
    }
  }

  walk(node);
  return Array.from(refs);
}
