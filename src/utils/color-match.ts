/**
 * CIEDE2000 color distance calculation for design token matching.
 * Converts hex colors to CIE Lab and computes perceptual distance.
 */

/**
 * Convert a hex color string (#RRGGBB) to CIE Lab color space.
 */
export function hexToLab(hex: string): [number, number, number] | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;

  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;

  if ([r, g, b].some(isNaN)) return null;

  const xyz = srgbToXyz(r, g, b);
  return xyzToLab(xyz[0], xyz[1], xyz[2]);
}

/**
 * Convert Figma RGB (0-1 range) to CIE Lab.
 */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const xyz = srgbToXyz(r, g, b);
  return xyzToLab(xyz[0], xyz[1], xyz[2]);
}

/**
 * Linearize sRGB and convert to XYZ D65.
 */
function srgbToXyz(r: number, g: number, b: number): [number, number, number] {
  // Linearize sRGB
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // sRGB to XYZ (D65)
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  return [x, y, z];
}

/**
 * Convert XYZ (D65) to CIE Lab.
 */
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  // D65 reference white
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  x = x / xn;
  y = y / yn;
  z = z / zn;

  const epsilon = 0.008856;
  const kappa = 903.3;

  x = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
  y = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
  z = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;

  const L = 116 * y - 16;
  const a = 500 * (x - y);
  const bVal = 200 * (y - z);

  return [L, a, bVal];
}

/**
 * CIEDE2000 Delta E calculation.
 * Full implementation including chroma/hue adjustments and rotation term.
 */
export function deltaE2000(
  lab1: [number, number, number],
  lab2: [number, number, number],
): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cbar = (C1 + C2) / 2;

  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  let h1p = Math.atan2(b1, a1p) * (180 / Math.PI);
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * (180 / Math.PI);
  if (h2p < 0) h2p += 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp: number;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hbarp = (h1p + h2p + 360) / 2;
  } else {
    hbarp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(((hbarp - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * hbarp * Math.PI) / 180) +
    0.32 * Math.cos(((3 * hbarp + 6) * Math.PI) / 180) -
    0.20 * Math.cos(((4 * hbarp - 63) * Math.PI) / 180);

  const Lbarp50sq = (Lbarp - 50) * (Lbarp - 50);
  const SL = 1 + 0.015 * Lbarp50sq / Math.sqrt(20 + Lbarp50sq);
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;

  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
  const dtheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const RT = -Math.sin((2 * dtheta * Math.PI) / 180) * RC;

  const result = Math.sqrt(
    Math.pow(dLp / SL, 2) +
    Math.pow(dCp / SC, 2) +
    Math.pow(dHp / SH, 2) +
    RT * (dCp / SC) * (dHp / SH),
  );

  return result;
}

/**
 * Map a Delta E value to a confidence score and match type.
 */
export function colorConfidence(deltaE: number): {
  confidence: number;
  matchType: 'exact' | 'close' | 'approximate';
} | null {
  if (deltaE === 0) return { confidence: 1.0, matchType: 'exact' };
  if (deltaE < 1.0) return { confidence: 0.95, matchType: 'exact' };
  if (deltaE < 3.0) return { confidence: 0.85, matchType: 'close' };
  if (deltaE < 6.0) return { confidence: 0.65, matchType: 'close' };
  if (deltaE < 12.0) return { confidence: 0.40, matchType: 'approximate' };
  return null; // Too different to suggest
}
