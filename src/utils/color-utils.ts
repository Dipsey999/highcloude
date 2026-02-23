/**
 * Convert a 0-1 channel value to a 0-255 integer.
 */
function clampByte(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 255);
}

/**
 * Convert Figma RGBA (0-1 range) to a hex string.
 * Returns #RRGGBB if alpha is 1, #RRGGBBAA otherwise.
 */
export function rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = clampByte(color.r).toString(16).padStart(2, '0');
  const g = clampByte(color.g).toString(16).padStart(2, '0');
  const b = clampByte(color.b).toString(16).padStart(2, '0');

  if (color.a !== undefined && color.a < 1) {
    const a = clampByte(color.a).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
  }

  return `#${r}${g}${b}`;
}

/**
 * Convert Figma RGB (0-1 range, no alpha) to #RRGGBB hex string.
 */
export function rgbToHex(color: { r: number; g: number; b: number }): string {
  return rgbaToHex({ ...color, a: 1 });
}
