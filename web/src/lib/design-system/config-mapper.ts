/**
 * Maps ThemeBuilder input (from the frontend) to the DesignSystemConfig
 * shape expected by the token-builder.
 */

import type { DesignSystemConfig } from './token-builder';
import { DOMAIN_PRESETS } from './domain-presets';
import type { ComponentType, TypeScale } from './domain-presets';
import type { PaletteMode } from './color-generation';

// ── Radius preset mapping ──

export const RADIUS_PRESETS: Record<string, DesignSystemConfig['radius']> = {
  none: { none: 0, sm: 0, md: 0, lg: 0, xl: 0, full: '0' },
  small: { none: 0, sm: 2, md: 4, lg: 6, xl: 8, full: '9999px' },
  medium: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: '9999px' },
  large: { none: 0, sm: 6, md: 12, lg: 16, xl: 24, full: '9999px' },
  full: { none: 0, sm: 9999, md: 9999, lg: 9999, xl: 9999, full: '9999px' },
};

// ── ThemeBuilder design system input shape ──

export interface DesignSystemInput {
  name?: string;
  source: 'scratch' | 'figma-import';
  domain?: string;
  themeConfig: { accentColor: string; grayColor: string; paletteMode: string; radius: string; scaling: string };
  typographyConfig: { fontFamily: string; headingFont: string; baseSize: number; scale: string; weights: number[] };
  spacingConfig: { baseUnit: number; scale: number[] };
  componentConfig: { selectedComponents: string[] };
}

// ── Helper: build DesignSystemConfig from ThemeBuilder input ──

export function buildDesignSystemConfigFromInput(
  designSystem: DesignSystemInput,
  projectName: string,
): DesignSystemConfig {
  const domain = designSystem.domain || 'tech';
  const domainPreset = DOMAIN_PRESETS[domain as keyof typeof DOMAIN_PRESETS] || DOMAIN_PRESETS.tech;

  return {
    name: designSystem.name || projectName,
    domain,
    color: {
      primaryColor: designSystem.themeConfig.accentColor,
      paletteMode: designSystem.themeConfig.paletteMode as PaletteMode,
    },
    typography: {
      fontFamily: designSystem.typographyConfig.fontFamily,
      headingFontFamily: designSystem.typographyConfig.headingFont,
      baseSize: designSystem.typographyConfig.baseSize,
      scale: designSystem.typographyConfig.scale as TypeScale,
      weights: designSystem.typographyConfig.weights,
    },
    spacing: {
      baseUnit: designSystem.spacingConfig.baseUnit,
      scale: designSystem.spacingConfig.scale,
    },
    radius: RADIUS_PRESETS[designSystem.themeConfig.radius] || RADIUS_PRESETS.medium,
    shadows: domainPreset.shadows,
    components: designSystem.componentConfig.selectedComponents as ComponentType[],
  };
}
