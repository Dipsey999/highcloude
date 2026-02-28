/**
 * Assembles a full DTCG token document from design system config.
 * Produces color, typography, spacing, radius, shadow, and component sections
 * plus auto-generated documentation metadata.
 */

import type { PaletteMode, ColorPalette } from './color-generation';
import { generateFullPalette } from './color-generation';
import type { TypeScale, ComponentType } from './domain-presets';
import { TYPE_SCALE_RATIOS } from './domain-presets';
import { getAllSelectedComponentTokens, COMPONENT_LABELS } from './component-templates';

// ── Config interfaces ──

export interface ColorConfig {
  primaryColor: string;
  paletteMode: PaletteMode;
}

export interface TypographyConfig {
  fontFamily: string;
  headingFontFamily: string;
  baseSize: number;
  scale: TypeScale;
  weights: number[];
}

export interface SpacingConfig {
  baseUnit: number;
  scale: number[];
}

export interface RadiusConfig {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: string;
}

export interface ShadowConfig {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface DesignSystemConfig {
  name: string;
  domain: string;
  companyName?: string;
  productName?: string;
  color: ColorConfig;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  radius: RadiusConfig;
  shadows: ShadowConfig;
  components: ComponentType[];
}

// ── DTCG node helper ──

function tok(type: string, value: string | number | boolean | Record<string, unknown>, description?: string) {
  const node: Record<string, unknown> = { $type: type, $value: value };
  if (description) node.$description = description;
  return node;
}

// ── Color tokens ──

function buildColorSection(palette: ColorPalette) {
  const section: Record<string, unknown> = {};

  for (const [scaleName, shades] of Object.entries({
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    neutral: palette.neutral,
  })) {
    const group: Record<string, unknown> = {};
    for (const [step, hex] of Object.entries(shades)) {
      group[step] = tok('color', hex);
    }
    section[scaleName] = group;
  }

  section.success = tok('color', palette.success, 'Success / positive');
  section.warning = tok('color', palette.warning, 'Warning / caution');
  section.error = tok('color', palette.error, 'Error / destructive');
  section.info = tok('color', palette.info, 'Informational');

  return section;
}

// ── Typography tokens ──

const TYPE_STEPS = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;

function buildTypographySection(config: TypographyConfig) {
  const ratio = TYPE_SCALE_RATIOS[config.scale];
  const baseIndex = 2; // 'base' is step index 2

  const size: Record<string, unknown> = {};
  for (let i = 0; i < TYPE_STEPS.length; i++) {
    const scale = Math.pow(ratio, i - baseIndex);
    const px = Math.round(config.baseSize * scale * 100) / 100;
    size[TYPE_STEPS[i]] = tok('dimension', `${px}px`, `Type scale step ${TYPE_STEPS[i]}`);
  }

  const weight: Record<string, unknown> = {};
  const weightLabels: Record<number, string> = {
    100: 'thin', 200: 'extralight', 300: 'light', 400: 'regular',
    500: 'medium', 600: 'semibold', 700: 'bold', 800: 'extrabold', 900: 'black',
  };
  for (const w of config.weights) {
    const label = weightLabels[w] || `w${w}`;
    weight[label] = tok('string', String(w));
  }

  const lineHeight: Record<string, unknown> = {
    none: tok('dimension', '1'),
    tight: tok('dimension', '1.25'),
    snug: tok('dimension', '1.375'),
    normal: tok('dimension', '1.5'),
    relaxed: tok('dimension', '1.625'),
    loose: tok('dimension', '2'),
  };

  return {
    family: {
      body: tok('string', config.fontFamily, 'Body text font'),
      heading: tok('string', config.headingFontFamily, 'Heading font'),
    },
    size,
    weight,
    'line-height': lineHeight,
  };
}

// ── Spacing tokens ──

function buildSpacingSection(config: SpacingConfig) {
  const section: Record<string, unknown> = {};
  for (let i = 0; i < config.scale.length; i++) {
    const value = config.baseUnit * config.scale[i];
    const key = String(i + 1);
    section[key] = tok('dimension', `${value}px`);
  }
  return section;
}

// ── Radius tokens ──

function buildRadiusSection(config: RadiusConfig) {
  return {
    none: tok('dimension', `${config.none}px`),
    sm: tok('dimension', `${config.sm}px`),
    md: tok('dimension', `${config.md}px`),
    lg: tok('dimension', `${config.lg}px`),
    xl: tok('dimension', `${config.xl}px`),
    full: tok('dimension', config.full),
  };
}

// ── Shadow tokens ──

function buildShadowSection(config: ShadowConfig) {
  return {
    sm: tok('shadow', config.sm, 'Subtle shadow'),
    md: tok('shadow', config.md, 'Medium shadow'),
    lg: tok('shadow', config.lg, 'Large shadow'),
    xl: tok('shadow', config.xl, 'Extra-large shadow'),
  };
}

// ── Main builder ──

export function buildTokenDocument(config: DesignSystemConfig): Record<string, unknown> {
  const palette = generateFullPalette(config.color.primaryColor, config.color.paletteMode);
  const componentTokens = getAllSelectedComponentTokens(config.components);

  return {
    metadata: {
      name: config.name,
      domain: config.domain,
      companyName: config.companyName || null,
      productName: config.productName || null,
      generatedAt: new Date().toISOString(),
      generator: 'Cosmikit Design System Creator',
      version: '1.0.0',
    },
    color: buildColorSection(palette),
    typography: buildTypographySection(config.typography),
    spacing: buildSpacingSection(config.spacing),
    radius: buildRadiusSection(config.radius),
    shadow: buildShadowSection(config.shadows),
    components: componentTokens,
  };
}

// ── Documentation generator ──

export interface DocSection {
  title: string;
  content: string;
}

export interface DesignSystemDocs {
  overview: string;
  sections: DocSection[];
  colorGuide: {
    primary: string;
    secondary: string;
    accent: string;
    usage: string[];
  };
  typographyGuide: {
    fontFamily: string;
    headingFontFamily: string;
    scaleRatio: string;
    steps: { name: string; size: string }[];
  };
  componentList: { name: string; description: string }[];
}

export function generateDocumentation(
  config: DesignSystemConfig,
): DesignSystemDocs {
  const ratio = TYPE_SCALE_RATIOS[config.typography.scale];
  const baseIndex = 2;

  const steps = TYPE_STEPS.map((step, i) => {
    const scale = Math.pow(ratio, i - baseIndex);
    const px = Math.round(config.typography.baseSize * scale * 100) / 100;
    return { name: step, size: `${px}px` };
  });

  const componentList = config.components.map((c) => ({
    name: COMPONENT_LABELS[c]?.label || c,
    description: COMPONENT_LABELS[c]?.description || '',
  }));

  const productLabel = config.productName || config.companyName || config.name;

  return {
    overview: `Design system for ${productLabel}, built for the ${config.domain} domain. Generated by Cosmikit.`,
    sections: [
      {
        title: 'Color System',
        content: `Uses a ${config.color.paletteMode} palette based on the primary color ${config.color.primaryColor}. Each color scale includes 11 shades (50–950) for consistent UI contrast.`,
      },
      {
        title: 'Typography',
        content: `Body text uses ${config.typography.fontFamily}, headings use ${config.typography.headingFontFamily}. The type scale follows a ${config.typography.scale} ratio (${ratio}) with a base size of ${config.typography.baseSize}px.`,
      },
      {
        title: 'Spacing & Layout',
        content: `Spacing is built on a ${config.spacing.baseUnit}px base unit with a 10-step scale. Border radii range from ${config.radius.sm}px (sm) to ${config.radius.xl}px (xl).`,
      },
      {
        title: 'Components',
        content: `This system includes ${config.components.length} component token sets covering interactive controls, containers, feedback, and navigation patterns.`,
      },
    ],
    colorGuide: {
      primary: config.color.primaryColor,
      secondary: `Derived via ${config.color.paletteMode} harmony`,
      accent: `Derived via ${config.color.paletteMode} harmony`,
      usage: [
        'Use primary-500 for main actions and brand elements',
        'Use neutral-50 to neutral-200 for backgrounds',
        'Use neutral-700 to neutral-900 for body text',
        'Use semantic colors (success, warning, error, info) for status indicators',
        'Use lighter shades (50–200) for hover/focus backgrounds',
      ],
    },
    typographyGuide: {
      fontFamily: config.typography.fontFamily,
      headingFontFamily: config.typography.headingFontFamily,
      scaleRatio: `${config.typography.scale} (${ratio})`,
      steps,
    },
    componentList,
  };
}

// ── Export helpers ──

export function tokensToCSSVariables(tokenDoc: Record<string, unknown>): string {
  const lines: string[] = [':root {'];
  flattenForExport(tokenDoc, [], (path, value) => {
    const varName = `--${path.join('-')}`;
    lines.push(`  ${varName}: ${value};`);
  });
  lines.push('}');
  return lines.join('\n');
}

export function tokensToSCSSVariables(tokenDoc: Record<string, unknown>): string {
  const lines: string[] = [];
  flattenForExport(tokenDoc, [], (path, value) => {
    const varName = `$${path.join('-')}`;
    lines.push(`${varName}: ${value};`);
  });
  return lines.join('\n');
}

function flattenForExport(
  obj: Record<string, unknown>,
  path: string[],
  emit: (path: string[], value: string) => void,
) {
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'metadata' || key.startsWith('$')) continue;

    if (
      typeof value === 'object' &&
      value !== null &&
      '$type' in value &&
      '$value' in value
    ) {
      const v = (value as Record<string, unknown>).$value;
      emit([...path, key], String(v));
    } else if (typeof value === 'object' && value !== null) {
      flattenForExport(value as Record<string, unknown>, [...path, key], emit);
    }
  }
}
