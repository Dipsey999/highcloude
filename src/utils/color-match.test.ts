import { describe, it, expect } from 'vitest';
import { hexToLab, deltaE2000, colorConfidence } from './color-match';

describe('hexToLab', () => {
  it('converts #ffffff to Lab close to L=100, a=0, b=0', () => {
    const result = hexToLab('#ffffff');
    expect(result).not.toBeNull();
    const [L, a, b] = result!;
    expect(L).toBeCloseTo(100, 0);
    expect(a).toBeCloseTo(0, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it('converts #000000 to Lab L=0, a=0, b=0', () => {
    const result = hexToLab('#000000');
    expect(result).not.toBeNull();
    const [L, a, b] = result!;
    expect(L).toBeCloseTo(0, 0);
    expect(a).toBeCloseTo(0, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it('converts #ff0000 (red) to expected Lab range', () => {
    const result = hexToLab('#ff0000');
    expect(result).not.toBeNull();
    const [L, a, b] = result!;
    expect(L).toBeCloseTo(53.23, 0);
    expect(a).toBeCloseTo(80.11, 0);
    expect(b).toBeCloseTo(67.22, 0);
  });

  it('returns null for invalid hex (wrong length)', () => {
    expect(hexToLab('#fff')).toBeNull();
    expect(hexToLab('#fffffff')).toBeNull();
  });

  it('returns null for non-hex characters', () => {
    expect(hexToLab('#gggggg')).toBeNull();
  });

  it('handles hex without # prefix', () => {
    const result = hexToLab('ff0000');
    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(53.23, 0);
  });
});

describe('deltaE2000', () => {
  it('returns 0 for identical colors', () => {
    const lab = hexToLab('#ff0000')!;
    expect(deltaE2000(lab, lab)).toBe(0);
  });

  it('returns small value for perceptually similar colors', () => {
    const lab1 = hexToLab('#ff0000')!;
    const lab2 = hexToLab('#fe0000')!;
    expect(deltaE2000(lab1, lab2)).toBeLessThan(1.0);
  });

  it('returns large value for very different colors', () => {
    const lab1 = hexToLab('#ff0000')!;
    const lab2 = hexToLab('#0000ff')!;
    expect(deltaE2000(lab1, lab2)).toBeGreaterThan(30);
  });

  it('black vs white returns high deltaE', () => {
    const lab1 = hexToLab('#000000')!;
    const lab2 = hexToLab('#ffffff')!;
    expect(deltaE2000(lab1, lab2)).toBeGreaterThan(90);
  });

  it('is symmetric: deltaE(a,b) === deltaE(b,a)', () => {
    const lab1 = hexToLab('#336699')!;
    const lab2 = hexToLab('#996633')!;
    expect(deltaE2000(lab1, lab2)).toBeCloseTo(deltaE2000(lab2, lab1), 10);
  });
});

describe('colorConfidence', () => {
  it('returns exact match with confidence 1.0 for deltaE 0', () => {
    expect(colorConfidence(0)).toEqual({ confidence: 1.0, matchType: 'exact' });
  });

  it('returns exact match for deltaE < 1.0', () => {
    expect(colorConfidence(0.5)).toEqual({ confidence: 0.95, matchType: 'exact' });
  });

  it('returns close match for deltaE in [1.0, 3.0)', () => {
    expect(colorConfidence(2.0)).toEqual({ confidence: 0.85, matchType: 'close' });
  });

  it('returns close match for deltaE in [3.0, 6.0)', () => {
    expect(colorConfidence(4.0)).toEqual({ confidence: 0.65, matchType: 'close' });
  });

  it('returns approximate match for deltaE in [6.0, 12.0)', () => {
    expect(colorConfidence(8.0)).toEqual({ confidence: 0.40, matchType: 'approximate' });
  });

  it('returns null for deltaE >= 12.0', () => {
    expect(colorConfidence(12.0)).toBeNull();
    expect(colorConfidence(50.0)).toBeNull();
  });
});
