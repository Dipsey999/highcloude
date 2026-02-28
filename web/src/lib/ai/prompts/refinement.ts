/**
 * Builds the AI prompt for iterative design system refinement.
 */

import type { GeneratedDesignSystem } from '../types';

const SYSTEM_PROMPT = `You are refining an existing design system based on user feedback. You will be given the current configuration and a natural language instruction.

Make targeted changes that address the user's feedback while maintaining overall consistency. Only change what the user asked for.

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no code fences. Include ONLY the fields that changed, plus an "explanation" field describing what you changed and why.`;

export function buildRefinementPrompt(
  currentSystem: GeneratedDesignSystem,
  instruction: string,
): { system: string; user: string } {
  const currentConfig = {
    name: currentSystem.name,
    primaryColor: currentSystem.config.color.primaryColor,
    paletteMode: currentSystem.config.color.paletteMode,
    fontFamily: currentSystem.config.typography.fontFamily,
    headingFontFamily: currentSystem.config.typography.headingFontFamily,
    typeScale: currentSystem.config.typography.scale,
    baseSize: currentSystem.config.typography.baseSize,
    fontWeights: currentSystem.config.typography.weights,
    borderRadius: radiusToPreset(currentSystem.config.radius),
    shadowIntensity: 'medium',
    philosophy: currentSystem.philosophy,
    principles: currentSystem.principles,
  };

  const availableFonts = [
    'Inter', 'system-ui', 'IBM Plex Sans', 'Nunito', 'Poppins',
    'Space Grotesk', 'Source Sans 3', 'DM Sans', 'Geist',
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway',
  ];

  const userMessage = `## Current Design System
${JSON.stringify(currentConfig, null, 2)}

## User's Request
"${instruction}"

## Available Options
Fonts (pick from this list ONLY): ${availableFonts.join(', ')}
Type scales: minor-third, major-third, perfect-fourth, augmented-fourth
Palette modes: complementary, analogous, triadic, split-complementary
Border radius presets: none, small, medium, large

## Return Format
Return a JSON object with ONLY the fields that changed from the current config above, plus:
- "explanation": "string describing what you changed and why"

Example: if the user says "make it warmer", you might return:
{"primaryColor": "#f97316", "explanation": "Shifted the primary color from cool indigo to a warm orange tone to create a warmer feel."}`;

  return { system: SYSTEM_PROMPT, user: userMessage };
}

function radiusToPreset(radius: { sm: number; md: number }): string {
  if (radius.md === 0) return 'none';
  if (radius.md <= 4) return 'small';
  if (radius.md <= 8) return 'medium';
  return 'large';
}
