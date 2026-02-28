/**
 * Handles iterative refinement of an existing design system via Gemini AI.
 */

import type { GeneratedDesignSystem, RefinementResult } from './types';
import { buildRefinementPrompt } from './prompts/refinement';
import { callGemini } from './gemini-client';
import { buildDesignSystemConfigFromInput, RADIUS_PRESETS } from '../design-system/config-mapper';
import type { DesignSystemInput } from '../design-system/config-mapper';
import { buildTokenDocument, generateDocumentation } from '../design-system/token-builder';
import { ALL_COMPONENTS } from '../design-system/domain-presets';

function parseResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse refinement response as JSON');
  }
}

const SHADOW_PRESETS: Record<string, { sm: string; md: string; lg: string; xl: string }> = {
  subtle: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    lg: '0 8px 24px rgba(0,0,0,0.08)',
    xl: '0 16px 40px rgba(0,0,0,0.1)',
  },
  medium: {
    sm: '0 1px 3px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 12px 32px rgba(0,0,0,0.1)',
    xl: '0 24px 48px rgba(0,0,0,0.12)',
  },
  pronounced: {
    sm: '0 2px 4px rgba(0,0,0,0.08)',
    md: '0 6px 16px rgba(0,0,0,0.12)',
    lg: '0 16px 40px rgba(0,0,0,0.16)',
    xl: '0 28px 56px rgba(0,0,0,0.2)',
  },
};

/** Detect the radius preset name from current radius values */
function detectCurrentRadius(radius: { sm: number; md: number; lg: number }): string {
  for (const [name, preset] of Object.entries(RADIUS_PRESETS)) {
    if (preset.sm === radius.sm && preset.md === radius.md && preset.lg === radius.lg) {
      return name;
    }
  }
  return 'medium';
}

/** Detect the shadow intensity preset name from current shadow values */
function detectCurrentShadowIntensity(shadows: { sm: string; md: string; lg: string; xl: string }): string {
  for (const [name, preset] of Object.entries(SHADOW_PRESETS)) {
    if (preset.sm === shadows.sm && preset.md === shadows.md) {
      return name;
    }
  }
  return 'medium';
}

export async function refineDesignSystem(
  currentSystem: GeneratedDesignSystem,
  instruction: string,
): Promise<RefinementResult> {
  // 1. Build the refinement prompt
  const { system, user } = buildRefinementPrompt(currentSystem, instruction);

  // 2. Call Gemini API
  const responseText = await callGemini(system, user);

  // 3. Parse the partial response
  const changes = parseResponse(responseText);
  const explanation = (changes.explanation as string) || 'Design system updated.';
  delete changes.explanation;

  // 4. Apply changes to current config
  const current = currentSystem.config;
  const modified: Array<{ field: string; old: string; new: string }> = [];

  const primaryColor = (changes.primaryColor as string) || current.color.primaryColor;
  if (changes.primaryColor) {
    modified.push({ field: 'primaryColor', old: current.color.primaryColor, new: primaryColor });
  }

  const paletteMode = (changes.paletteMode as string) || current.color.paletteMode;
  if (changes.paletteMode) {
    modified.push({ field: 'paletteMode', old: current.color.paletteMode, new: paletteMode });
  }

  const fontFamily = (changes.fontFamily as string) || current.typography.fontFamily;
  if (changes.fontFamily) {
    modified.push({ field: 'fontFamily', old: current.typography.fontFamily, new: fontFamily });
  }

  const headingFontFamily = (changes.headingFontFamily as string) || current.typography.headingFontFamily;
  if (changes.headingFontFamily) {
    modified.push({ field: 'headingFontFamily', old: current.typography.headingFontFamily, new: headingFontFamily });
  }

  const typeScale = (changes.typeScale as string) || current.typography.scale;
  if (changes.typeScale) {
    modified.push({ field: 'typeScale', old: current.typography.scale, new: typeScale });
  }

  const baseSize = (changes.baseSize as number) || current.typography.baseSize;
  const fontWeights = (changes.fontWeights as number[]) || current.typography.weights;
  // Detect current borderRadius/shadowIntensity from the existing system
  const currentBorderRadius = detectCurrentRadius(current.radius);
  const currentShadowIntensity = detectCurrentShadowIntensity(current.shadows);

  const borderRadius = (changes.borderRadius as string) || currentBorderRadius;
  const shadowIntensity = (changes.shadowIntensity as string) || currentShadowIntensity;

  if (changes.borderRadius) {
    modified.push({ field: 'borderRadius', old: currentBorderRadius, new: borderRadius });
  }

  const name = (changes.name as string) || currentSystem.name;
  const philosophy = (changes.philosophy as string) || currentSystem.philosophy;
  const principles = (changes.principles as string[]) || currentSystem.principles;

  // 5. Rebuild the design system with merged config
  const radius = RADIUS_PRESETS[borderRadius] || RADIUS_PRESETS.medium;
  const shadows = SHADOW_PRESETS[shadowIntensity] || SHADOW_PRESETS.medium;

  const designSystemInput: DesignSystemInput = {
    name,
    source: 'scratch',
    domain: current.domain,
    themeConfig: {
      accentColor: primaryColor,
      grayColor: 'auto',
      paletteMode,
      radius: borderRadius,
      scaling: '100',
    },
    typographyConfig: {
      fontFamily,
      headingFont: headingFontFamily,
      baseSize,
      scale: typeScale,
      weights: fontWeights,
    },
    spacingConfig: current.spacing,
    componentConfig: { selectedComponents: [...ALL_COMPONENTS] },
  };

  const config = buildDesignSystemConfigFromInput(designSystemInput, name);
  config.shadows = shadows;

  const tokensDocument = buildTokenDocument(config);
  const documentation = generateDocumentation(config);

  return {
    designSystem: {
      name,
      philosophy,
      principles,
      config: {
        domain: current.domain,
        color: { primaryColor, paletteMode },
        typography: { fontFamily, headingFontFamily, baseSize, scale: typeScale, weights: fontWeights },
        spacing: current.spacing,
        radius: config.radius,
        shadows: config.shadows,
        components: config.components,
      },
      tokensDocument,
      documentation: documentation as unknown as Record<string, unknown>,
      layoutConfig: currentSystem.layoutConfig,
    },
    changes: {
      summary: explanation,
      modified,
    },
  };
}
