import type {
  RawExtractionResult,
  RawFigmaVariable,
  RawFigmaTextStyle,
  RawFigmaEffectStyle,
  DesignTokensDocument,
  DTCGToken,
  DTCGTokenType,
  DTCGValue,
  TokenExtractionSummary,
  FileMapping,
} from '../types/messages';

/**
 * Transform a RawExtractionResult into a W3C DTCG-compliant token document.
 */
export function transformToDocument(raw: RawExtractionResult): DesignTokensDocument {
  const doc: DesignTokensDocument = {
    metadata: {
      source: 'cosmikit',
      figmaFileName: raw.figmaFileName,
      figmaFileKey: raw.figmaFileKey,
      lastSynced: new Date().toISOString(),
      version: '1.0.0',
    },
  };

  for (const variable of raw.variables) {
    const token = variableToToken(variable);
    setNestedToken(doc, variable.name, token);
  }

  for (const style of raw.textStyles) {
    const token = textStyleToToken(style);
    const path = style.name.startsWith('typography/')
      ? style.name
      : `typography/${style.name}`;
    setNestedToken(doc, path, token);
  }

  for (const style of raw.effectStyles) {
    const token = effectStyleToToken(style);
    const path = style.name.startsWith('shadow/')
      ? style.name
      : `shadow/${style.name}`;
    setNestedToken(doc, path, token);
  }

  return doc;
}

/**
 * Walk the token tree and compute summary statistics.
 */
export function computeSummary(doc: DesignTokensDocument): TokenExtractionSummary {
  const summary: TokenExtractionSummary = {
    colorCount: 0,
    dimensionCount: 0,
    typographyCount: 0,
    shadowCount: 0,
    stringCount: 0,
    booleanCount: 0,
    totalCount: 0,
    collectionNames: [],
  };

  const collectionSet = new Set<string>();

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;

    if ('$type' in obj && '$value' in obj) {
      summary.totalCount++;
      const tokenType = obj.$type as DTCGToken['$type'];
      switch (tokenType) {
        case 'color': summary.colorCount++; break;
        case 'dimension': summary.dimensionCount++; break;
        case 'typography': summary.typographyCount++; break;
        case 'shadow': summary.shadowCount++; break;
        case 'string': summary.stringCount++; break;
        case 'boolean': summary.booleanCount++; break;
      }

      const extensions = obj.$extensions as DTCGToken['$extensions'] | undefined;
      if (extensions?.figma?.collectionName) {
        collectionSet.add(extensions.figma.collectionName);
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      if (key === 'metadata') continue;
      walk(obj[key]);
    }
  }

  walk(doc);
  summary.collectionNames = [...collectionSet];
  return summary;
}

// ========================================
// Nesting Logic
// ========================================

/**
 * Insert a DTCG token at a nested path in the document.
 * "color/primary/500" → { color: { primary: { "500": token } } }
 */
function setNestedToken(
  root: Record<string, unknown>,
  slashPath: string,
  token: DTCGToken,
): void {
  const segments = slashPath.split('/').map(sanitizeKey);

  let current = root as Record<string, unknown>;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (!current[seg] || typeof current[seg] !== 'object' || '$type' in (current[seg] as object)) {
      current[seg] = {};
    }
    current = current[seg] as Record<string, unknown>;
  }

  const leafKey = segments[segments.length - 1];
  current[leafKey] = token;
}

function sanitizeKey(key: string): string {
  return key.trim().replace(/\s+/g, '-');
}

// ========================================
// Variable → DTCG Token
// ========================================

function mapResolvedTypeToDTCG(resolvedType: string): DTCGTokenType {
  switch (resolvedType) {
    case 'COLOR': return 'color';
    case 'FLOAT': return 'dimension';
    case 'STRING': return 'string';
    case 'BOOLEAN': return 'boolean';
    default: return 'string';
  }
}

function formatDimensionValue(value: number): string {
  return `${value}px`;
}

function variableToToken(variable: RawFigmaVariable): DTCGToken {
  const type = mapResolvedTypeToDTCG(variable.resolvedType);
  let value: DTCGValue = variable.defaultValue;

  if (type === 'dimension' && typeof value === 'number') {
    value = formatDimensionValue(value);
  }

  const token: DTCGToken = {
    $type: type,
    $value: value,
  };

  if (variable.description) {
    token.$description = variable.description;
  }

  const modes = variable.valuesByMode;
  const hasModes = Object.keys(modes).length > 1;

  token.$extensions = {
    figma: {
      variableId: variable.id,
      collectionName: variable.collectionName,
      ...(hasModes && {
        modes: Object.fromEntries(
          Object.entries(modes).map(([modeName, modeVal]) => {
            if (type === 'dimension' && typeof modeVal === 'number') {
              return [modeName, formatDimensionValue(modeVal)];
            }
            return [modeName, modeVal];
          })
        ),
      }),
      ...(variable.scopes.length > 0 && { scopes: variable.scopes }),
    },
  };

  return token;
}

// ========================================
// Text Style → DTCG Token
// ========================================

function textStyleToToken(style: RawFigmaTextStyle): DTCGToken {
  let lineHeightStr: string;
  if (style.lineHeight.unit === 'AUTO') {
    lineHeightStr = 'auto';
  } else if (style.lineHeight.unit === 'PERCENT') {
    lineHeightStr = `${style.lineHeight.value}%`;
  } else {
    lineHeightStr = `${style.lineHeight.value}px`;
  }

  let letterSpacingStr: string;
  if (style.letterSpacing.unit === 'PERCENT') {
    letterSpacingStr = `${(style.letterSpacing.value / 100).toFixed(4)}em`;
  } else {
    letterSpacingStr = `${style.letterSpacing.value}px`;
  }

  const token: DTCGToken = {
    $type: 'typography',
    $value: {
      fontFamily: style.fontFamily,
      fontSize: `${style.fontSize}px`,
      fontWeight: style.fontWeight,
      lineHeight: lineHeightStr,
      letterSpacing: letterSpacingStr,
    },
  };

  if (style.description) {
    token.$description = style.description;
  }

  token.$extensions = {
    figma: {
      styleId: style.id,
      styleName: style.name,
    },
  };

  return token;
}

// ========================================
// Effect Style → DTCG Token
// ========================================

function effectStyleToToken(style: RawFigmaEffectStyle): DTCGToken {
  const primary = style.effects[0];

  const token: DTCGToken = {
    $type: 'shadow',
    $value: {
      color: primary.color,
      offsetX: `${primary.offsetX}px`,
      offsetY: `${primary.offsetY}px`,
      blur: `${primary.radius}px`,
      spread: `${primary.spread}px`,
    },
  };

  if (style.description) {
    token.$description = style.description;
  }

  token.$extensions = {
    figma: {
      styleId: style.id,
      styleName: style.name,
    },
  };

  return token;
}

// ========================================
// Multi-Document Splitting (Phase 7)
// ========================================

/**
 * Transform a RawExtractionResult into multiple documents, one per collection.
 * Text styles go into a "typography" document, effect styles into a "shadows" document.
 */
export function transformToMultiDocument(
  raw: RawExtractionResult,
): Map<string, DesignTokensDocument> {
  const result = new Map<string, DesignTokensDocument>();

  // Group variables by collectionName
  const variablesByCollection = new Map<string, RawFigmaVariable[]>();
  for (const variable of raw.variables) {
    const coll = variable.collectionName || 'default';
    if (!variablesByCollection.has(coll)) {
      variablesByCollection.set(coll, []);
    }
    variablesByCollection.get(coll)!.push(variable);
  }

  // Create one document per collection
  for (const [collectionName, variables] of variablesByCollection) {
    const doc: DesignTokensDocument = {
      metadata: {
        source: 'cosmikit',
        figmaFileName: raw.figmaFileName,
        figmaFileKey: raw.figmaFileKey,
        lastSynced: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    for (const variable of variables) {
      const token = variableToToken(variable);
      setNestedToken(doc, variable.name, token);
    }

    result.set(collectionName, doc);
  }

  // Add text styles to a "typography" document
  if (raw.textStyles.length > 0) {
    const doc: DesignTokensDocument = {
      metadata: {
        source: 'cosmikit',
        figmaFileName: raw.figmaFileName,
        figmaFileKey: raw.figmaFileKey,
        lastSynced: new Date().toISOString(),
        version: '1.0.0',
      },
    };
    for (const style of raw.textStyles) {
      const token = textStyleToToken(style);
      const path = style.name.startsWith('typography/')
        ? style.name
        : `typography/${style.name}`;
      setNestedToken(doc, path, token);
    }
    result.set('typography', doc);
  }

  // Add effect styles to a "shadows" document
  if (raw.effectStyles.length > 0) {
    const doc: DesignTokensDocument = {
      metadata: {
        source: 'cosmikit',
        figmaFileName: raw.figmaFileName,
        figmaFileKey: raw.figmaFileKey,
        lastSynced: new Date().toISOString(),
        version: '1.0.0',
      },
    };
    for (const style of raw.effectStyles) {
      const token = effectStyleToToken(style);
      const path = style.name.startsWith('shadow/')
        ? style.name
        : `shadow/${style.name}`;
      setNestedToken(doc, path, token);
    }
    result.set('shadows', doc);
  }

  return result;
}

/**
 * Convert a collection name to a URL-safe slug.
 * "My Cool Colors" → "my-cool-colors"
 */
export function slugifyCollectionName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a default file mapping from collection names.
 * "Primitives" + dir "tokens/" → { "Primitives": "tokens/primitives.json" }
 */
export function generateDefaultFileMapping(
  collectionNames: string[],
  directory: string = 'tokens/',
): FileMapping {
  const dir = directory.endsWith('/') ? directory : `${directory}/`;
  const mapping: FileMapping = {};

  for (const name of collectionNames) {
    const slug = slugifyCollectionName(name);
    mapping[name] = `${dir}${slug}.json`;
  }

  return mapping;
}
