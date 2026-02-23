import type {
  DesignTokensDocument,
  DTCGToken,
  DTCGTokenType,
  DTCGValue,
  VariableUpdateInstruction,
} from '../types/messages';

/**
 * Convert a DesignTokensDocument from GitHub into a list of
 * VariableUpdateInstruction that code.ts can apply to Figma.
 *
 * Only tokens with $extensions.figma.variableId are included,
 * because those are the only ones we can map back to existing variables.
 */
export function buildUpdateInstructions(
  doc: DesignTokensDocument,
): VariableUpdateInstruction[] {
  const instructions: VariableUpdateInstruction[] = [];

  function walk(node: unknown, path: string): void {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;

    if ('$type' in obj && '$value' in obj) {
      const token: DTCGToken = {
        $type: obj.$type as DTCGToken['$type'],
        $value: obj.$value as DTCGToken['$value'],
        $extensions: obj.$extensions as DTCGToken['$extensions'],
      };
      const variableId = token.$extensions?.figma?.variableId;
      if (!variableId) return;

      const tokenType = token.$type;
      const rawValue = dtcgValueToRaw(token.$value, tokenType);
      if (rawValue === null) return;

      const instruction: VariableUpdateInstruction = {
        variableId,
        tokenPath: path,
        newValue: rawValue,
        tokenType,
      };

      // Include mode updates if present
      const modes = token.$extensions?.figma?.modes;
      if (modes) {
        instruction.modeUpdates = Object.entries(modes).map(([modeName, modeVal]) => ({
          modeName,
          value: dtcgValueToRaw(modeVal, tokenType) ?? (modeVal as string | number | boolean),
        }));
      }

      instructions.push(instruction);
      return;
    }

    for (const key of Object.keys(obj)) {
      if (key === 'metadata') continue;
      const childPath = path ? `${path}/${key}` : key;
      walk(obj[key], childPath);
    }
  }

  walk(doc, '');
  return instructions;
}

/**
 * Convert a DTCG value back to a raw Figma-compatible value.
 * - color: hex string (code.ts will parse to RGBA)
 * - dimension: "16px" -> 16
 * - string: pass through
 * - boolean: pass through
 * - typography/shadow: return null (not supported for pull in Phase 3)
 */
function dtcgValueToRaw(
  value: DTCGValue,
  type: DTCGTokenType,
): string | number | boolean | null {
  switch (type) {
    case 'color':
      return typeof value === 'string' ? value : null;

    case 'dimension': {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    }

    case 'string':
      return typeof value === 'string' ? value : null;

    case 'boolean':
      return typeof value === 'boolean' ? value : null;

    case 'typography':
    case 'shadow':
      return null;

    default:
      return null;
  }
}
