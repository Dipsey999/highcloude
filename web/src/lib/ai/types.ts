/**
 * Type definitions for the AI design system generation pipeline.
 */

export type VibePreset =
  | 'clean-minimal'
  | 'professional-trustworthy'
  | 'warm-friendly'
  | 'bold-energetic'
  | 'soft-approachable'
  | 'custom';

export interface OnboardingInput {
  productDescription: string;
  vibe: VibePreset;
  customVibe?: string;
  brandReferences?: string;
  primaryColor?: string;
}

export interface VibeParameters {
  fontFamily: string;
  headingFontFamily: string;
  typeScale: 'minor-third' | 'major-third' | 'perfect-fourth' | 'augmented-fourth';
  baseSize: number;
  fontWeights: number[];
  borderRadiusPreset: 'none' | 'small' | 'medium' | 'large' | 'full';
  shadowIntensity: 'subtle' | 'medium' | 'pronounced';
  paletteMode: 'complementary' | 'analogous' | 'triadic' | 'split-complementary';
  spacing: { baseUnit: number; scale: number[] };
}

export interface AIDesignDecisions {
  name: string;
  philosophy: string;
  principles: string[];
  primaryColor: string;
  paletteMode: string;
  fontFamily: string;
  headingFontFamily: string;
  typeScale: string;
  baseSize: number;
  fontWeights: number[];
  borderRadius: string;
  shadowIntensity: string;
  navigationStyle: string;
  contentDensity: string;
  suggestedLayouts: string[];
}

export interface GeneratedDesignSystem {
  name: string;
  philosophy: string;
  principles: string[];
  config: {
    domain: string;
    color: { primaryColor: string; paletteMode: string };
    typography: {
      fontFamily: string;
      headingFontFamily: string;
      baseSize: number;
      scale: string;
      weights: number[];
    };
    spacing: { baseUnit: number; scale: number[] };
    radius: { none: number; sm: number; md: number; lg: number; xl: number; full: string };
    shadows: { sm: string; md: string; lg: string; xl: string };
    components: string[];
  };
  tokensDocument: Record<string, unknown>;
  documentation: Record<string, unknown>;
  layoutConfig: {
    suggestedLayouts: string[];
    navigationStyle: string;
    contentDensity: string;
  };
}

export interface RefinementResult {
  designSystem: GeneratedDesignSystem;
  changes: {
    summary: string;
    modified: Array<{ field: string; old: string; new: string }>;
  };
}
