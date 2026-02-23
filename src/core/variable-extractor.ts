import { rgbaToHex } from '../utils/color-utils';
import { logger } from '../utils/logger';
import { sendToUI } from '../utils/message-bus';
import type {
  RawExtractionResult,
  RawFigmaVariable,
  RawFigmaTextStyle,
  RawFigmaEffectStyle,
  RawFigmaShadowEffect,
} from '../types/messages';

const MAX_ALIAS_DEPTH = 10;

/**
 * Extract all local variables, text styles, and effect styles
 * from the current Figma document.
 */
export async function extractAllTokens(): Promise<RawExtractionResult> {
  sendToUI({ type: 'EXTRACTION_PROGRESS', stage: 'Extracting variables...', percent: 0 });
  const variables = await extractVariables();

  sendToUI({ type: 'EXTRACTION_PROGRESS', stage: 'Extracting text styles...', percent: 50 });
  const textStyles = await extractTextStyles();

  sendToUI({ type: 'EXTRACTION_PROGRESS', stage: 'Extracting effect styles...', percent: 75 });
  const effectStyles = await extractEffectStyles();

  sendToUI({ type: 'EXTRACTION_PROGRESS', stage: 'Complete', percent: 100 });

  logger.info(
    `Extracted ${variables.length} variables, ${textStyles.length} text styles, ${effectStyles.length} effect styles`
  );

  return {
    variables,
    textStyles,
    effectStyles,
    figmaFileName: figma.root.name,
    figmaFileKey: figma.fileKey ?? undefined,
  };
}

// ========================================
// Variable Extraction
// ========================================

async function extractVariables(): Promise<RawFigmaVariable[]> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const results: RawFigmaVariable[] = [];

  for (const collection of collections) {
    const modeNameMap: Record<string, string> = {};
    for (const mode of collection.modes) {
      modeNameMap[mode.modeId] = mode.name;
    }

    for (const variableId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (!variable) continue;

      const rawVar = await processVariable(
        variable,
        collection.name,
        collection.id,
        modeNameMap,
        collection.defaultModeId,
      );
      if (rawVar) {
        results.push(rawVar);
      }
    }
  }

  return results;
}

async function processVariable(
  variable: Variable,
  collectionName: string,
  collectionId: string,
  modeNameMap: Record<string, string>,
  defaultModeId: string,
): Promise<RawFigmaVariable | null> {
  const valuesByMode: Record<string, string | number | boolean> = {};
  let aliasName: string | undefined;

  for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
    const modeName = modeNameMap[modeId] ?? modeId;
    const resolved = await resolveVariableValue(value, variable.resolvedType, 0);

    if (resolved !== null) {
      valuesByMode[modeName] = resolved;
    }

    // Track alias info from the default mode
    if (modeId === defaultModeId && isVariableAlias(value)) {
      const aliasedVar = await figma.variables.getVariableByIdAsync(value.id);
      if (aliasedVar) {
        aliasName = aliasedVar.name;
      }
    }
  }

  const defaultModeName = modeNameMap[defaultModeId] ?? defaultModeId;
  const defaultValue = valuesByMode[defaultModeName];
  if (defaultValue === undefined) return null;

  return {
    id: variable.id,
    name: variable.name,
    resolvedType: variable.resolvedType as RawFigmaVariable['resolvedType'],
    description: variable.description,
    collectionName,
    collectionId,
    scopes: [...variable.scopes],
    valuesByMode,
    defaultValue,
    aliasName,
  };
}

function isVariableAlias(value: VariableValue): value is VariableAlias {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as VariableAlias).type === 'VARIABLE_ALIAS'
  );
}

async function resolveVariableValue(
  value: VariableValue,
  resolvedType: VariableResolvedDataType,
  depth: number,
): Promise<string | number | boolean | null> {
  if (depth > MAX_ALIAS_DEPTH) {
    logger.warn('Max alias depth reached, returning null');
    return null;
  }

  if (isVariableAlias(value)) {
    const aliasedVar = await figma.variables.getVariableByIdAsync(value.id);
    if (!aliasedVar) return null;

    const collection = await figma.variables.getVariableCollectionByIdAsync(
      aliasedVar.variableCollectionId
    );
    if (!collection) return null;

    const defaultVal = aliasedVar.valuesByMode[collection.defaultModeId];
    if (defaultVal === undefined) return null;

    return resolveVariableValue(defaultVal, aliasedVar.resolvedType, depth + 1);
  }

  switch (resolvedType) {
    case 'COLOR': {
      const color = value as RGBA;
      return rgbaToHex(color);
    }
    case 'FLOAT':
      return value as number;
    case 'STRING':
      return value as string;
    case 'BOOLEAN':
      return value as boolean;
    default:
      return null;
  }
}

// ========================================
// Text Style Extraction
// ========================================

async function extractTextStyles(): Promise<RawFigmaTextStyle[]> {
  const styles = await figma.getLocalTextStylesAsync();
  const results: RawFigmaTextStyle[] = [];

  for (const style of styles) {
    const fontWeight = parseFontWeight(style.fontName.style);

    results.push({
      id: style.id,
      name: style.name,
      description: style.description,
      fontFamily: style.fontName.family,
      fontStyle: style.fontName.style,
      fontSize: style.fontSize as number,
      fontWeight,
      letterSpacing: {
        value: (style.letterSpacing as LetterSpacing).value,
        unit: (style.letterSpacing as LetterSpacing).unit,
      },
      lineHeight: (style.lineHeight as LineHeight).unit === 'AUTO'
        ? { unit: 'AUTO' as const }
        : {
            value: (style.lineHeight as { value: number; unit: 'PIXELS' | 'PERCENT' }).value,
            unit: (style.lineHeight as { value: number; unit: 'PIXELS' | 'PERCENT' }).unit,
          },
      paragraphSpacing: style.paragraphSpacing as number,
      textDecoration: style.textDecoration as string,
      textCase: style.textCase as string,
    });
  }

  return results;
}

/**
 * Parse a font weight number from a Figma font style string.
 * E.g. "Bold" → 700, "Semi Bold" → 600, "Regular" → 400.
 */
function parseFontWeight(fontStyle: string): number {
  const lower = fontStyle.toLowerCase();
  if (lower.includes('thin') || lower.includes('hairline')) return 100;
  if (lower.includes('extralight') || lower.includes('ultra light')) return 200;
  if (lower.includes('light')) return 300;
  if (lower.includes('medium')) return 500;
  if (lower.includes('semibold') || lower.includes('semi bold') || lower.includes('demibold')) return 600;
  if (lower.includes('extrabold') || lower.includes('ultra bold') || lower.includes('extra bold')) return 800;
  if (lower.includes('bold')) return 700;
  if (lower.includes('black') || lower.includes('heavy')) return 900;
  return 400;
}

// ========================================
// Effect Style Extraction
// ========================================

async function extractEffectStyles(): Promise<RawFigmaEffectStyle[]> {
  const styles = await figma.getLocalEffectStylesAsync();
  const results: RawFigmaEffectStyle[] = [];

  for (const style of styles) {
    const shadowEffects: RawFigmaShadowEffect[] = [];

    for (const effect of style.effects) {
      if (
        (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') &&
        effect.visible !== false
      ) {
        const shadow = effect as DropShadowEffect;
        shadowEffects.push({
          type: effect.type,
          color: rgbaToHex(shadow.color),
          offsetX: shadow.offset.x,
          offsetY: shadow.offset.y,
          radius: shadow.radius,
          spread: shadow.spread ?? 0,
        });
      }
    }

    if (shadowEffects.length > 0) {
      results.push({
        id: style.id,
        name: style.name,
        description: style.description,
        effects: shadowEffects,
      });
    }
  }

  return results;
}
