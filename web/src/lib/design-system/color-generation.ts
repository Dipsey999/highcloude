/**
 * HSL-based algorithmic color palette generation.
 * Generates 11 shades (50–950), complementary/analogous/triadic/split-comp palettes,
 * neutral scales, and semantic status colors.
 */

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorPalette {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  accent: Record<string, string>;
  neutral: Record<string, string>;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export type PaletteMode = 'complementary' | 'analogous' | 'triadic' | 'split-complementary';

// ── Color space conversion ──

export function hexToHSL(hex: string): HSL {
  let r = 0, g = 0, b = 0;
  const h6 = hex.replace('#', '');
  if (h6.length === 3) {
    r = parseInt(h6[0] + h6[0], 16) / 255;
    g = parseInt(h6[1] + h6[1], 16) / 255;
    b = parseInt(h6[2] + h6[2], 16) / 255;
  } else {
    r = parseInt(h6.substring(0, 2), 16) / 255;
    g = parseInt(h6.substring(2, 4), 16) / 255;
    b = parseInt(h6.substring(4, 6), 16) / 255;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${v.toString(16).padStart(2, '0').repeat(3)}`;
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ── Shade generation ──

const SHADE_MAP: { step: string; lFactor: number; sFactor: number }[] = [
  { step: '50',  lFactor: 0.97, sFactor: 0.3 },
  { step: '100', lFactor: 0.94, sFactor: 0.5 },
  { step: '200', lFactor: 0.88, sFactor: 0.65 },
  { step: '300', lFactor: 0.77, sFactor: 0.75 },
  { step: '400', lFactor: 0.66, sFactor: 0.85 },
  { step: '500', lFactor: -1,   sFactor: 1.0 },   // base color
  { step: '600', lFactor: 0.44, sFactor: 1.05 },
  { step: '700', lFactor: 0.37, sFactor: 1.1 },
  { step: '800', lFactor: 0.28, sFactor: 1.05 },
  { step: '900', lFactor: 0.20, sFactor: 1.0 },
  { step: '950', lFactor: 0.12, sFactor: 0.95 },
];

export function generateShades(hex: string): Record<string, string> {
  const base = hexToHSL(hex);
  const shades: Record<string, string> = {};

  for (const { step, lFactor, sFactor } of SHADE_MAP) {
    if (lFactor === -1) {
      shades[step] = hex.startsWith('#') ? hex : `#${hex}`;
    } else {
      shades[step] = hslToHex({
        h: base.h,
        s: Math.min(100, Math.round(base.s * sFactor)),
        l: Math.round(lFactor * 100),
      });
    }
  }

  return shades;
}

// ── Color harmony ──

function rotateHue(hex: string, degrees: number): string {
  const hsl = hexToHSL(hex);
  return hslToHex({ ...hsl, h: (hsl.h + degrees + 360) % 360 });
}

export function generateComplementary(hex: string): string {
  return rotateHue(hex, 180);
}

export function generateAnalogous(hex: string): [string, string] {
  return [rotateHue(hex, 30), rotateHue(hex, -30)];
}

export function generateTriadic(hex: string): [string, string] {
  return [rotateHue(hex, 120), rotateHue(hex, 240)];
}

export function generateSplitComplementary(hex: string): [string, string] {
  return [rotateHue(hex, 150), rotateHue(hex, 210)];
}

// ── Neutral generation ──

function generateNeutralShades(hex: string): Record<string, string> {
  const base = hexToHSL(hex);
  const neutralHue = base.h;
  const shades: Record<string, string> = {};

  const neutralLevels = [
    { step: '50',  l: 98, s: 5 },
    { step: '100', l: 96, s: 5 },
    { step: '200', l: 91, s: 5 },
    { step: '300', l: 83, s: 4 },
    { step: '400', l: 64, s: 4 },
    { step: '500', l: 46, s: 4 },
    { step: '600', l: 37, s: 5 },
    { step: '700', l: 27, s: 6 },
    { step: '800', l: 18, s: 7 },
    { step: '900', l: 11, s: 8 },
    { step: '950', l: 6,  s: 10 },
  ];

  for (const { step, l, s } of neutralLevels) {
    shades[step] = hslToHex({ h: neutralHue, s, l });
  }

  return shades;
}

// ── Full palette ──

export function generateFullPalette(primaryHex: string, mode: PaletteMode): ColorPalette {
  let secondaryHex: string;
  let accentHex: string;

  switch (mode) {
    case 'complementary': {
      secondaryHex = generateComplementary(primaryHex);
      const hsl = hexToHSL(primaryHex);
      accentHex = hslToHex({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l });
      break;
    }
    case 'analogous': {
      const [a, b] = generateAnalogous(primaryHex);
      secondaryHex = a;
      accentHex = b;
      break;
    }
    case 'triadic': {
      const [a, b] = generateTriadic(primaryHex);
      secondaryHex = a;
      accentHex = b;
      break;
    }
    case 'split-complementary': {
      const [a, b] = generateSplitComplementary(primaryHex);
      secondaryHex = a;
      accentHex = b;
      break;
    }
  }

  return {
    primary: generateShades(primaryHex),
    secondary: generateShades(secondaryHex),
    accent: generateShades(accentHex),
    neutral: generateNeutralShades(primaryHex),
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
  };
}
