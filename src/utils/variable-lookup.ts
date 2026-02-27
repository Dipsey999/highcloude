import { logger } from './logger';

/**
 * Build a lookup map of all local variables by their path-style name.
 * e.g. "color/primary" → Variable
 */
export async function buildVariableLookup(): Promise<Map<string, Variable>> {
  const lookup = new Map<string, Variable>();

  try {
    const variables = await figma.variables.getLocalVariablesAsync();
    for (const v of variables) {
      lookup.set(v.name, v);
    }
    logger.info(`Built variable lookup with ${lookup.size} entries`);
  } catch (err) {
    logger.warn('Failed to build variable lookup:', err);
  }

  return lookup;
}

/**
 * Build a reverse lookup: variableId → variable name.
 * Useful for detecting which variable is bound to a node property.
 */
export async function buildReverseVariableMap(): Promise<Map<string, string>> {
  const reverseMap = new Map<string, string>();

  try {
    const variables = await figma.variables.getLocalVariablesAsync();
    for (const v of variables) {
      reverseMap.set(v.id, v.name);
    }
  } catch (err) {
    logger.warn('Failed to build reverse variable map:', err);
  }

  return reverseMap;
}

/**
 * Get all local variables with their collection name and resolved default value.
 * Used by the auto-mapper to build matching datasets.
 */
export async function getAllLocalVariablesWithMeta(): Promise<Array<{
  variable: Variable;
  collectionName: string;
  defaultValue: VariableValue | null;
}>> {
  const results: Array<{
    variable: Variable;
    collectionName: string;
    defaultValue: VariableValue | null;
  }> = [];

  try {
    const variables = await figma.variables.getLocalVariablesAsync();
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const collectionMap = new Map<string, string>();
    for (const c of collections) {
      collectionMap.set(c.id, c.name);
    }

    for (const v of variables) {
      const collectionName = collectionMap.get(v.variableCollectionId) ?? 'Unknown';
      // Get the default mode value
      const collection = collections.find(c => c.id === v.variableCollectionId);
      let defaultValue: VariableValue | null = null;
      if (collection) {
        try {
          const modeValues = v.valuesByMode as unknown as Record<string, VariableValue>;
          const modeValue = modeValues[collection.defaultModeId];
          if (modeValue !== undefined) {
            defaultValue = modeValue;
          }
        } catch (_e) {
          // Some variables may not have a value for the default mode
        }
      }
      results.push({ variable: v, collectionName, defaultValue });
    }
  } catch (err) {
    logger.warn('Failed to get variables with meta:', err);
  }

  return results;
}
