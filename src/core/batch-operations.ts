import { logger } from '../utils/logger';
import { sendToUI } from '../utils/message-bus';
import { rgbToHex } from '../utils/color-utils';
import { hexToLab, deltaE2000, colorConfidence } from '../utils/color-match';
import { getAllLocalVariablesWithMeta } from '../utils/variable-lookup';
import type {
  AutoMapResult,
  AutoMapNodeResult,
  TokenSuggestion,
  UnusedTokensResult,
  OrphanedValuesResult,
} from '../types/messages';

/**
 * Batch auto-map all pages — extends auto-mapping to scan the entire file.
 */
export async function batchAutoMapAllPages(): Promise<AutoMapResult> {
  const startTime = Date.now();
  const allMappings: AutoMapNodeResult[] = [];

  const variablesWithMeta = await getAllLocalVariablesWithMeta();

  // Pre-compute color tokens with Lab values
  const colorTokens: Array<{
    variableId: string;
    variableName: string;
    collectionName: string;
    hex: string;
    lab: [number, number, number];
  }> = [];

  // Pre-compute dimension tokens
  const dimensionTokens: Array<{
    variableId: string;
    variableName: string;
    collectionName: string;
    value: number;
  }> = [];

  for (const item of variablesWithMeta) {
    const { variable, collectionName, defaultValue } = item;
    if (variable.resolvedType === 'COLOR' && defaultValue && typeof defaultValue === 'object') {
      const color = defaultValue as { r: number; g: number; b: number };
      const hex = rgbToHex(color);
      const lab = hexToLab(hex);
      if (lab) {
        colorTokens.push({ variableId: variable.id, variableName: variable.name, collectionName, hex, lab });
      }
    }
    if (variable.resolvedType === 'FLOAT' && typeof defaultValue === 'number') {
      dimensionTokens.push({ variableId: variable.id, variableName: variable.name, collectionName, value: defaultValue });
    }
  }

  const pages = figma.root.children;
  let totalNodes = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    sendToUI({
      type: 'BATCH_AUTO_MAP_ALL_PROGRESS',
      stage: `Scanning page: ${page.name}`,
      percent: Math.round((i / pages.length) * 100),
    });

    const nodes = page.findAll(() => true);
    totalNodes += nodes.length;

    for (const node of nodes) {
      scanNodeForHardCoded(node, colorTokens, dimensionTokens, allMappings);
    }
  }

  const totalHardCoded = allMappings.length;
  const totalSuggestions = allMappings.reduce((sum, m) => sum + m.suggestions.length, 0);

  sendToUI({
    type: 'BATCH_AUTO_MAP_ALL_PROGRESS',
    stage: 'Complete',
    percent: 100,
  });

  return {
    mappings: allMappings,
    totalHardCoded,
    totalSuggestions,
    scanDuration: Date.now() - startTime,
  };
}

/**
 * Find tokens that are not used by any node in the file.
 */
export async function findUnusedTokens(): Promise<UnusedTokensResult> {
  const startTime = Date.now();
  const variables = await figma.variables.getLocalVariablesAsync();
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collectionMap = new Map<string, string>();
  for (const c of collections) {
    collectionMap.set(c.id, c.name);
  }

  // Collect all used variable IDs
  const usedVariableIds = new Set<string>();
  const pages = figma.root.children;

  for (const page of pages) {
    const nodes = page.findAll(() => true);
    for (const node of nodes) {
      collectBoundVariables(node, usedVariableIds);
    }
  }

  // Find unused
  const unusedTokens: UnusedTokensResult['unusedTokens'] = [];
  for (const v of variables) {
    if (!usedVariableIds.has(v.id)) {
      unusedTokens.push({
        variableId: v.id,
        variableName: v.name,
        collectionName: collectionMap.get(v.variableCollectionId) ?? 'Unknown',
        type: v.resolvedType,
      });
    }
  }

  return {
    unusedTokens,
    totalScanned: variables.length,
    scanDuration: Date.now() - startTime,
  };
}

/**
 * Find hard-coded values that have no close match in the token set.
 */
export async function findOrphanedValues(): Promise<OrphanedValuesResult> {
  const startTime = Date.now();
  const orphanedValues: OrphanedValuesResult['orphanedValues'] = [];

  const variablesWithMeta = await getAllLocalVariablesWithMeta();

  // Build color tokens for matching
  const colorTokenHexes: string[] = [];
  for (const item of variablesWithMeta) {
    if (item.variable.resolvedType === 'COLOR' && item.defaultValue && typeof item.defaultValue === 'object') {
      const color = item.defaultValue as { r: number; g: number; b: number };
      colorTokenHexes.push(rgbToHex(color));
    }
  }

  const colorLabs = colorTokenHexes.map((hex) => hexToLab(hex)).filter((lab): lab is [number, number, number] => lab !== null);

  let totalScanned = 0;
  const pages = figma.root.children;

  for (const page of pages) {
    const nodes = page.findAll(() => true);
    for (const node of nodes) {
      totalScanned++;
      // Check fills
      if ('fills' in node) {
        const fills = (node as GeometryMixin).fills;
        if (Array.isArray(fills) && fills.length > 0 && fills[0].type === 'SOLID') {
          const solid = fills[0] as SolidPaint;
          if (!isPropertyBound(node, 'fills')) {
            const hex = rgbToHex(solid.color);
            const lab = hexToLab(hex);
            if (lab) {
              const hasClose = colorLabs.some((tLab) => deltaE2000(lab, tLab) < 12);
              if (!hasClose) {
                orphanedValues.push({ nodeId: node.id, nodeName: node.name, property: 'fill', value: hex });
              }
            }
          }
        }
      }
    }
  }

  return {
    orphanedValues,
    totalScanned,
    scanDuration: Date.now() - startTime,
  };
}

// ========================================
// Helper Functions
// ========================================

function scanNodeForHardCoded(
  node: SceneNode,
  colorTokens: Array<{ variableId: string; variableName: string; collectionName: string; hex: string; lab: [number, number, number] }>,
  dimensionTokens: Array<{ variableId: string; variableName: string; collectionName: string; value: number }>,
  results: AutoMapNodeResult[],
): void {
  // Check fills
  if ('fills' in node) {
    const fills = (node as GeometryMixin).fills;
    if (Array.isArray(fills) && fills.length > 0 && fills[0].type === 'SOLID') {
      if (!isPropertyBound(node, 'fills')) {
        const solid = fills[0] as SolidPaint;
        const hex = rgbToHex(solid.color);
        const suggestions = matchColor(hex, colorTokens);
        if (suggestions.length > 0) {
          results.push({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            property: 'fill',
            currentValue: hex,
            suggestions,
          });
        }
      }
    }
  }

  // Check fontSize (TEXT nodes)
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    const fontSize = textNode.fontSize;
    if (typeof fontSize === 'number' && !isPropertyBound(node, 'fontSize')) {
      const suggestions = matchNumber(fontSize, dimensionTokens);
      if (suggestions.length > 0) {
        results.push({
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          property: 'fontSize',
          currentValue: fontSize,
          suggestions,
        });
      }
    }
  }
}

function matchColor(
  hex: string,
  tokens: Array<{ variableId: string; variableName: string; collectionName: string; hex: string; lab: [number, number, number] }>,
): TokenSuggestion[] {
  const lab = hexToLab(hex);
  if (!lab) return [];

  const suggestions: TokenSuggestion[] = [];
  for (const token of tokens) {
    const dE = deltaE2000(lab, token.lab);
    const conf = colorConfidence(dE);
    if (conf) {
      suggestions.push({
        variableId: token.variableId,
        variableName: token.variableName,
        collectionName: token.collectionName,
        currentValue: hex,
        tokenValue: token.hex,
        confidence: conf.confidence,
        matchType: conf.matchType,
        deltaE: dE,
      });
    }
  }
  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions.slice(0, 5);
}

function matchNumber(
  value: number,
  tokens: Array<{ variableId: string; variableName: string; collectionName: string; value: number }>,
): TokenSuggestion[] {
  const suggestions: TokenSuggestion[] = [];
  for (const token of tokens) {
    const diff = Math.abs(value - token.value);
    let confidence: number;
    let matchType: 'exact' | 'close' | 'approximate';

    if (diff === 0) { confidence = 1.0; matchType = 'exact'; }
    else if (diff <= 1) { confidence = 0.9; matchType = 'close'; }
    else if (diff <= 2) { confidence = 0.75; matchType = 'close'; }
    else if (diff <= 5) { confidence = 0.5; matchType = 'approximate'; }
    else continue;

    suggestions.push({
      variableId: token.variableId,
      variableName: token.variableName,
      collectionName: token.collectionName,
      currentValue: value,
      tokenValue: token.value,
      confidence,
      matchType,
    });
  }
  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions.slice(0, 5);
}

function isPropertyBound(node: SceneNode, property: string): boolean {
  try {
    const boundVars = (node as SceneNode & { boundVariables?: Record<string, unknown> }).boundVariables;
    if (!boundVars) return false;
    const binding = boundVars[property];
    if (!binding) return false;
    if (Array.isArray(binding)) return binding.length > 0;
    return typeof binding === 'object' && binding !== null;
  } catch {
    return false;
  }
}

function collectBoundVariables(node: SceneNode, usedIds: Set<string>): void {
  try {
    const boundVars = (node as SceneNode & { boundVariables?: Record<string, unknown> }).boundVariables;
    if (!boundVars) return;

    for (const key of Object.keys(boundVars)) {
      const binding = boundVars[key];
      if (isVariableAlias(binding)) {
        usedIds.add(binding.id);
      }
      if (Array.isArray(binding)) {
        for (const item of binding) {
          if (isVariableAlias(item)) {
            usedIds.add(item.id);
          }
        }
      }
    }
  } catch {
    // ignore
  }
}

function isVariableAlias(value: unknown): value is { type: 'VARIABLE_ALIAS'; id: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type: string }).type === 'VARIABLE_ALIAS' &&
    'id' in value
  );
}
