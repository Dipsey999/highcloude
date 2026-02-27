import type { DesignTokensDocument, DTCGToken, FigmaTokenExtension, ComponentPattern } from '../types/messages';
import { summarizePatternStructure } from '../types/messages';

/**
 * Flatten a DesignTokensDocument into an array of human-readable token lines.
 * Enhanced format: "$dot.path: value (type) — description [SCOPES]"
 * These are injected into the system prompt so Claude can reference them.
 */
export function flattenTokensForPrompt(doc: DesignTokensDocument): string[] {
  const lines: string[] = [];

  function walk(node: unknown, path: string): void {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;

    // Leaf token: has $type and $value
    if ('$type' in obj && '$value' in obj) {
      const token = obj as unknown as DTCGToken;
      const displayValue = formatValueForPrompt(token.$value, token.$type);

      // Build enhanced line with description and scopes
      let line = `$${path}: ${displayValue} (${token.$type})`;

      if (token.$description) {
        line += ` — ${token.$description}`;
      }

      const figmaExt = token.$extensions?.figma;
      if (figmaExt?.scopes && figmaExt.scopes.length > 0) {
        line += ` [${figmaExt.scopes.join(', ')}]`;
      }

      lines.push(line);
      return;
    }

    for (const key of Object.keys(obj)) {
      if (key === 'metadata') continue;
      const childPath = path ? `${path}.${key}` : key;
      walk(obj[key], childPath);
    }
  }

  walk(doc, '');
  return lines;
}

/**
 * Group flattened token lines by semantic category for better Claude context.
 * Returns a formatted string with sections for colors, dimensions, typography, etc.
 */
export function groupTokensForPrompt(lines: string[]): string {
  const categories: Record<string, string[]> = {
    'Colors (fills, strokes, backgrounds, text colors)': [],
    'Dimensions (spacing, sizing, padding, radius)': [],
    'Typography (fonts, text styles)': [],
    'Shadows & Effects': [],
    'Other': [],
  };

  for (const line of lines) {
    if (line.includes('(color)')) {
      categories['Colors (fills, strokes, backgrounds, text colors)'].push(line);
    } else if (line.includes('(dimension)')) {
      categories['Dimensions (spacing, sizing, padding, radius)'].push(line);
    } else if (line.includes('(typography)')) {
      categories['Typography (fonts, text styles)'].push(line);
    } else if (line.includes('(shadow)')) {
      categories['Shadows & Effects'].push(line);
    } else {
      categories['Other'].push(line);
    }
  }

  const sections: string[] = [];
  for (const [category, tokens] of Object.entries(categories)) {
    if (tokens.length > 0) {
      sections.push(`\n### ${category}\n${tokens.join('\n')}`);
    }
  }

  return sections.join('\n');
}

/**
 * Format a token value for display in the prompt context.
 */
function formatValueForPrompt(value: unknown, type: string): string {
  if (type === 'color' && typeof value === 'string') return value;
  if (type === 'dimension' && typeof value === 'string') return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Build the system prompt for Claude design generation.
 * Includes the JSON schema, rules, and injected design token list.
 */
export function buildSystemPrompt(tokenLines: string[], patterns?: ComponentPattern[]): string {
  const tokenContext =
    tokenLines.length > 0
      ? `\n\nAvailable Design Tokens (reference these with $ prefix in fill/stroke values):\n${groupTokensForPrompt(tokenLines)}\n\nTotal: ${tokenLines.length} tokens available.`
      : '\n\nNo design tokens are currently loaded. Use raw hex colors (e.g. "#0D99FF") for fill/stroke values.';

  const patternContext = patterns && patterns.length > 0
    ? `\n\nAvailable Component Patterns (reference these structures for consistency):\n${patterns.map((p) => `- ${p.name} (${p.category}, ${p.dimensions.width}x${p.dimensions.height}): ${summarizePatternStructure(p.spec)}`).join('\n')}`
    : '';

  return `You are a Figma design assistant. You generate structured JSON design specs that will be converted into Figma nodes.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no code fences — just pure JSON.

JSON Schema for your response:
{
  "type": "FRAME" | "TEXT" | "RECTANGLE" | "ELLIPSE" | "COMPONENT" | "INSTANCE" | "IMAGE" | "VECTOR",
  "name": "string (optional, descriptive layer name)",
  "width": number (optional, pixels),
  "height": number (optional, pixels),
  "fill": "string (optional, hex color like '#FF0000' or token ref like '$color.primary')",
  "stroke": "string (optional, hex color or token ref)",
  "strokeWidth": number (optional, pixels),
  "opacity": number (optional, 0-1),
  "cornerRadius": number (optional, pixels),
  "layoutMode": "HORIZONTAL" | "VERTICAL" | "NONE" (optional, auto layout direction),
  "padding": { "top": number, "right": number, "bottom": number, "left": number } (optional),
  "itemSpacing": number (optional, gap between children in auto layout),
  "primaryAxisAlignItems": "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN" (optional),
  "counterAxisAlignItems": "MIN" | "CENTER" | "MAX" (optional),
  "primaryAxisSizingMode": "FIXED" | "AUTO" (optional, default AUTO — set FIXED with explicit width),
  "counterAxisSizingMode": "FIXED" | "AUTO" (optional, default AUTO — set FIXED with explicit height),
  "layoutGrow": number (optional, 0 or 1 — like flex-grow, makes child fill available space),
  "layoutAlign": "STRETCH" | "INHERIT" (optional, stretch child across counter axis),
  "clipsContent": boolean (optional, clip overflowing children),
  "characters": "string (required for TEXT nodes — the actual text content)",
  "fontSize": number (optional, pixels, for TEXT nodes),
  "fontWeight": number (optional, 100-900, for TEXT nodes),
  "fontFamily": "string (optional, font family name, for TEXT nodes)",
  "textAlignHorizontal": "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED" (optional),
  "textAutoResize": "WIDTH_AND_HEIGHT" | "HEIGHT" | "NONE" | "TRUNCATE" (optional, for TEXT nodes),
  "textDecoration": "NONE" | "UNDERLINE" | "STRIKETHROUGH" (optional, for TEXT nodes),
  "lineHeight": number (optional, pixels, for TEXT nodes),
  "letterSpacing": number (optional, pixels, for TEXT nodes),
  "effects": [{ "type": "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR", "color": "#hex", "offsetX": number, "offsetY": number, "radius": number, "spread": number }] (optional),
  "fillGradient": { "type": "LINEAR" | "RADIAL", "stops": [{ "position": 0-1, "color": "#hex" }], "angle": number } (optional, overrides fill),
  "children": [ ...nested nodes ] (optional, array of child nodes)
}

Rules:
1. The root node should typically be a FRAME with layoutMode set.
2. Use auto layout (layoutMode + padding + itemSpacing) for proper spacing — NEVER use absolute positioning.
3. TEXT nodes MUST have a "characters" field with the text content.
4. Use token references (starting with $) for colors when tokens are available.
5. Token references use dot notation: "$color.primary", "$color.bg.secondary".
6. If no matching token exists, use hex colors directly.
7. Keep designs clean and well-structured with proper naming — use descriptive names like "Profile Card", "Submit Button", not "Frame" or "Rectangle".
8. Use realistic dimensions (e.g., buttons 120-200w x 36-48h, cards 280-360w).
9. Nest children logically — e.g., a card has a header frame, content frame, etc.
10. IMAGE type creates a gray placeholder rectangle. VECTOR creates a placeholder shape.
11. Use scoped tokens appropriately: tokens marked [FRAME_FILL, SHAPE_FILL] for backgrounds, [TEXT_CONTENT] for text colors, [STROKE_COLOR] for borders.
12. Prefer semantic tokens (e.g., $color.bg.primary, $color.text.secondary) over primitive tokens (e.g., $color.blue.500) when both are available.
13. Typography tokens should be applied as complete sets — match fontSize, fontWeight, lineHeight, and fontFamily together from the same typography group.
14. Use layoutGrow: 1 for elements that should fill available space in auto layout containers.
15. Use effects for elevation — cards and modals should have subtle DROP_SHADOW for depth.
16. When component patterns are available, follow their structural conventions (layout direction, nesting, naming).
${tokenContext}${patternContext}`;
}

/**
 * Build the user message for a design generation request.
 */
export function buildUserMessage(prompt: string): string {
  return `Design request: ${prompt}\n\nRespond with ONLY the JSON design spec. No other text.`;
}

/**
 * Build the system prompt for reverse sync (modifying an existing design).
 * Includes the exported JSON and available tokens.
 */
export function buildReverseSyncSystemPrompt(
  exportedJson: string,
  tokenLines: string[],
): string {
  const tokenContext =
    tokenLines.length > 0
      ? `\n\nAvailable Design Tokens (reference these with $ prefix in fill/stroke values):\n${groupTokensForPrompt(tokenLines)}`
      : '\n\nNo design tokens are currently loaded. Use raw hex colors.';

  return `You are a Figma design assistant. You modify existing design structures and return updated JSON specs.

IMPORTANT: You MUST respond with ONLY a valid JSON object that follows the same schema as the input. No markdown, no explanation, no code fences — just pure JSON.

The user has exported a Figma selection as structured JSON. You will receive modification instructions and must return the COMPLETE updated JSON, preserving any properties you do not change.

JSON Schema (same as the input):
{
  "type": "FRAME" | "TEXT" | "RECTANGLE" | "ELLIPSE" | "COMPONENT" | "INSTANCE" | "IMAGE" | "VECTOR",
  "name": "string",
  "width": number, "height": number, "x": number, "y": number,
  "fill": "string (hex or $token.ref)",
  "stroke": "string (hex or $token.ref)",
  "strokeWidth": number, "opacity": number, "cornerRadius": number,
  "layoutMode": "HORIZONTAL" | "VERTICAL" | "NONE",
  "padding": { "top": number, "right": number, "bottom": number, "left": number },
  "itemSpacing": number,
  "primaryAxisAlignItems": "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN",
  "counterAxisAlignItems": "MIN" | "CENTER" | "MAX",
  "primaryAxisSizingMode": "FIXED" | "AUTO",
  "counterAxisSizingMode": "FIXED" | "AUTO",
  "layoutGrow": number, "layoutAlign": "STRETCH" | "INHERIT",
  "clipsContent": boolean,
  "characters": "string (for TEXT nodes)",
  "fontSize": number, "fontWeight": number, "fontFamily": "string",
  "textAlignHorizontal": "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED",
  "textAutoResize": "WIDTH_AND_HEIGHT" | "HEIGHT" | "NONE" | "TRUNCATE",
  "textDecoration": "NONE" | "UNDERLINE" | "STRIKETHROUGH",
  "lineHeight": number, "letterSpacing": number,
  "effects": [{ "type": "DROP_SHADOW" | ..., "color": "#hex", "offsetX": n, "offsetY": n, "radius": n, "spread": n }],
  "children": [ ...nested nodes ]
}

Rules:
1. Return the FULL JSON tree — not just the changed parts.
2. You may add, remove, or reorder children.
3. You may change any property.
4. Do NOT include "nodeId" or "boundVariables" in your output — those are read-only metadata from the export.
5. Use token references (starting with $) for colors when tokens are available.
6. Keep the structure clean and well-organized.

Current design export:
${exportedJson}
${tokenContext}`;
}

/**
 * Build the user message for a reverse sync modification request.
 */
export function buildReverseSyncUserMessage(prompt: string): string {
  return `Modification request: ${prompt}\n\nReturn the COMPLETE updated JSON design spec. No other text.`;
}

/**
 * Build the system prompt for Claude Chat panel.
 * Acts as a design system consultant with knowledge of the user's tokens.
 */
export function buildChatSystemPrompt(
  tokenLines: string[],
  selectionContext?: string,
): string {
  const tokenContext =
    tokenLines.length > 0
      ? `\n\nThe user's design system has the following tokens:\n${groupTokensForPrompt(tokenLines.slice(0, 200))}${tokenLines.length > 200 ? `\n... and ${tokenLines.length - 200} more tokens` : ''}`
      : '\n\nNo design tokens are currently loaded in the user\'s system.';

  const selContext = selectionContext
    ? `\n\nCurrently selected element:\n${selectionContext}`
    : '';

  return `You are a friendly design system consultant working inside a Figma plugin called "Claude Bridge". You help designers and developers with:

1. Design token usage — when to use which token, naming conventions, best practices
2. Color palette decisions — contrast ratios, accessibility, semantic naming
3. Typography scales — harmonious type systems, readability
4. Spacing and layout — consistent grid systems, component spacing
5. Component structure — how to break down complex UI into reusable pieces
6. W3C Design Token Community Group (DTCG) format — $type, $value, $description conventions
7. Design system maintenance — keeping tokens organized, documenting decisions

Keep responses concise and practical. Use specific token names from the user's system when relevant. If asked to generate code or JSON, format it clearly.
${tokenContext}${selContext}`;
}

/**
 * Build a system prompt for iterative refinement of an existing design.
 * Takes the previous spec and conversation history as context.
 */
export function buildRefinementPrompt(
  previousSpec: string,
  tokenLines: string[],
): string {
  const tokenContext =
    tokenLines.length > 0
      ? `\n\nAvailable Design Tokens:\n${groupTokensForPrompt(tokenLines)}`
      : '';

  return `You are a Figma design assistant performing iterative refinement on an existing design.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no code fences — just pure JSON.

You previously generated this design spec:
${previousSpec}

The user wants to refine this design. Apply their changes to the existing spec and return the COMPLETE updated JSON. Preserve all unchanged parts of the design.

Rules:
1. Return the FULL updated JSON tree — not just the changed parts.
2. Preserve the existing structure and token references unless the user asks to change them.
3. Use token references ($token.path) for colors when tokens are available.
4. Keep auto layout intact unless the user requests layout changes.
5. Maintain descriptive node names.
${tokenContext}`;
}

/**
 * Build a user message for the refinement flow.
 */
export function buildRefinementUserMessage(prompt: string): string {
  return `Refinement request: ${prompt}\n\nReturn the COMPLETE updated JSON design spec. No other text.`;
}

/**
 * Build a system prompt for reference-based generation.
 * Uses an exported selection as a structural reference for generating a new design.
 */
export function buildReferenceBasedPrompt(
  referenceSpec: string,
  tokenLines: string[],
): string {
  const tokenContext =
    tokenLines.length > 0
      ? `\n\nAvailable Design Tokens:\n${groupTokensForPrompt(tokenLines)}`
      : '';

  return `You are a Figma design assistant. You generate new designs inspired by a reference component's structure.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no code fences — just pure JSON.

Here is a reference component from the user's design system:
${referenceSpec}

The user wants a NEW component that follows similar structural patterns (layout hierarchy, spacing conventions, naming style) but adapted for a different purpose. Use the reference as inspiration, not as a template to copy exactly.

Rules:
1. Mirror the reference's layout approach (auto layout direction, spacing values, padding patterns).
2. Use similar naming conventions as the reference.
3. Adapt dimensions and content for the new purpose.
4. Use token references ($token.path) for colors when tokens are available.
5. Keep the same level of detail and polish as the reference.
${tokenContext}`;
}

/**
 * Build a system prompt for generating design variants.
 * Instructs Claude to generate multiple alternatives.
 */
export function buildVariantsPrompt(
  tokenLines: string[],
  count: number,
): string {
  const tokenContext =
    tokenLines.length > 0
      ? `\n\nAvailable Design Tokens:\n${groupTokensForPrompt(tokenLines)}`
      : '';

  return `You are a Figma design assistant generating ${count} design VARIANTS for the same prompt.

IMPORTANT: You MUST respond with ONLY a valid JSON array containing exactly ${count} design spec objects. No markdown, no explanation, no code fences — just pure JSON array.

Each variant should be a complete DesignSpecNode with:
- Same overall purpose but different visual approaches
- Different layout hierarchies, spacing, or visual emphasis
- Same token references but potentially different token choices for variety
- All variants should be well-structured and production-ready

Response format: [{ variant1 }, { variant2 }, ...]

Rules:
1. Each variant must be a complete, standalone design spec.
2. Vary the layout approach: one might be horizontal, another vertical, etc.
3. Vary the visual hierarchy: different font sizes, spacing, emphasis.
4. All variants must use auto layout and proper nesting.
5. Use token references ($token.path) for colors when tokens are available.
${tokenContext}`;
}
