import type { DesignTokensDocument, DTCGToken } from '../types/messages';

/**
 * Flatten a DesignTokensDocument into an array of human-readable token lines.
 * Format: "$dot.path: value (type)"
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
      lines.push(`$${path}: ${displayValue} (${token.$type})`);
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
export function buildSystemPrompt(tokenLines: string[]): string {
  const tokenContext =
    tokenLines.length > 0
      ? `\n\nAvailable Design Tokens (reference these with $ prefix in fill/stroke values):\n${tokenLines.join('\n')}`
      : '\n\nNo design tokens are currently loaded. Use raw hex colors (e.g. "#0D99FF") for fill/stroke values.';

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
  "characters": "string (required for TEXT nodes — the actual text content)",
  "fontSize": number (optional, pixels, for TEXT nodes),
  "fontWeight": number (optional, 100-900, for TEXT nodes),
  "fontFamily": "string (optional, font family name, for TEXT nodes)",
  "textAlignHorizontal": "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED" (optional),
  "lineHeight": number (optional, pixels, for TEXT nodes),
  "letterSpacing": number (optional, pixels, for TEXT nodes),
  "children": [ ...nested nodes ] (optional, array of child nodes)
}

Rules:
1. The root node should typically be a FRAME with layoutMode set.
2. Use auto layout (layoutMode + padding + itemSpacing) for proper spacing.
3. TEXT nodes MUST have a "characters" field with the text content.
4. Use token references (starting with $) for colors when tokens are available.
5. Token references use dot notation: "$color.primary", "$color.bg.secondary".
6. If no matching token exists, use hex colors directly.
7. Keep designs clean and well-structured with proper naming.
8. Use realistic dimensions (e.g., buttons 120-200w x 36-48h, cards 280-360w).
9. Nest children logically — e.g., a card has a header frame, content frame, etc.
10. IMAGE type creates a gray placeholder rectangle. VECTOR creates a placeholder shape.
${tokenContext}`;
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
      ? `\n\nAvailable Design Tokens (reference these with $ prefix in fill/stroke values):\n${tokenLines.join('\n')}`
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
  "characters": "string (for TEXT nodes)",
  "fontSize": number, "fontWeight": number, "fontFamily": "string",
  "textAlignHorizontal": "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED",
  "lineHeight": number, "letterSpacing": number,
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
      ? `\n\nThe user's design system has the following tokens:\n${tokenLines.slice(0, 200).join('\n')}${tokenLines.length > 200 ? `\n... and ${tokenLines.length - 200} more tokens` : ''}`
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
