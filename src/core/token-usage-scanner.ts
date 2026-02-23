import { logger } from '../utils/logger';

/**
 * Scan all pages for nodes that use a specific variable.
 * Returns usage count and node names.
 */
export async function scanTokenUsage(
  variableId: string,
): Promise<{ count: number; nodeNames: string[] }> {
  const nodeNames: string[] = [];
  const MAX_NAMES = 20; // Only return first 20 names to avoid huge payloads
  let count = 0;

  try {
    const pages = figma.root.children;

    for (const page of pages) {
      const nodes = page.findAll(() => true);

      for (const node of nodes) {
        if (nodeUsesVariable(node, variableId)) {
          count++;
          if (nodeNames.length < MAX_NAMES) {
            nodeNames.push(`${page.name} / ${node.name}`);
          }
        }
      }
    }
  } catch (err) {
    logger.error('Token usage scan failed:', err);
  }

  return { count, nodeNames };
}

/**
 * Check if a node uses a specific variable via boundVariables.
 */
function nodeUsesVariable(node: SceneNode, variableId: string): boolean {
  try {
    if (!('boundVariables' in node)) return false;

    const boundVars = (node as SceneNode & { boundVariables?: Record<string, unknown> }).boundVariables;
    if (!boundVars) return false;

    for (const key of Object.keys(boundVars)) {
      const binding = boundVars[key];

      // Single binding (e.g., cornerRadius, opacity)
      if (isVariableAlias(binding) && binding.id === variableId) {
        return true;
      }

      // Array of bindings (e.g., fills, strokes)
      if (Array.isArray(binding)) {
        for (const item of binding) {
          if (isVariableAlias(item) && item.id === variableId) {
            return true;
          }
        }
      }
    }
  } catch {
    // Some node types may not support boundVariables
  }

  return false;
}

/**
 * Type guard for VariableAlias-like objects.
 */
function isVariableAlias(value: unknown): value is { type: 'VARIABLE_ALIAS'; id: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type: string }).type === 'VARIABLE_ALIAS' &&
    'id' in value &&
    typeof (value as { id: unknown }).id === 'string'
  );
}
