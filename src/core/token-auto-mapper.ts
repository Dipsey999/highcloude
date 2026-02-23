import { sendToUI } from '../utils/message-bus';
import { logger } from '../utils/logger';
import { getAllLocalVariablesWithMeta } from '../utils/variable-lookup';
import { rgbToLab, deltaE2000, colorConfidence } from '../utils/color-match';
import { rgbToHex } from '../utils/color-utils';
import type {
  AutoMapResult,
  AutoMapNodeResult,
  AutoMapPropertyType,
  TokenSuggestion,
} from '../types/messages';

const MAX_SUGGESTIONS = 5;
const MAX_NODES = 500;

interface ColorToken {
  variableId: string;
  variableName: string;
  collectionName: string;
  hex: string;
  lab: [number, number, number];
}

interface DimensionToken {
  variableId: string;
  variableName: string;
  collectionName: string;
  value: number;
}

/**
 * Scan the current selection for hard-coded values and suggest matching tokens.
 * Entry point called from code.ts.
 */
export async function autoMapTokens(): Promise<AutoMapResult> {
  const startTime = Date.now();
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    throw new Error('No selection. Please select a frame to scan for hard-coded values.');
  }

  sendToUI({
    type: 'AUTO_MAP_PROGRESS',
    stage: 'Loading design tokens...',
    percent: 0,
  });

  // Build token lookup structures
  const allVars = await getAllLocalVariablesWithMeta();
  const colorTokens: ColorToken[] = [];
  const dimensionTokens: DimensionToken[] = [];

  for (const { variable, collectionName, defaultValue } of allVars) {
    if (variable.resolvedType === 'COLOR' && defaultValue && typeof defaultValue === 'object') {
      const rgb = defaultValue as { r: number; g: number; b: number };
      const hex = rgbToHex(rgb);
      const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
      colorTokens.push({
        variableId: variable.id,
        variableName: variable.name,
        collectionName,
        hex,
        lab,
      });
    } else if (variable.resolvedType === 'FLOAT' && typeof defaultValue === 'number') {
      dimensionTokens.push({
        variableId: variable.id,
        variableName: variable.name,
        collectionName,
        value: defaultValue,
      });
    }
  }

  logger.info(`Auto-map: ${colorTokens.length} color tokens, ${dimensionTokens.length} dimension tokens`);

  sendToUI({
    type: 'AUTO_MAP_PROGRESS',
    stage: 'Scanning nodes...',
    percent: 10,
  });

  // Count nodes for progress
  const rootNode = selection[0];
  const totalNodes = countNodes(rootNode);
  const cappedTotal = Math.min(totalNodes, MAX_NODES);

  let scannedCount = 0;
  const mappings: AutoMapNodeResult[] = [];
  let totalHardCoded = 0;
  let totalSuggestions = 0;

  // Scan the selection tree
  function scanNode(node: SceneNode): void {
    if (scannedCount >= MAX_NODES) return;
    scannedCount++;

    sendToUI({
      type: 'AUTO_MAP_PROGRESS',
      stage: `Scanning ${node.name}...`,
      percent: 10 + Math.round((scannedCount / cappedTotal) * 80),
    });

    // Check fill color
    if ('fills' in node) {
      const fills = (node as GeometryMixin).fills;
      if (fills && typeof fills !== 'symbol') {
        const fillsArr = fills as readonly Paint[];
        if (fillsArr.length > 0 && fillsArr[0].type === 'SOLID') {
          if (!isPropertyBound(node, 'fills')) {
            const solid = fillsArr[0] as SolidPaint;
            const hex = rgbToHex(solid.color);
            const lab = rgbToLab(solid.color.r, solid.color.g, solid.color.b);
            const suggestions = matchColor(hex, lab, colorTokens);
            if (suggestions.length > 0) {
              totalHardCoded++;
              totalSuggestions += suggestions.length;
              mappings.push({
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
    }

    // Check stroke color
    if ('strokes' in node) {
      const strokes = (node as GeometryMixin).strokes;
      if (strokes && typeof strokes !== 'symbol') {
        const strokesArr = strokes as readonly Paint[];
        if (strokesArr.length > 0 && strokesArr[0].type === 'SOLID') {
          if (!isPropertyBound(node, 'strokes')) {
            const solid = strokesArr[0] as SolidPaint;
            const hex = rgbToHex(solid.color);
            const lab = rgbToLab(solid.color.r, solid.color.g, solid.color.b);
            const suggestions = matchColor(hex, lab, colorTokens);
            if (suggestions.length > 0) {
              totalHardCoded++;
              totalSuggestions += suggestions.length;
              mappings.push({
                nodeId: node.id,
                nodeName: node.name,
                nodeType: node.type,
                property: 'stroke',
                currentValue: hex,
                suggestions,
              });
            }
          }
        }
      }
    }

    // Check numeric properties
    checkNumericProperty(node, 'fontSize', dimensionTokens, mappings);
    checkNumericProperty(node, 'cornerRadius', dimensionTokens, mappings);
    checkNumericProperty(node, 'itemSpacing', dimensionTokens, mappings);
    checkNumericProperty(node, 'strokeWidth', dimensionTokens, mappings);
    checkNumericProperty(node, 'paddingTop', dimensionTokens, mappings);
    checkNumericProperty(node, 'paddingRight', dimensionTokens, mappings);
    checkNumericProperty(node, 'paddingBottom', dimensionTokens, mappings);
    checkNumericProperty(node, 'paddingLeft', dimensionTokens, mappings);

    // Recurse into children
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        if (scannedCount >= MAX_NODES) break;
        scanNode(child);
      }
    }
  }

  function checkNumericProperty(
    node: SceneNode,
    property: AutoMapPropertyType,
    tokens: DimensionToken[],
    results: AutoMapNodeResult[],
  ): void {
    // Map property name to actual node property
    const figmaProperty = mapPropertyToFigma(property);
    if (!(figmaProperty in node)) return;

    const value = (node as unknown as Record<string, unknown>)[figmaProperty];
    if (typeof value !== 'number' || value <= 0) return;
    if (typeof value === 'number' && value === (value | 0) && value === 0) return;

    // Check if already bound
    if (isPropertyBound(node, figmaProperty)) return;

    const suggestions = matchNumber(value, tokens);
    if (suggestions.length > 0) {
      totalHardCoded++;
      totalSuggestions += suggestions.length;
      results.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        property,
        currentValue: value,
        suggestions,
      });
    }
  }

  scanNode(rootNode);

  sendToUI({
    type: 'AUTO_MAP_PROGRESS',
    stage: 'Complete!',
    percent: 100,
  });

  return {
    mappings,
    totalHardCoded,
    totalSuggestions,
    scanDuration: Date.now() - startTime,
  };
}

/**
 * Match a hex color against all color tokens using CIEDE2000.
 */
function matchColor(
  hex: string,
  lab: [number, number, number],
  tokens: ColorToken[],
): TokenSuggestion[] {
  const results: Array<TokenSuggestion & { _deltaE: number }> = [];

  for (const token of tokens) {
    const dE = deltaE2000(lab, token.lab);
    const match = colorConfidence(dE);
    if (!match) continue;

    results.push({
      variableId: token.variableId,
      variableName: token.variableName,
      collectionName: token.collectionName,
      currentValue: hex,
      tokenValue: token.hex,
      confidence: match.confidence,
      matchType: match.matchType,
      deltaE: Math.round(dE * 100) / 100,
      _deltaE: dE,
    });
  }

  // Sort by confidence (desc), then deltaE (asc)
  results.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a._deltaE - b._deltaE;
  });

  // Return top N without the internal _deltaE
  return results.slice(0, MAX_SUGGESTIONS).map(({ _deltaE: _, ...rest }) => rest);
}

/**
 * Match a numeric value against dimension tokens.
 */
function matchNumber(
  value: number,
  tokens: DimensionToken[],
): TokenSuggestion[] {
  const results: TokenSuggestion[] = [];

  for (const token of tokens) {
    const diff = Math.abs(value - token.value);

    let confidence: number;
    let matchType: 'exact' | 'close' | 'approximate';

    if (diff === 0) {
      confidence = 1.0;
      matchType = 'exact';
    } else if (diff <= 1) {
      confidence = 0.9;
      matchType = 'close';
    } else if (diff <= 2) {
      confidence = 0.75;
      matchType = 'close';
    } else if (diff <= 5) {
      confidence = 0.5;
      matchType = 'approximate';
    } else {
      continue; // Too far apart
    }

    results.push({
      variableId: token.variableId,
      variableName: token.variableName,
      collectionName: token.collectionName,
      currentValue: value,
      tokenValue: token.value,
      confidence,
      matchType,
    });
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);

  return results.slice(0, MAX_SUGGESTIONS);
}

/**
 * Check if a property on a node is already bound to a variable.
 */
function isPropertyBound(node: SceneNode, property: string): boolean {
  try {
    const bv = (node as SceneNode & { boundVariables?: Record<string, unknown> }).boundVariables;
    if (!bv) return false;

    const binding = bv[property];
    if (Array.isArray(binding)) return binding.length > 0;
    return !!binding;
  } catch {
    return false;
  }
}

/**
 * Map our AutoMapPropertyType to the actual Figma node property name.
 */
function mapPropertyToFigma(property: AutoMapPropertyType): string {
  switch (property) {
    case 'fill': return 'fills';
    case 'stroke': return 'strokes';
    case 'strokeWidth': return 'strokeWeight';
    default: return property;
  }
}

/**
 * Count nodes in a subtree.
 */
function countNodes(node: SceneNode): number {
  let count = 1;
  if ('children' in node) {
    for (const child of (node as FrameNode).children) {
      count += countNodes(child);
    }
  }
  return count;
}
