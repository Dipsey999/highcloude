import { logger } from '../utils/logger';

/**
 * Update a variable's value for a specific mode.
 * Parses the newValue based on the variable's resolvedType.
 */
export async function updateTokenValue(
  variableId: string,
  modeId: string,
  newValue: string | number | boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) {
      return { success: false, error: `Variable not found: ${variableId}` };
    }

    let parsedValue: VariableValue;

    switch (variable.resolvedType) {
      case 'COLOR': {
        // Expect hex string like "#FF0000" or "#FF0000FF"
        if (typeof newValue !== 'string') {
          return { success: false, error: 'Color values must be hex strings' };
        }
        const rgba = hexToRgba(newValue);
        if (!rgba) {
          return { success: false, error: `Invalid hex color: ${newValue}` };
        }
        parsedValue = rgba;
        break;
      }
      case 'FLOAT': {
        const num = typeof newValue === 'number' ? newValue : parseFloat(String(newValue));
        if (isNaN(num)) {
          return { success: false, error: `Invalid number: ${newValue}` };
        }
        parsedValue = num;
        break;
      }
      case 'STRING': {
        parsedValue = String(newValue);
        break;
      }
      case 'BOOLEAN': {
        if (typeof newValue === 'boolean') {
          parsedValue = newValue;
        } else if (typeof newValue === 'string') {
          parsedValue = newValue.toLowerCase() === 'true';
        } else {
          parsedValue = Boolean(newValue);
        }
        break;
      }
      default:
        return { success: false, error: `Unsupported variable type: ${variable.resolvedType}` };
    }

    variable.setValueForMode(modeId, parsedValue);
    logger.info(`Updated variable "${variable.name}" mode ${modeId} to`, newValue);
    return { success: true };
  } catch (err) {
    const msg = `Failed to update variable: ${err instanceof Error ? err.message : 'Unknown error'}`;
    logger.error(msg);
    return { success: false, error: msg };
  }
}

/**
 * Get all modes for a variable collection.
 */
export async function getVariableModes(
  collectionId: string,
): Promise<Array<{ modeId: string; modeName: string }>> {
  try {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) return [];

    return collection.modes.map((mode) => ({
      modeId: mode.modeId,
      modeName: mode.name,
    }));
  } catch (err) {
    logger.error('Failed to get variable modes:', err);
    return [];
  }
}

/**
 * Parse hex color string to RGBA object.
 */
function hexToRgba(hex: string): RGBA | null {
  const cleaned = hex.replace('#', '');
  let r: number, g: number, b: number, a = 1;

  if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16) / 255;
    g = parseInt(cleaned.slice(2, 4), 16) / 255;
    b = parseInt(cleaned.slice(4, 6), 16) / 255;
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16) / 255;
    g = parseInt(cleaned.slice(2, 4), 16) / 255;
    b = parseInt(cleaned.slice(4, 6), 16) / 255;
    a = parseInt(cleaned.slice(6, 8), 16) / 255;
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;
  return { r, g, b, a };
}
