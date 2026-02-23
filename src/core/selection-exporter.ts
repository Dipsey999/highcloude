import { sendToUI } from '../utils/message-bus';
import { logger } from '../utils/logger';
import { buildReverseVariableMap } from '../utils/variable-lookup';
import { rgbToHex } from '../utils/color-utils';
import type { ExportedNode, SelectionExportResult, DesignNodeType, DesignSpecPadding } from '../types/messages';

const MAX_NODES = 500;

/**
 * Export the current Figma selection as a structured ExportedNode tree.
 * Entry point called from code.ts.
 */
export async function exportSelection(): Promise<SelectionExportResult> {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    throw new Error('No selection. Please select a frame or component to export.');
  }

  const rootNode = selection[0];
  const warnings: string[] = [];
  let nodeCount = 0;
  let boundVariableCount = 0;

  // Build reverse variable map for detecting bound variables
  const reverseVarMap = await buildReverseVariableMap();

  sendToUI({
    type: 'EXPORT_PROGRESS',
    stage: 'Scanning selection...',
    percent: 0,
  });

  // Count total nodes for progress
  const total = countSceneNodes(rootNode);
  const cappedTotal = Math.min(total, MAX_NODES);

  if (total > MAX_NODES) {
    warnings.push(`Selection has ${total} nodes. Export capped at ${MAX_NODES} for performance.`);
  }

  function onProgress(name: string): void {
    nodeCount++;
    sendToUI({
      type: 'EXPORT_PROGRESS',
      stage: `Exporting ${name}...`,
      percent: Math.round((Math.min(nodeCount, cappedTotal) / cappedTotal) * 100),
    });
  }

  const root = exportNode(rootNode, reverseVarMap, warnings, onProgress);

  if (!root) {
    throw new Error('Could not export the selected node.');
  }

  // Count bound variables
  countBoundVars(root, (count) => { boundVariableCount = count; });

  return {
    root,
    nodeCount,
    boundVariableCount,
    warnings,
  };
}

/**
 * Count scene nodes in a subtree.
 */
function countSceneNodes(node: SceneNode): number {
  let count = 1;
  if ('children' in node) {
    for (const child of (node as FrameNode).children) {
      count += countSceneNodes(child);
    }
  }
  return count;
}

/**
 * Count bound variables in an exported tree.
 */
function countBoundVars(node: ExportedNode, cb: (count: number) => void): void {
  let count = 0;
  function walk(n: ExportedNode): void {
    if (n.boundVariables) {
      count += Object.keys(n.boundVariables).length;
    }
    if (n.children) {
      for (const child of n.children) {
        walk(child);
      }
    }
  }
  walk(node);
  cb(count);
}

/**
 * Recursively export a Figma node to an ExportedNode.
 */
function exportNode(
  node: SceneNode,
  reverseVarMap: Map<string, string>,
  warnings: string[],
  onProgress: (name: string) => void,
  depth: number = 0,
): ExportedNode | null {
  onProgress(node.name);

  const nodeType = mapNodeType(node.type);
  const boundVariables: Record<string, string> = {};

  const exported: ExportedNode = {
    type: nodeType,
    name: node.name,
    nodeId: node.id,
    width: Math.round(node.width),
    height: Math.round(node.height),
    x: Math.round(node.x),
    y: Math.round(node.y),
  };

  // Opacity
  if ('opacity' in node && (node as SceneNode & { opacity: number }).opacity < 1) {
    exported.opacity = Math.round((node as SceneNode & { opacity: number }).opacity * 100) / 100;
  }

  // Fill color
  if ('fills' in node) {
    const fillResult = readFillColor(node, reverseVarMap, warnings);
    if (fillResult.value) exported.fill = fillResult.value;
    if (fillResult.boundTo) {
      exported.fill = `$${fillResult.boundTo.replace(/\//g, '.')}`;
      boundVariables['fill'] = fillResult.boundTo;
    }
  }

  // Stroke color
  if ('strokes' in node) {
    const strokeResult = readStrokeColor(node, reverseVarMap, warnings);
    if (strokeResult.value) exported.stroke = strokeResult.value;
    if (strokeResult.boundTo) {
      exported.stroke = `$${strokeResult.boundTo.replace(/\//g, '.')}`;
      boundVariables['stroke'] = strokeResult.boundTo;
    }
    if ('strokeWeight' in node) {
      const sw = (node as GeometryMixin).strokeWeight;
      if (typeof sw === 'number' && sw > 0) {
        exported.strokeWidth = sw;
      }
    }
  }

  // Corner radius
  if ('cornerRadius' in node) {
    const cr = (node as RectangleNode).cornerRadius;
    if (typeof cr === 'number' && cr > 0) {
      exported.cornerRadius = cr;
    }
  }

  // Auto layout properties (FrameNode, ComponentNode)
  if ('layoutMode' in node) {
    const frame = node as FrameNode;
    if (frame.layoutMode !== 'NONE') {
      // Map GRID to NONE since our schema only supports HORIZONTAL/VERTICAL/NONE
      const layoutMode = frame.layoutMode === 'GRID' ? 'NONE' as const : frame.layoutMode;
      exported.layoutMode = layoutMode;
      exported.itemSpacing = frame.itemSpacing;
      exported.primaryAxisAlignItems = frame.primaryAxisAlignItems;
      // Map BASELINE to MIN since our schema only supports MIN/CENTER/MAX
      const counterAlign = frame.counterAxisAlignItems === 'BASELINE' ? 'MIN' as const : frame.counterAxisAlignItems;
      exported.counterAxisAlignItems = counterAlign;

      const padding: DesignSpecPadding = {
        top: frame.paddingTop,
        right: frame.paddingRight,
        bottom: frame.paddingBottom,
        left: frame.paddingLeft,
      };
      if (padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0) {
        exported.padding = padding;
      }
    }
  }

  // Text properties
  if (node.type === 'TEXT') {
    const text = node as TextNode;
    exported.characters = text.characters;

    if (typeof text.fontSize === 'number') {
      exported.fontSize = text.fontSize;
    }

    if (text.fontName && typeof text.fontName !== 'symbol') {
      exported.fontFamily = text.fontName.family;
      exported.fontWeight = fontStyleToWeight(text.fontName.style);
    }

    if (text.textAlignHorizontal) {
      exported.textAlignHorizontal = text.textAlignHorizontal;
    }

    if (text.lineHeight && typeof text.lineHeight !== 'symbol') {
      if (text.lineHeight.unit === 'PIXELS') {
        exported.lineHeight = text.lineHeight.value;
      } else if (text.lineHeight.unit === 'PERCENT') {
        exported.lineHeight = `${text.lineHeight.value}%`;
      }
    }

    if (text.letterSpacing && typeof text.letterSpacing !== 'symbol') {
      if (text.letterSpacing.unit === 'PIXELS' && text.letterSpacing.value !== 0) {
        exported.letterSpacing = text.letterSpacing.value;
      }
    }

    // Check for bound variables on text properties
    const bv = getBoundVariables(node);
    if (bv) {
      if (bv['fontSize']) {
        const varName = reverseVarMap.get(bv['fontSize']);
        if (varName) boundVariables['fontSize'] = varName;
      }
    }
  }

  // Record bound variables
  if (Object.keys(boundVariables).length > 0) {
    exported.boundVariables = boundVariables;
  }

  // Children (for frame-like nodes)
  if ('children' in node && depth < 20) {
    const parent = node as FrameNode;
    const children: ExportedNode[] = [];
    for (const child of parent.children) {
      if (children.length >= MAX_NODES) {
        warnings.push('Node limit reached. Some child nodes were omitted.');
        break;
      }
      const childExported = exportNode(child, reverseVarMap, warnings, onProgress, depth + 1);
      if (childExported) {
        children.push(childExported);
      }
    }
    if (children.length > 0) {
      exported.children = children;
    }
  }

  return exported;
}

/**
 * Map Figma node type string to DesignNodeType.
 */
function mapNodeType(type: string): DesignNodeType {
  switch (type) {
    case 'FRAME': return 'FRAME';
    case 'TEXT': return 'TEXT';
    case 'RECTANGLE': return 'RECTANGLE';
    case 'ELLIPSE': return 'ELLIPSE';
    case 'COMPONENT': return 'COMPONENT';
    case 'COMPONENT_SET': return 'COMPONENT';
    case 'INSTANCE': return 'INSTANCE';
    default: return 'VECTOR';
  }
}

/**
 * Read fill color from a node, detecting bound variables.
 */
function readFillColor(
  node: SceneNode,
  reverseVarMap: Map<string, string>,
  warnings: string[],
): { value?: string; boundTo?: string } {
  if (!('fills' in node)) return {};
  const fills = (node as GeometryMixin).fills;
  if (!fills || typeof fills === 'symbol') return {};
  const fillsArr = fills as readonly Paint[];
  if (fillsArr.length === 0) return {};

  const first = fillsArr[0];
  if (first.type !== 'SOLID') {
    if (first.type === 'GRADIENT_LINEAR' || first.type === 'GRADIENT_RADIAL' ||
        first.type === 'GRADIENT_ANGULAR' || first.type === 'GRADIENT_DIAMOND') {
      warnings.push(`Gradient fill on "${node.name}" — skipped (only solid fills supported)`);
    }
    return {};
  }

  const solid = first as SolidPaint;
  const hex = rgbToHex(solid.color);

  // Check for bound variable
  const bv = getBoundVariables(node);
  if (bv && bv['fills']) {
    const varName = reverseVarMap.get(bv['fills']);
    if (varName) return { value: hex, boundTo: varName };
  }

  return { value: hex };
}

/**
 * Read stroke color from a node, detecting bound variables.
 */
function readStrokeColor(
  node: SceneNode,
  reverseVarMap: Map<string, string>,
  _warnings: string[],
): { value?: string; boundTo?: string } {
  if (!('strokes' in node)) return {};
  const strokes = (node as GeometryMixin).strokes;
  if (!strokes || typeof strokes === 'symbol') return {};
  const strokesArr = strokes as readonly Paint[];
  if (strokesArr.length === 0) return {};

  const first = strokesArr[0];
  if (first.type !== 'SOLID') return {};

  const solid = first as SolidPaint;
  const hex = rgbToHex(solid.color);

  // Check for bound variable
  const bv = getBoundVariables(node);
  if (bv && bv['strokes']) {
    const varName = reverseVarMap.get(bv['strokes']);
    if (varName) return { value: hex, boundTo: varName };
  }

  return { value: hex };
}

/**
 * Safely get bound variables from a node.
 * Returns a map of property → variableId, or null if none.
 */
function getBoundVariables(node: SceneNode): Record<string, string> | null {
  try {
    const bv = (node as SceneNode & { boundVariables?: Record<string, unknown> }).boundVariables;
    if (!bv) return null;

    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(bv)) {
      if (Array.isArray(value) && value.length > 0 && value[0]?.id) {
        // Paint bindings are arrays of VariableAlias
        result[key] = value[0].id;
      } else if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
        // Scalar bindings are single VariableAlias
        result[key] = (value as { id: string }).id;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Convert a font style name to a numeric weight.
 */
function fontStyleToWeight(style: string): number {
  const lower = style.toLowerCase();
  if (lower.includes('thin')) return 100;
  if (lower.includes('extralight') || lower.includes('ultralight')) return 200;
  if (lower.includes('light')) return 300;
  if (lower.includes('medium')) return 500;
  if (lower.includes('semibold') || lower.includes('demibold')) return 600;
  if (lower.includes('extrabold') || lower.includes('ultrabold')) return 800;
  if (lower.includes('bold')) return 700;
  if (lower.includes('black') || lower.includes('heavy')) return 900;
  return 400; // Regular
}
