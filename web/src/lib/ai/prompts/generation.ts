/**
 * Builds the Claude API prompt for design system generation.
 */

import type { OnboardingInput, VibeParameters } from '../types';

const SYSTEM_PROMPT = `You are a world-class UI/UX design system architect. You create cohesive, production-ready design systems for software products.

You will be given a product description and design preferences. Generate a complete design system specification.

CRITICAL: Respond with ONLY a valid JSON object matching the exact schema provided. No markdown, no explanation, no code fences — just the raw JSON.`;

export function buildGenerationPrompt(
  input: OnboardingInput,
  vibeParams: VibeParameters,
): { system: string; user: string } {
  const vibeDescription: Record<string, string> = {
    'clean-minimal': 'Clean, minimal, focused — generous whitespace, subtle shadows, system fonts. Think Linear or Notion.',
    'professional-trustworthy': 'Professional, trustworthy, structured — deep blues/grays, sharp typography, structured layouts. Think Stripe or Mercury.',
    'warm-friendly': 'Warm, friendly, approachable — warm palette, rounded corners, friendly fonts, playful accents. Think Slack or Asana.',
    'bold-energetic': 'Bold, energetic, high-impact — high contrast, strong colors, large typography. Think Vercel or Framer.',
    'soft-approachable': 'Soft, approachable, gentle — muted pastels, rounded everything, gentle gradients, airy spacing. Think Calm or Headspace.',
    'custom': input.customVibe || 'Custom style — use your best judgment based on the product description.',
  };

  const availableFonts = [
    'Inter', 'system-ui', 'IBM Plex Sans', 'Nunito', 'Poppins',
    'Space Grotesk', 'Source Sans 3', 'DM Sans', 'Geist',
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway',
  ];

  const userMessage = `Create a design system for the following product:

## Product
Description: ${input.productDescription}
${input.brandReferences ? `Brand references the user admires: ${input.brandReferences}` : ''}

## Design Direction
Vibe: ${input.vibe} — ${vibeDescription[input.vibe]}
${input.primaryColor ? `User's chosen primary color: ${input.primaryColor}` : 'Choose the best primary color for this product and vibe.'}

## Defaults (use these as starting points, adjust based on the product)
Suggested body font: ${vibeParams.fontFamily}
Suggested heading font: ${vibeParams.headingFontFamily}
Suggested type scale: ${vibeParams.typeScale}
Suggested base size: ${vibeParams.baseSize}px
Suggested palette mode: ${vibeParams.paletteMode}
Suggested border radius: ${vibeParams.borderRadiusPreset}

## Available Options
Font families (pick from this list ONLY): ${availableFonts.join(', ')}
Type scales: minor-third, major-third, perfect-fourth, augmented-fourth
Palette modes: complementary, analogous, triadic, split-complementary
Border radius presets: none, small, medium, large

## Required JSON Schema
{
  "name": "string — a creative, memorable name for this design system (2-4 words)",
  "philosophy": "string — 2-3 sentence design philosophy explaining the aesthetic rationale and why it fits this product",
  "principles": ["string — 3-5 short design principles, e.g. 'Content-first', 'Calm over flashy'"],
  "primaryColor": "#hex — the primary brand color",
  "paletteMode": "one of: complementary, analogous, triadic, split-complementary",
  "fontFamily": "string — body font from the available list",
  "headingFontFamily": "string — heading font from the available list",
  "typeScale": "one of: minor-third, major-third, perfect-fourth, augmented-fourth",
  "baseSize": number between 14 and 18,
  "fontWeights": [array of numbers, e.g. [400, 500, 600, 700]],
  "borderRadius": "one of: none, small, medium, large",
  "shadowIntensity": "one of: subtle, medium, pronounced",
  "navigationStyle": "one of: sidebar, topbar, hybrid",
  "contentDensity": "one of: compact, comfortable, spacious",
  "suggestedLayouts": ["array of recommended page layouts, e.g. 'sidebar-dashboard', 'settings-form', 'auth-centered']
}`;

  return { system: SYSTEM_PROMPT, user: userMessage };
}
