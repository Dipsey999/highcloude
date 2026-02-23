import type { DesignTokensDocument, DTCGToken, DTCGValidationResult } from '../types/messages';

const VALID_TYPES = new Set(['color', 'dimension', 'string', 'boolean', 'typography', 'shadow']);

/**
 * Validate a DesignTokensDocument against W3C DTCG schema rules.
 */
export function validateDTCG(doc: DesignTokensDocument): DTCGValidationResult {
  const errors: Array<{ path: string; message: string }> = [];
  const warnings: Array<{ path: string; message: string }> = [];
  let totalChecked = 0;
  const seenPaths = new Set<string>();

  function walk(node: unknown, path: string): void {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;

    // Check if this is a token (has $type and $value)
    if ('$type' in obj || '$value' in obj) {
      totalChecked++;

      // Check for duplicate paths
      if (seenPaths.has(path)) {
        errors.push({ path, message: 'Duplicate token path' });
      }
      seenPaths.add(path);

      // Must have both $type and $value
      if (!('$type' in obj)) {
        errors.push({ path, message: 'Missing required $type field' });
        return;
      }
      if (!('$value' in obj)) {
        errors.push({ path, message: 'Missing required $value field' });
        return;
      }

      const token = obj as unknown as DTCGToken;

      // Validate $type is a known type
      if (!VALID_TYPES.has(token.$type)) {
        errors.push({ path, message: `Invalid $type: "${token.$type}". Expected: ${Array.from(VALID_TYPES).join(', ')}` });
      }

      // Validate value shape matches type
      validateValueShape(token, path, errors);

      // Warn on missing description
      if (!token.$description) {
        warnings.push({ path, message: 'Missing $description' });
      }

      return;
    }

    // Recurse into groups
    for (const key of Object.keys(obj)) {
      if (key === 'metadata') continue;
      const childPath = path ? `${path}.${key}` : key;
      walk(obj[key], childPath);
    }
  }

  walk(doc, '');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalChecked,
  };
}

/**
 * Validate that a token's $value shape matches its $type.
 */
function validateValueShape(
  token: DTCGToken,
  path: string,
  errors: Array<{ path: string; message: string }>,
): void {
  const { $type, $value } = token;

  switch ($type) {
    case 'color': {
      if (typeof $value !== 'string') {
        errors.push({ path, message: `Color value must be a string, got ${typeof $value}` });
      } else if (!$value.startsWith('#') && !$value.startsWith('rgb')) {
        errors.push({ path, message: `Color value should start with "#" or "rgb", got "${$value}"` });
      }
      break;
    }
    case 'dimension': {
      if (typeof $value === 'string') {
        if (!/^\d+(\.\d+)?(px|rem|em|%)$/.test($value) && !/^\d+(\.\d+)?$/.test($value)) {
          errors.push({ path, message: `Dimension value should be a number with unit (px/rem/em/%), got "${$value}"` });
        }
      } else if (typeof $value !== 'number') {
        errors.push({ path, message: `Dimension value must be a string or number, got ${typeof $value}` });
      }
      break;
    }
    case 'string': {
      if (typeof $value !== 'string') {
        errors.push({ path, message: `String value must be a string, got ${typeof $value}` });
      }
      break;
    }
    case 'boolean': {
      if (typeof $value !== 'boolean') {
        errors.push({ path, message: `Boolean value must be a boolean, got ${typeof $value}` });
      }
      break;
    }
    case 'typography': {
      if (typeof $value !== 'object' || $value === null) {
        errors.push({ path, message: 'Typography value must be an object' });
      } else {
        const typo = $value as unknown as Record<string, unknown>;
        if (!typo.fontFamily) errors.push({ path, message: 'Typography missing fontFamily' });
        if (!typo.fontSize) errors.push({ path, message: 'Typography missing fontSize' });
      }
      break;
    }
    case 'shadow': {
      if (typeof $value !== 'object' || $value === null) {
        errors.push({ path, message: 'Shadow value must be an object' });
      } else {
        const shadow = $value as unknown as Record<string, unknown>;
        if (!shadow.color) errors.push({ path, message: 'Shadow missing color' });
        if (shadow.offsetX === undefined) errors.push({ path, message: 'Shadow missing offsetX' });
        if (shadow.offsetY === undefined) errors.push({ path, message: 'Shadow missing offsetY' });
      }
      break;
    }
  }
}
