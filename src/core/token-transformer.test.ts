import { describe, it, expect } from 'vitest';
import {
  transformToDocument,
  computeSummary,
  transformToMultiDocument,
  slugifyCollectionName,
  generateDefaultFileMapping,
} from './token-transformer';
import type {
  RawExtractionResult,
  RawFigmaVariable,
  RawFigmaTextStyle,
  RawFigmaEffectStyle,
  DesignTokensDocument,
} from '../types/messages';

// ==========================================
// Fixture Factories
// ==========================================

function makeRaw(overrides: Partial<RawExtractionResult> = {}): RawExtractionResult {
  return {
    variables: [],
    textStyles: [],
    effectStyles: [],
    figmaFileName: 'TestFile',
    figmaFileKey: 'abc123',
    ...overrides,
  };
}

function makeVariable(overrides: Partial<RawFigmaVariable> = {}): RawFigmaVariable {
  return {
    id: 'v1',
    name: 'color/primary',
    resolvedType: 'COLOR',
    description: '',
    collectionName: 'Brand',
    collectionId: 'c1',
    scopes: [],
    valuesByMode: { default: '#0D99FF' },
    defaultValue: '#0D99FF',
    ...overrides,
  };
}

function makeTextStyle(overrides: Partial<RawFigmaTextStyle> = {}): RawFigmaTextStyle {
  return {
    id: 's1',
    name: 'heading/h1',
    description: '',
    fontFamily: 'Inter',
    fontStyle: 'Bold',
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: { value: 0, unit: 'PIXELS' },
    lineHeight: { value: 40, unit: 'PIXELS' },
    paragraphSpacing: 0,
    textDecoration: 'NONE',
    textCase: 'ORIGINAL',
    ...overrides,
  };
}

function makeEffectStyle(overrides: Partial<RawFigmaEffectStyle> = {}): RawFigmaEffectStyle {
  return {
    id: 'e1',
    name: 'elevation/md',
    description: '',
    effects: [
      { type: 'DROP_SHADOW', color: '#00000040', offsetX: 0, offsetY: 4, radius: 8, spread: 0 },
    ],
    ...overrides,
  };
}

// ==========================================
// Tests
// ==========================================

describe('slugifyCollectionName', () => {
  it('lowercases and slugifies "My Cool Colors"', () => {
    expect(slugifyCollectionName('My Cool Colors')).toBe('my-cool-colors');
  });

  it('strips leading/trailing dashes', () => {
    expect(slugifyCollectionName('--test--')).toBe('test');
  });

  it('collapses multiple special characters', () => {
    expect(slugifyCollectionName('foo!!!bar')).toBe('foo-bar');
  });

  it('handles already-slugified input', () => {
    expect(slugifyCollectionName('primitives')).toBe('primitives');
  });

  it('handles empty string', () => {
    expect(slugifyCollectionName('')).toBe('');
  });
});

describe('generateDefaultFileMapping', () => {
  it('generates mapping for single collection with default directory', () => {
    expect(generateDefaultFileMapping(['Primitives'])).toEqual({
      Primitives: 'tokens/primitives.json',
    });
  });

  it('generates mapping for multiple collections', () => {
    const result = generateDefaultFileMapping(['Primitives', 'Semantic Colors']);
    expect(result).toEqual({
      Primitives: 'tokens/primitives.json',
      'Semantic Colors': 'tokens/semantic-colors.json',
    });
  });

  it('handles custom directory with trailing slash', () => {
    expect(generateDefaultFileMapping(['Colors'], 'design-tokens/')).toEqual({
      Colors: 'design-tokens/colors.json',
    });
  });

  it('appends slash to directory without trailing slash', () => {
    expect(generateDefaultFileMapping(['Colors'], 'design-tokens')).toEqual({
      Colors: 'design-tokens/colors.json',
    });
  });

  it('handles empty collection names array', () => {
    expect(generateDefaultFileMapping([])).toEqual({});
  });
});

describe('transformToDocument', () => {
  it('creates document with correct metadata', () => {
    const raw = makeRaw();
    const doc = transformToDocument(raw);
    expect(doc.metadata.source).toBe('claude-bridge');
    expect(doc.metadata.figmaFileName).toBe('TestFile');
    expect(doc.metadata.figmaFileKey).toBe('abc123');
    expect(doc.metadata.version).toBe('1.0.0');
    expect(doc.metadata.lastSynced).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('transforms a COLOR variable to a color token', () => {
    const raw = makeRaw({
      variables: [makeVariable({
        name: 'color/primary',
        resolvedType: 'COLOR',
        defaultValue: '#0D99FF',
        description: 'Primary brand color',
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).color.primary;
    expect(token.$type).toBe('color');
    expect(token.$value).toBe('#0D99FF');
    expect(token.$description).toBe('Primary brand color');
  });

  it('transforms a FLOAT variable to a dimension token with "px"', () => {
    const raw = makeRaw({
      variables: [makeVariable({
        name: 'spacing/sm',
        resolvedType: 'FLOAT',
        defaultValue: 8,
        valuesByMode: { default: 8 },
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).spacing.sm;
    expect(token.$type).toBe('dimension');
    expect(token.$value).toBe('8px');
  });

  it('transforms a STRING variable to a string token', () => {
    const raw = makeRaw({
      variables: [makeVariable({
        name: 'font/family',
        resolvedType: 'STRING',
        defaultValue: 'Inter',
        valuesByMode: { default: 'Inter' },
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).font.family;
    expect(token.$type).toBe('string');
    expect(token.$value).toBe('Inter');
  });

  it('transforms a BOOLEAN variable to a boolean token', () => {
    const raw = makeRaw({
      variables: [makeVariable({
        name: 'feature/darkMode',
        resolvedType: 'BOOLEAN',
        defaultValue: true,
        valuesByMode: { default: true },
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).feature.darkMode;
    expect(token.$type).toBe('boolean');
    expect(token.$value).toBe(true);
  });

  it('includes modes in $extensions when variable has multiple modes', () => {
    const raw = makeRaw({
      variables: [makeVariable({
        name: 'color/bg',
        resolvedType: 'COLOR',
        defaultValue: '#ffffff',
        valuesByMode: { light: '#ffffff', dark: '#000000' },
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).color.bg;
    expect(token.$extensions.figma.modes).toBeDefined();
    expect(token.$extensions.figma.modes.light).toBe('#ffffff');
    expect(token.$extensions.figma.modes.dark).toBe('#000000');
  });

  it('omits modes when variable has only one mode', () => {
    const raw = makeRaw({
      variables: [makeVariable({
        name: 'color/bg',
        resolvedType: 'COLOR',
        defaultValue: '#ffffff',
        valuesByMode: { default: '#ffffff' },
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).color.bg;
    expect(token.$extensions.figma.modes).toBeUndefined();
  });

  it('transforms text styles into typography/ namespace', () => {
    const raw = makeRaw({
      textStyles: [makeTextStyle()],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).typography.heading.h1;
    expect(token.$type).toBe('typography');
    expect(token.$value.fontFamily).toBe('Inter');
    expect(token.$value.fontSize).toBe('32px');
    expect(token.$value.fontWeight).toBe(700);
    expect(token.$value.lineHeight).toBe('40px');
  });

  it('handles text style with AUTO line height', () => {
    const raw = makeRaw({
      textStyles: [makeTextStyle({ lineHeight: { unit: 'AUTO' } })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).typography.heading.h1;
    expect(token.$value.lineHeight).toBe('auto');
  });

  it('handles text style with PERCENT line height', () => {
    const raw = makeRaw({
      textStyles: [makeTextStyle({
        lineHeight: { value: 150, unit: 'PERCENT' },
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).typography.heading.h1;
    expect(token.$value.lineHeight).toBe('150%');
  });

  it('handles text style with PERCENT letter spacing (converts to em)', () => {
    const raw = makeRaw({
      textStyles: [makeTextStyle({
        letterSpacing: { value: 5, unit: 'PERCENT' },
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).typography.heading.h1;
    expect(token.$value.letterSpacing).toBe('0.0500em');
  });

  it('transforms effect styles into shadow/ namespace', () => {
    const raw = makeRaw({
      effectStyles: [makeEffectStyle()],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>).shadow.elevation.md;
    expect(token.$type).toBe('shadow');
    expect(token.$value.blur).toBe('8px');
    expect(token.$value.offsetY).toBe('4px');
    expect(token.$value.spread).toBe('0px');
  });

  it('sanitizes keys with spaces to hyphens', () => {
    const raw = makeRaw({
      variables: [makeVariable({
        name: 'my brand/primary color',
      })],
    });
    const doc = transformToDocument(raw);
    const token = (doc as Record<string, any>)['my-brand']['primary-color'];
    expect(token.$type).toBe('color');
  });
});

describe('computeSummary', () => {
  it('counts tokens by type correctly', () => {
    const raw = makeRaw({
      variables: [
        makeVariable({ name: 'color/a', resolvedType: 'COLOR', defaultValue: '#aaa', valuesByMode: { d: '#aaa' } }),
        makeVariable({ name: 'color/b', resolvedType: 'COLOR', defaultValue: '#bbb', valuesByMode: { d: '#bbb' } }),
        makeVariable({ name: 'color/c', resolvedType: 'COLOR', defaultValue: '#ccc', valuesByMode: { d: '#ccc' } }),
        makeVariable({ name: 'spacing/sm', resolvedType: 'FLOAT', defaultValue: 8, valuesByMode: { d: 8 } }),
        makeVariable({ name: 'spacing/md', resolvedType: 'FLOAT', defaultValue: 16, valuesByMode: { d: 16 } }),
      ],
      textStyles: [makeTextStyle()],
    });
    const doc = transformToDocument(raw);
    const summary = computeSummary(doc);
    expect(summary.colorCount).toBe(3);
    expect(summary.dimensionCount).toBe(2);
    expect(summary.typographyCount).toBe(1);
    expect(summary.totalCount).toBe(6);
  });

  it('collects unique collection names', () => {
    const raw = makeRaw({
      variables: [
        makeVariable({ name: 'a', collectionName: 'Brand', valuesByMode: { d: '#a' } }),
        makeVariable({ name: 'b', collectionName: 'Primitives', valuesByMode: { d: '#b' } }),
        makeVariable({ name: 'c', collectionName: 'Brand', valuesByMode: { d: '#c' } }),
      ],
    });
    const doc = transformToDocument(raw);
    const summary = computeSummary(doc);
    expect(summary.collectionNames).toContain('Brand');
    expect(summary.collectionNames).toContain('Primitives');
    expect(summary.collectionNames).toHaveLength(2);
  });

  it('returns zeros for empty document', () => {
    const doc = transformToDocument(makeRaw());
    const summary = computeSummary(doc);
    expect(summary.totalCount).toBe(0);
    expect(summary.colorCount).toBe(0);
    expect(summary.collectionNames).toHaveLength(0);
  });
});

describe('transformToMultiDocument', () => {
  it('splits variables into separate documents by collection', () => {
    const raw = makeRaw({
      variables: [
        makeVariable({ name: 'red', collectionName: 'Colors', valuesByMode: { d: '#f00' } }),
        makeVariable({ name: 'sm', collectionName: 'Spacing', resolvedType: 'FLOAT', defaultValue: 8, valuesByMode: { d: 8 } }),
      ],
    });
    const result = transformToMultiDocument(raw);
    expect(result.has('Colors')).toBe(true);
    expect(result.has('Spacing')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('puts text styles into a "typography" document', () => {
    const raw = makeRaw({ textStyles: [makeTextStyle()] });
    const result = transformToMultiDocument(raw);
    expect(result.has('typography')).toBe(true);
    const doc = result.get('typography')!;
    expect(doc.metadata.source).toBe('claude-bridge');
  });

  it('puts effect styles into a "shadows" document', () => {
    const raw = makeRaw({ effectStyles: [makeEffectStyle()] });
    const result = transformToMultiDocument(raw);
    expect(result.has('shadows')).toBe(true);
  });

  it('uses "default" as collection name when collectionName is empty', () => {
    const raw = makeRaw({
      variables: [makeVariable({ name: 'x', collectionName: '', valuesByMode: { d: '#x' } })],
    });
    const result = transformToMultiDocument(raw);
    expect(result.has('default')).toBe(true);
  });
});
