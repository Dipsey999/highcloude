/**
 * Orchestrates the full AI design system generation pipeline.
 *
 * Flow: OnboardingInput → vibe mapping → Gemini API → parse response
 *       → build DesignSystemConfig → buildTokenDocument() → GeneratedDesignSystem
 */

import type { OnboardingInput, AIDesignDecisions, GeneratedDesignSystem } from './types';
import { mapVibeToParameters, getVibeDefaultColor } from './vibe-mapper';
import { buildGenerationPrompt } from './prompts/generation';
import { callGemini } from './gemini-client';
import { buildDesignSystemConfigFromInput, RADIUS_PRESETS } from '../design-system/config-mapper';
import type { DesignSystemInput } from '../design-system/config-mapper';
import { buildTokenDocument, generateDocumentation } from '../design-system/token-builder';
import { DOMAIN_PRESETS } from '../design-system/domain-presets';
import type { ComponentType } from '../design-system/domain-presets';
import { ALL_COMPONENTS } from '../design-system/domain-presets';

// ── JSON parsing with cleanup ──

function parseAIResponse(text: string): AIDesignDecisions {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}

// ── Shadow presets by intensity ──

const SHADOW_PRESETS = {
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

// ── Domain detection from AI response ──

function detectDomain(description: string, primaryColor: string): string {
  const lower = description.toLowerCase();
  const domainKeywords: Record<string, string[]> = {
    finance: ['fintech', 'banking', 'finance', 'payment', 'invoice', 'accounting', 'trading', 'crypto'],
    healthcare: ['health', 'medical', 'patient', 'clinic', 'wellness', 'therapy', 'fitness'],
    education: ['education', 'learning', 'student', 'course', 'school', 'teaching', 'tutor'],
    ecommerce: ['store', 'shop', 'marketplace', 'ecommerce', 'product catalog', 'retail'],
    creative: ['design', 'portfolio', 'art', 'music', 'photo', 'video', 'creative'],
    enterprise: ['enterprise', 'admin', 'internal tool', 'b2b', 'crm', 'erp', 'management'],
    tech: ['saas', 'dashboard', 'analytics', 'api', 'developer', 'tool', 'platform', 'app'],
  };

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(k => lower.includes(k))) {
      return domain;
    }
  }
  return 'tech'; // default
}

// ── Main generation function ──

export async function generateDesignSystem(
  input: OnboardingInput,
  geminiApiKey?: string,
): Promise<GeneratedDesignSystem> {
  // 1. Map vibe to default parameters
  const vibeParams = mapVibeToParameters(input.vibe);

  // 2. Build the generation prompt
  const { system, user } = buildGenerationPrompt(input, vibeParams);

  // 3. Call Gemini API
  const responseText = await callGemini(system, user, geminiApiKey);

  // 4. Parse AI response
  const decisions = parseAIResponse(responseText);

  // 5. Detect domain
  const domain = detectDomain(input.productDescription, decisions.primaryColor);

  // 6. Map AI decisions to our DesignSystemConfig format
  const radiusPreset = decisions.borderRadius || vibeParams.borderRadiusPreset;
  const radius = RADIUS_PRESETS[radiusPreset] || RADIUS_PRESETS.medium;
  const shadowIntensity = (decisions.shadowIntensity || 'medium') as keyof typeof SHADOW_PRESETS;
  const shadows = SHADOW_PRESETS[shadowIntensity] || SHADOW_PRESETS.medium;

  const designSystemInput: DesignSystemInput = {
    name: decisions.name,
    source: 'scratch',
    domain,
    themeConfig: {
      accentColor: decisions.primaryColor || input.primaryColor || getVibeDefaultColor(input.vibe),
      grayColor: 'auto',
      paletteMode: decisions.paletteMode || vibeParams.paletteMode,
      radius: radiusPreset,
      scaling: '100',
    },
    typographyConfig: {
      fontFamily: decisions.fontFamily || vibeParams.fontFamily,
      headingFont: decisions.headingFontFamily || vibeParams.headingFontFamily,
      baseSize: decisions.baseSize || vibeParams.baseSize,
      scale: decisions.typeScale || vibeParams.typeScale,
      weights: decisions.fontWeights || vibeParams.fontWeights,
    },
    spacingConfig: vibeParams.spacing,
    componentConfig: { selectedComponents: [...ALL_COMPONENTS] },
  };

  // 7. Build the DesignSystemConfig using existing mapper
  const config = buildDesignSystemConfigFromInput(designSystemInput, decisions.name);

  // Override shadows since mapper uses domain preset defaults
  config.shadows = shadows;

  // 8. Generate tokens using existing token builder
  const tokensDocument = buildTokenDocument(config);
  const documentation = generateDocumentation(config);

  // 9. Assemble the final GeneratedDesignSystem
  return {
    name: decisions.name,
    philosophy: decisions.philosophy || `A ${input.vibe.replace('-', ' ')} design system built for ${input.productDescription.substring(0, 100)}.`,
    principles: decisions.principles || ['Consistency', 'Clarity', 'Accessibility'],
    config: {
      domain,
      color: {
        primaryColor: config.color.primaryColor,
        paletteMode: config.color.paletteMode,
      },
      typography: {
        fontFamily: config.typography.fontFamily,
        headingFontFamily: config.typography.headingFontFamily,
        baseSize: config.typography.baseSize,
        scale: config.typography.scale,
        weights: config.typography.weights,
      },
      spacing: config.spacing,
      radius: config.radius,
      shadows: config.shadows,
      components: config.components,
    },
    tokensDocument,
    documentation: documentation as unknown as Record<string, unknown>,
    layoutConfig: {
      suggestedLayouts: decisions.suggestedLayouts || ['sidebar-dashboard', 'settings-form', 'auth-centered'],
      navigationStyle: decisions.navigationStyle || 'sidebar',
      contentDensity: decisions.contentDensity || 'comfortable',
    },
  };
}
