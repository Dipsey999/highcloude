import { sendToUI } from '../utils/message-bus';
import { logger } from '../utils/logger';
import { buildVariableLookup } from '../utils/variable-lookup';
import type { DesignSpecNode, CreateDesignResult, DesignSpecPadding } from '../types/messages';

// Font cache to avoid redundant loadFontAsync calls
const loadedFonts = new Set<string>();

/**
 * Build Figma nodes from a DesignSpecNode tree.
 * Entry point called from code.ts.
 */
export async function buildDesign(spec: DesignSpecNode): Promise<CreateDesignResult> {
  const errors: string[] = [];
  let totalNodes = 0;

  // Count total nodes for progress tracking
  function countNodes(node: DesignSpecNode): number {
    let count = 1;
    if (node.children) {
      for (const child of node.children) {
        count += countNodes(child);
      }
    }
    return count;
  }

  const total = countNodes(spec);

  // Build a variable lookup map: variableName → Variable
  const variableLookup = await buildVariableLookup();

  // Create the node tree
  const rootNode = await createNode(spec, variableLookup, errors, (stage) => {
    totalNodes++;
    sendToUI({
      type: 'DESIGN_CREATION_PROGRESS',
      stage,
      percent: Math.round((totalNodes / total) * 100),
    });
  });

  if (!rootNode) {
    return {
      nodeId: '',
      nodeName: '',
      childCount: 0,
      errors: errors.length > 0 ? errors : ['Failed to create root node'],
    };
  }

  // Position at viewport center
  const viewport = figma.viewport.center;
  rootNode.x = Math.round(viewport.x - (rootNode.width / 2));
  rootNode.y = Math.round(viewport.y - (rootNode.height / 2));

  // Select and zoom into view
  figma.currentPage.selection = [rootNode];
  figma.viewport.scrollAndZoomIntoView([rootNode]);

  const childCount = 'children' in rootNode ? (rootNode as FrameNode).children.length : 0;

  return {
    nodeId: rootNode.id,
    nodeName: rootNode.name,
    childCount,
    errors,
  };
}

/**
 * Recursively create a Figma node from a DesignSpecNode.
 */
async function createNode(
  spec: DesignSpecNode,
  variables: Map<string, Variable>,
  errors: string[],
  onProgress: (stage: string) => void,
): Promise<SceneNode | null> {
  const nodeName = spec.name ?? spec.type;
  onProgress(`Creating ${nodeName}...`);

  try {
    switch (spec.type) {
      case 'FRAME':
        return await createFrame(spec, variables, errors, onProgress);
      case 'TEXT':
        return await createText(spec, variables, errors);
      case 'RECTANGLE':
      case 'IMAGE':
      case 'VECTOR':
        return await createRectangle(spec, variables, errors);
      case 'ELLIPSE':
        return await createEllipse(spec, variables, errors);
      case 'COMPONENT':
        return await createComponent(spec, variables, errors, onProgress);
      case 'INSTANCE':
        return await createInstance(spec, variables, errors, onProgress);
      default:
        errors.push(`Unknown node type: ${spec.type}`);
        return null;
    }
  } catch (err) {
    const msg = `Error creating ${nodeName}: ${err instanceof Error ? err.message : 'Unknown'}`;
    logger.error(msg);
    errors.push(msg);
    return null;
  }
}

/**
 * Create a FRAME node with optional auto layout and children.
 */
async function createFrame(
  spec: DesignSpecNode,
  variables: Map<string, Variable>,
  errors: string[],
  onProgress: (stage: string) => void,
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = spec.name ?? 'Frame';

  // Apply auto layout first (before sizing, since it affects sizing behavior)
  if (spec.layoutMode && spec.layoutMode !== 'NONE') {
    applyAutoLayout(frame, spec);
  }

  // Set dimensions
  if (spec.width != null) frame.resize(spec.width, spec.height ?? spec.width);
  if (spec.height != null && spec.width != null) frame.resize(spec.width, spec.height);

  // Apply visual properties
  await applyFill(frame, spec.fill, variables, errors);
  await applyStroke(frame, spec.stroke, spec.strokeWidth, variables, errors);
  if (spec.opacity != null) frame.opacity = spec.opacity;
  if (spec.cornerRadius != null) frame.cornerRadius = spec.cornerRadius;

  // Create children
  if (spec.children) {
    for (const childSpec of spec.children) {
      const child = await createNode(childSpec, variables, errors, onProgress);
      if (child) {
        frame.appendChild(child);
      }
    }
  }

  // If using auto layout, set sizing mode to HUG after children are added
  if (spec.layoutMode && spec.layoutMode !== 'NONE') {
    if (spec.width == null) frame.primaryAxisSizingMode = 'AUTO';
    if (spec.height == null) frame.counterAxisSizingMode = 'AUTO';
  }

  return frame;
}

/**
 * Create a TEXT node.
 */
async function createText(
  spec: DesignSpecNode,
  variables: Map<string, Variable>,
  errors: string[],
): Promise<TextNode> {
  const text = figma.createText();
  text.name = spec.name ?? 'Text';

  // Load font before setting characters
  const fontFamily = spec.fontFamily ?? 'Inter';
  const fontStyle = fontWeightToStyle(spec.fontWeight ?? 400);
  await loadFont(fontFamily, fontStyle);

  text.fontName = { family: fontFamily, style: fontStyle };

  if (spec.characters != null) {
    text.characters = spec.characters;
  }

  if (spec.fontSize != null) text.fontSize = spec.fontSize;
  if (spec.letterSpacing != null) {
    text.letterSpacing = { value: spec.letterSpacing, unit: 'PIXELS' };
  }
  if (spec.lineHeight != null) {
    if (typeof spec.lineHeight === 'number') {
      text.lineHeight = { value: spec.lineHeight, unit: 'PIXELS' };
    }
  }
  if (spec.textAlignHorizontal != null) {
    text.textAlignHorizontal = spec.textAlignHorizontal;
  }

  // Apply fill (text color)
  await applyFill(text, spec.fill, variables, errors);

  if (spec.opacity != null) text.opacity = spec.opacity;

  // Set dimensions if provided
  if (spec.width != null) {
    text.resize(spec.width, text.height);
    text.textAutoResize = 'HEIGHT';
  }

  return text;
}

/**
 * Create a RECTANGLE node (also used for IMAGE and VECTOR placeholders).
 */
async function createRectangle(
  spec: DesignSpecNode,
  variables: Map<string, Variable>,
  errors: string[],
): Promise<RectangleNode> {
  const rect = figma.createRectangle();
  rect.name = spec.name ?? (spec.type === 'IMAGE' ? 'Image Placeholder' : spec.type === 'VECTOR' ? 'Vector Placeholder' : 'Rectangle');

  if (spec.width != null && spec.height != null) {
    rect.resize(spec.width, spec.height);
  } else if (spec.width != null) {
    rect.resize(spec.width, spec.width);
  }

  // IMAGE gets a gray placeholder fill by default
  if (spec.type === 'IMAGE' && !spec.fill) {
    rect.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
  } else {
    await applyFill(rect, spec.fill, variables, errors);
  }

  await applyStroke(rect, spec.stroke, spec.strokeWidth, variables, errors);

  if (spec.opacity != null) rect.opacity = spec.opacity;
  if (spec.cornerRadius != null) rect.cornerRadius = spec.cornerRadius;

  return rect;
}

/**
 * Create an ELLIPSE node.
 */
async function createEllipse(
  spec: DesignSpecNode,
  variables: Map<string, Variable>,
  errors: string[],
): Promise<EllipseNode> {
  const ellipse = figma.createEllipse();
  ellipse.name = spec.name ?? 'Ellipse';

  if (spec.width != null && spec.height != null) {
    ellipse.resize(spec.width, spec.height);
  } else if (spec.width != null) {
    ellipse.resize(spec.width, spec.width);
  }

  await applyFill(ellipse, spec.fill, variables, errors);
  await applyStroke(ellipse, spec.stroke, spec.strokeWidth, variables, errors);

  if (spec.opacity != null) ellipse.opacity = spec.opacity;

  return ellipse;
}

/**
 * Create a COMPONENT node (like a frame but as a reusable component).
 */
async function createComponent(
  spec: DesignSpecNode,
  variables: Map<string, Variable>,
  errors: string[],
  onProgress: (stage: string) => void,
): Promise<ComponentNode> {
  const component = figma.createComponent();
  component.name = spec.name ?? 'Component';

  if (spec.layoutMode && spec.layoutMode !== 'NONE') {
    applyAutoLayout(component, spec);
  }

  if (spec.width != null) component.resize(spec.width, spec.height ?? spec.width);
  if (spec.height != null && spec.width != null) component.resize(spec.width, spec.height);

  await applyFill(component, spec.fill, variables, errors);
  await applyStroke(component, spec.stroke, spec.strokeWidth, variables, errors);
  if (spec.opacity != null) component.opacity = spec.opacity;
  if (spec.cornerRadius != null) component.cornerRadius = spec.cornerRadius;

  if (spec.children) {
    for (const childSpec of spec.children) {
      const child = await createNode(childSpec, variables, errors, onProgress);
      if (child) {
        component.appendChild(child);
      }
    }
  }

  if (spec.layoutMode && spec.layoutMode !== 'NONE') {
    if (spec.width == null) component.primaryAxisSizingMode = 'AUTO';
    if (spec.height == null) component.counterAxisSizingMode = 'AUTO';
  }

  return component;
}

/**
 * Create an INSTANCE node from a component key.
 * Falls back to a frame if the component can't be imported.
 */
async function createInstance(
  spec: DesignSpecNode,
  variables: Map<string, Variable>,
  errors: string[],
  onProgress: (stage: string) => void,
): Promise<SceneNode> {
  if (spec.componentKey) {
    try {
      const component = await figma.importComponentByKeyAsync(spec.componentKey);
      const instance = component.createInstance();
      instance.name = spec.name ?? 'Instance';

      if (spec.width != null && spec.height != null) {
        instance.resize(spec.width, spec.height);
      }

      if (spec.opacity != null) instance.opacity = spec.opacity;

      return instance;
    } catch (err) {
      const msg = `Could not import component "${spec.componentKey}": ${err instanceof Error ? err.message : 'Unknown'}. Falling back to frame.`;
      logger.warn(msg);
      errors.push(msg);
    }
  }

  // Fallback: create a frame that looks like the instance
  return createFrame(
    { ...spec, type: 'FRAME', name: spec.name ?? 'Instance (fallback)' },
    variables,
    errors,
    onProgress,
  );
}

/**
 * Apply auto layout properties to a frame-like node.
 */
function applyAutoLayout(
  frame: FrameNode | ComponentNode,
  spec: DesignSpecNode,
): void {
  frame.layoutMode = spec.layoutMode === 'VERTICAL' ? 'VERTICAL' : 'HORIZONTAL';

  if (spec.padding) {
    const p = spec.padding as DesignSpecPadding;
    frame.paddingTop = p.top;
    frame.paddingRight = p.right;
    frame.paddingBottom = p.bottom;
    frame.paddingLeft = p.left;
  }

  if (spec.itemSpacing != null) {
    frame.itemSpacing = spec.itemSpacing;
  }

  if (spec.primaryAxisAlignItems) {
    frame.primaryAxisAlignItems = spec.primaryAxisAlignItems;
  }

  if (spec.counterAxisAlignItems) {
    frame.counterAxisAlignItems = spec.counterAxisAlignItems;
  }

  // Default to AUTO sizing (hug contents)
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
}

/**
 * Apply a fill color to a node, with token variable binding support.
 *
 * If `fill` starts with "$", it's a token reference:
 *   "$color.primary" → strips "$", converts dots to slashes → "color/primary"
 *   → looks up variable → binds via setBoundVariableForPaint()
 *
 * Otherwise, parse as hex color → solid fill.
 */
async function applyFill(
  node: SceneNode,
  fill: string | undefined,
  variables: Map<string, Variable>,
  errors: string[],
): Promise<void> {
  if (!fill) return;
  if (!('fills' in node)) return;

  const paintNode = node as GeometryMixin & SceneNode;

  if (fill.startsWith('$')) {
    // Token reference
    const tokenPath = fill.slice(1); // Remove "$"
    const variableName = tokenPath.replace(/\./g, '/');
    const variable = variables.get(variableName);

    if (variable && variable.resolvedType === 'COLOR') {
      try {
        const solidPaint: SolidPaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
        const paintWithVar = figma.variables.setBoundVariableForPaint(
          solidPaint,
          'color',
          variable,
        );
        paintNode.fills = [paintWithVar];
        return;
      } catch (err) {
        errors.push(`Could not bind variable "${variableName}": ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    } else if (variable) {
      errors.push(`Variable "${variableName}" is type ${variable.resolvedType}, not COLOR`);
    } else {
      errors.push(`Token "${tokenPath}" not found as variable "${variableName}"`);
    }

    // Fall through — try to parse as hex in case it was a malformed token
    return;
  }

  // Hex color
  const color = hexToRgb(fill);
  if (color) {
    paintNode.fills = [{ type: 'SOLID', color }];
  }
}

/**
 * Apply a stroke color to a node, with token variable binding support.
 */
async function applyStroke(
  node: SceneNode,
  stroke: string | undefined,
  strokeWidth: number | undefined,
  variables: Map<string, Variable>,
  errors: string[],
): Promise<void> {
  if (!stroke) return;
  if (!('strokes' in node)) return;

  const paintNode = node as GeometryMixin & SceneNode;

  if (stroke.startsWith('$')) {
    const tokenPath = stroke.slice(1);
    const variableName = tokenPath.replace(/\./g, '/');
    const variable = variables.get(variableName);

    if (variable && variable.resolvedType === 'COLOR') {
      try {
        const solidPaint: SolidPaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
        const paintWithVar = figma.variables.setBoundVariableForPaint(
          solidPaint,
          'color',
          variable,
        );
        paintNode.strokes = [paintWithVar];
        if (strokeWidth != null) paintNode.strokeWeight = strokeWidth;
        return;
      } catch (err) {
        errors.push(`Could not bind stroke variable "${variableName}": ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
    return;
  }

  // Hex color
  const color = hexToRgb(stroke);
  if (color) {
    paintNode.strokes = [{ type: 'SOLID', color }];
    if (strokeWidth != null) paintNode.strokeWeight = strokeWidth;
  }
}

/**
 * Load a font asynchronously with caching and fallback.
 */
async function loadFont(family: string, style: string): Promise<void> {
  const key = `${family}:${style}`;
  if (loadedFonts.has(key)) return;

  try {
    await figma.loadFontAsync({ family, style });
    loadedFonts.add(key);
  } catch {
    // Fallback to Inter Regular
    const fallbackKey = 'Inter:Regular';
    if (!loadedFonts.has(fallbackKey)) {
      try {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        loadedFonts.add(fallbackKey);
      } catch (err) {
        logger.error('Failed to load fallback font:', err);
      }
    }
    logger.warn(`Font "${family} ${style}" not available, falling back to Inter Regular`);
  }
}

/**
 * Map numeric font weight to Figma font style name.
 */
function fontWeightToStyle(weight: number): string {
  if (weight <= 100) return 'Thin';
  if (weight <= 200) return 'ExtraLight';
  if (weight <= 300) return 'Light';
  if (weight <= 400) return 'Regular';
  if (weight <= 500) return 'Medium';
  if (weight <= 600) return 'SemiBold';
  if (weight <= 700) return 'Bold';
  if (weight <= 800) return 'ExtraBold';
  return 'Black';
}

/**
 * Parse a hex color string to Figma RGB (0-1 range).
 */
function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6 && cleaned.length !== 3) return null;

  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
  } else {
    r = parseInt(cleaned.substring(0, 2), 16) / 255;
    g = parseInt(cleaned.substring(2, 4), 16) / 255;
    b = parseInt(cleaned.substring(4, 6), 16) / 255;
  }

  if ([r, g, b].some(isNaN)) return null;

  return { r, g, b };
}
