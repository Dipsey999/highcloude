/**
 * Maps vibe presets to concrete design parameters.
 * This is a lookup table — no AI call needed.
 */

import type { VibePreset, VibeParameters } from './types';

const VIBE_MAP: Record<Exclude<VibePreset, 'custom'>, VibeParameters> = {
  'clean-minimal': {
    fontFamily: 'Inter',
    headingFontFamily: 'Inter',
    typeScale: 'major-third',
    baseSize: 16,
    fontWeights: [400, 500, 600],
    borderRadiusPreset: 'small',
    shadowIntensity: 'subtle',
    paletteMode: 'analogous',
    spacing: { baseUnit: 4, scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16] },
  },
  'professional-trustworthy': {
    fontFamily: 'IBM Plex Sans',
    headingFontFamily: 'IBM Plex Sans',
    typeScale: 'major-third',
    baseSize: 16,
    fontWeights: [400, 500, 600, 700],
    borderRadiusPreset: 'small',
    shadowIntensity: 'subtle',
    paletteMode: 'split-complementary',
    spacing: { baseUnit: 4, scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16] },
  },
  'warm-friendly': {
    fontFamily: 'Nunito',
    headingFontFamily: 'Nunito',
    typeScale: 'minor-third',
    baseSize: 16,
    fontWeights: [400, 600, 700],
    borderRadiusPreset: 'large',
    shadowIntensity: 'medium',
    paletteMode: 'analogous',
    spacing: { baseUnit: 4, scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16] },
  },
  'bold-energetic': {
    fontFamily: 'Space Grotesk',
    headingFontFamily: 'Space Grotesk',
    typeScale: 'perfect-fourth',
    baseSize: 16,
    fontWeights: [400, 500, 700],
    borderRadiusPreset: 'medium',
    shadowIntensity: 'pronounced',
    paletteMode: 'triadic',
    spacing: { baseUnit: 4, scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16] },
  },
  'soft-approachable': {
    fontFamily: 'DM Sans',
    headingFontFamily: 'DM Sans',
    typeScale: 'minor-third',
    baseSize: 16,
    fontWeights: [400, 500, 600],
    borderRadiusPreset: 'large',
    shadowIntensity: 'subtle',
    paletteMode: 'analogous',
    spacing: { baseUnit: 4, scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16] },
  },
};

const DEFAULT_PARAMS: VibeParameters = VIBE_MAP['clean-minimal'];

export function mapVibeToParameters(vibe: VibePreset): VibeParameters {
  if (vibe === 'custom') return DEFAULT_PARAMS;
  return VIBE_MAP[vibe] || DEFAULT_PARAMS;
}

export function getVibeDefaultColor(vibe: VibePreset): string {
  const colorMap: Record<VibePreset, string> = {
    'clean-minimal': '#6366f1',
    'professional-trustworthy': '#1e40af',
    'warm-friendly': '#ea580c',
    'bold-energetic': '#dc2626',
    'soft-approachable': '#8b5cf6',
    'custom': '#6366f1',
  };
  return colorMap[vibe];
}
