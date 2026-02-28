/**
 * Curated domain presets for 7 industry verticals.
 * Each preset provides sensible defaults for all design system parameters.
 */

import type { PaletteMode } from './color-generation';

export type DomainType = 'tech' | 'healthcare' | 'finance' | 'education' | 'ecommerce' | 'creative' | 'enterprise';

export type TypeScale = 'minor-third' | 'major-third' | 'perfect-fourth' | 'augmented-fourth';

export type ComponentType =
  | 'button' | 'input' | 'card' | 'badge' | 'avatar'
  | 'toggle' | 'select' | 'alert' | 'tooltip' | 'modal'
  | 'tabs' | 'checkbox';

export const ALL_COMPONENTS: ComponentType[] = [
  'button', 'input', 'card', 'badge', 'avatar',
  'toggle', 'select', 'alert', 'tooltip', 'modal',
  'tabs', 'checkbox',
];

export interface DomainPreset {
  domain: DomainType;
  label: string;
  description: string;
  emoji: string;
  primaryColor: string;
  paletteMode: PaletteMode;
  typography: {
    fontFamily: string;
    headingFontFamily: string;
    baseSize: number;
    scale: TypeScale;
    weights: number[];
  };
  spacing: {
    baseUnit: number;
    scale: number[];
  };
  radius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  suggestedComponents: ComponentType[];
}

export const DOMAIN_PRESETS: Record<DomainType, DomainPreset> = {
  tech: {
    domain: 'tech',
    label: 'Technology',
    description: 'SaaS products, developer tools, dashboards',
    emoji: '\u{1F4BB}',
    primaryColor: '#6366f1',
    paletteMode: 'analogous',
    typography: {
      fontFamily: 'Inter',
      headingFontFamily: 'Inter',
      baseSize: 16,
      scale: 'major-third',
      weights: [400, 500, 600, 700],
    },
    spacing: {
      baseUnit: 4,
      scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: '9999px' },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 12px rgba(0,0,0,0.08)',
      lg: '0 12px 32px rgba(0,0,0,0.1)',
      xl: '0 24px 48px rgba(0,0,0,0.12)',
    },
    suggestedComponents: [...ALL_COMPONENTS],
  },

  healthcare: {
    domain: 'healthcare',
    label: 'Healthcare',
    description: 'Medical apps, patient portals, health platforms',
    emoji: '\u{1FA7A}',
    primaryColor: '#0891b2',
    paletteMode: 'complementary',
    typography: {
      fontFamily: 'system-ui',
      headingFontFamily: 'system-ui',
      baseSize: 16,
      scale: 'minor-third',
      weights: [400, 500, 600, 700],
    },
    spacing: {
      baseUnit: 4,
      scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    radius: { none: 0, sm: 4, md: 6, lg: 8, xl: 12, full: '9999px' },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.04)',
      md: '0 2px 8px rgba(0,0,0,0.06)',
      lg: '0 8px 24px rgba(0,0,0,0.08)',
      xl: '0 16px 40px rgba(0,0,0,0.1)',
    },
    suggestedComponents: ['button', 'input', 'card', 'badge', 'avatar', 'alert', 'tabs', 'modal'],
  },

  finance: {
    domain: 'finance',
    label: 'Finance',
    description: 'Banking, trading, fintech applications',
    emoji: '\u{1F4B0}',
    primaryColor: '#1e40af',
    paletteMode: 'split-complementary',
    typography: {
      fontFamily: 'IBM Plex Sans',
      headingFontFamily: 'IBM Plex Sans',
      baseSize: 16,
      scale: 'major-third',
      weights: [400, 500, 600, 700],
    },
    spacing: {
      baseUnit: 4,
      scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    radius: { none: 0, sm: 2, md: 4, lg: 6, xl: 8, full: '9999px' },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.04)',
      md: '0 2px 6px rgba(0,0,0,0.06)',
      lg: '0 6px 16px rgba(0,0,0,0.08)',
      xl: '0 12px 32px rgba(0,0,0,0.1)',
    },
    suggestedComponents: ['button', 'input', 'card', 'badge', 'alert', 'tabs', 'modal', 'select', 'tooltip'],
  },

  education: {
    domain: 'education',
    label: 'Education',
    description: 'Learning platforms, school management, e-learning',
    emoji: '\u{1F393}',
    primaryColor: '#7c3aed',
    paletteMode: 'triadic',
    typography: {
      fontFamily: 'Nunito',
      headingFontFamily: 'Nunito',
      baseSize: 16,
      scale: 'perfect-fourth',
      weights: [400, 600, 700, 800],
    },
    spacing: {
      baseUnit: 4,
      scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    radius: { none: 0, sm: 6, md: 10, lg: 14, xl: 20, full: '9999px' },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.06)',
      md: '0 4px 12px rgba(0,0,0,0.08)',
      lg: '0 12px 28px rgba(0,0,0,0.1)',
      xl: '0 20px 44px rgba(0,0,0,0.12)',
    },
    suggestedComponents: ['button', 'input', 'card', 'badge', 'avatar', 'alert', 'tabs', 'checkbox', 'toggle'],
  },

  ecommerce: {
    domain: 'ecommerce',
    label: 'E-Commerce',
    description: 'Online stores, marketplaces, product catalogs',
    emoji: '\u{1F6D2}',
    primaryColor: '#ea580c',
    paletteMode: 'analogous',
    typography: {
      fontFamily: 'Poppins',
      headingFontFamily: 'Poppins',
      baseSize: 16,
      scale: 'augmented-fourth',
      weights: [400, 500, 600, 700],
    },
    spacing: {
      baseUnit: 4,
      scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: '9999px' },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.06)',
      md: '0 4px 14px rgba(0,0,0,0.09)',
      lg: '0 12px 32px rgba(0,0,0,0.12)',
      xl: '0 24px 48px rgba(0,0,0,0.14)',
    },
    suggestedComponents: ['button', 'input', 'card', 'badge', 'avatar', 'select', 'modal', 'tabs', 'checkbox'],
  },

  creative: {
    domain: 'creative',
    label: 'Creative',
    description: 'Design tools, portfolios, media platforms',
    emoji: '\u{1F3A8}',
    primaryColor: '#db2777',
    paletteMode: 'triadic',
    typography: {
      fontFamily: 'Space Grotesk',
      headingFontFamily: 'Space Grotesk',
      baseSize: 16,
      scale: 'perfect-fourth',
      weights: [400, 500, 600, 700],
    },
    spacing: {
      baseUnit: 4,
      scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    radius: { none: 0, sm: 6, md: 12, lg: 16, xl: 24, full: '9999px' },
    shadows: {
      sm: '0 2px 4px rgba(0,0,0,0.06)',
      md: '0 6px 16px rgba(0,0,0,0.1)',
      lg: '0 16px 40px rgba(0,0,0,0.14)',
      xl: '0 28px 56px rgba(0,0,0,0.16)',
    },
    suggestedComponents: [...ALL_COMPONENTS],
  },

  enterprise: {
    domain: 'enterprise',
    label: 'Enterprise',
    description: 'Internal tools, B2B apps, admin panels',
    emoji: '\u{1F3E2}',
    primaryColor: '#475569',
    paletteMode: 'complementary',
    typography: {
      fontFamily: 'Source Sans 3',
      headingFontFamily: 'Source Sans 3',
      baseSize: 14,
      scale: 'minor-third',
      weights: [400, 500, 600, 700],
    },
    spacing: {
      baseUnit: 4,
      scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16],
    },
    radius: { none: 0, sm: 2, md: 4, lg: 6, xl: 8, full: '9999px' },
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.04)',
      md: '0 2px 6px rgba(0,0,0,0.06)',
      lg: '0 6px 16px rgba(0,0,0,0.08)',
      xl: '0 12px 28px rgba(0,0,0,0.1)',
    },
    suggestedComponents: ['button', 'input', 'card', 'badge', 'tabs', 'select', 'alert', 'modal', 'tooltip', 'checkbox'],
  },
};

export const TYPE_SCALE_RATIOS: Record<TypeScale, number> = {
  'minor-third': 1.2,
  'major-third': 1.25,
  'perfect-fourth': 1.333,
  'augmented-fourth': 1.414,
};

export const FONT_OPTIONS = [
  'Inter',
  'system-ui',
  'IBM Plex Sans',
  'Nunito',
  'Poppins',
  'Space Grotesk',
  'Source Sans 3',
  'DM Sans',
  'Geist',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Raleway',
];
