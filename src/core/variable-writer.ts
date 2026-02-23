import { sendToUI } from '../utils/message-bus';
import { logger } from '../utils/logger';
import type { VariableUpdateInstruction, ApplyTokensResult } from '../types/messages';

/**
 * Apply a set of variable update instructions to Figma.
 * Only updates existing variables; does not create new ones.
 */
export async function applyVariableUpdates(
  instructions: VariableUpdateInstruction[],
): Promise<ApplyTokensResult> {
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  const total = instructions.length;

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    sendToUI({
      type: 'APPLY_PROGRESS',
      stage: `Updating ${inst.tokenPath}...`,
      percent: Math.round(((i + 1) / total) * 100),
    });

    try {
      const variable = await figma.variables.getVariableByIdAsync(inst.variableId);
      if (!variable) {
        logger.warn(`Variable not found: ${inst.variableId} (${inst.tokenPath})`);
        skippedCount++;
        continue;
      }

      const collection = await figma.variables.getVariableCollectionByIdAsync(
        variable.variableCollectionId,
      );
      if (!collection) {
        logger.warn(`Collection not found for variable: ${inst.tokenPath}`);
        skippedCount++;
        continue;
      }

      // Update default mode value
      const figmaValue = toFigmaValue(inst.newValue, variable.resolvedType);
      if (figmaValue === null) {
        logger.warn(`Could not convert value for ${inst.tokenPath}: ${inst.newValue}`);
        skippedCount++;
        continue;
      }

      variable.setValueForMode(collection.defaultModeId, figmaValue);

      // Update additional modes if provided
      if (inst.modeUpdates && inst.modeUpdates.length > 0) {
        const modeNameToId = new Map<string, string>();
        for (const mode of collection.modes) {
          modeNameToId.set(mode.name, mode.modeId);
        }

        for (const modeUpdate of inst.modeUpdates) {
          const modeId = modeNameToId.get(modeUpdate.modeName);
          if (!modeId) {
            logger.warn(`Mode "${modeUpdate.modeName}" not found for ${inst.tokenPath}`);
            continue;
          }
          const modeValue = toFigmaValue(modeUpdate.value, variable.resolvedType);
          if (modeValue !== null) {
            variable.setValueForMode(modeId, modeValue);
          }
        }
      }

      updatedCount++;
    } catch (err) {
      const errorMsg = `Failed to update ${inst.tokenPath}: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
      logger.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return { updatedCount, skippedCount, errors };
}

/**
 * Convert a raw value (from DTCG) back to a Figma VariableValue.
 * - COLOR: hex string -> RGBA object
 * - FLOAT: number
 * - STRING: string
 * - BOOLEAN: boolean
 */
function toFigmaValue(
  value: string | number | boolean,
  resolvedType: VariableResolvedDataType,
): VariableValue | null {
  switch (resolvedType) {
    case 'COLOR': {
      if (typeof value !== 'string') return null;
      return hexToRgba(value);
    }
    case 'FLOAT':
      return typeof value === 'number' ? value : null;
    case 'STRING':
      return typeof value === 'string' ? value : null;
    case 'BOOLEAN':
      return typeof value === 'boolean' ? value : null;
    default:
      return null;
  }
}

/**
 * Parse a hex color string (#RRGGBB or #RRGGBBAA) to Figma RGBA (0-1 range).
 * Inverse of rgbaToHex() in color-utils.ts.
 */
function hexToRgba(hex: string): RGBA | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6 && cleaned.length !== 8) return null;

  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  const a = cleaned.length === 8
    ? parseInt(cleaned.substring(6, 8), 16) / 255
    : 1;

  if ([r, g, b, a].some(isNaN)) return null;

  return { r, g, b, a };
}
