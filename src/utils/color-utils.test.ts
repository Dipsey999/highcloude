import { describe, it, expect } from 'vitest';
import { rgbToHex, rgbaToHex } from './color-utils';

describe('rgbToHex', () => {
  it('converts pure red (1,0,0) to #ff0000', () => {
    expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('converts pure green (0,1,0) to #00ff00', () => {
    expect(rgbToHex({ r: 0, g: 1, b: 0 })).toBe('#00ff00');
  });

  it('converts pure blue (0,0,1) to #0000ff', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 1 })).toBe('#0000ff');
  });

  it('converts white (1,1,1) to #ffffff', () => {
    expect(rgbToHex({ r: 1, g: 1, b: 1 })).toBe('#ffffff');
  });

  it('converts black (0,0,0) to #000000', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('converts fractional Figma values correctly', () => {
    expect(rgbToHex({ r: 0.2, g: 0.4, b: 0.6 })).toBe('#336699');
  });

  it('clamps values above 1 to ff', () => {
    expect(rgbToHex({ r: 1.5, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('clamps negative values to 00', () => {
    expect(rgbToHex({ r: -0.5, g: 0, b: 0 })).toBe('#000000');
  });
});

describe('rgbaToHex', () => {
  it('returns 6-digit hex when alpha is 1', () => {
    expect(rgbaToHex({ r: 1, g: 0, b: 0, a: 1 })).toBe('#ff0000');
  });

  it('returns 8-digit hex when alpha < 1', () => {
    expect(rgbaToHex({ r: 1, g: 0, b: 0, a: 0.5 })).toBe('#ff000080');
  });

  it('returns 6-digit hex when alpha is undefined', () => {
    expect(rgbaToHex({ r: 0, g: 0.5, b: 1 })).toBe('#0080ff');
  });

  it('handles alpha of 0 (fully transparent)', () => {
    expect(rgbaToHex({ r: 1, g: 1, b: 1, a: 0 })).toBe('#ffffff00');
  });
});
