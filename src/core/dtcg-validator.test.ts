import { describe, it, expect } from 'vitest';
import { validateDTCG } from './dtcg-validator';
import type { DesignTokensDocument } from '../types/messages';

function makeDoc(tokens: Record<string, unknown>): DesignTokensDocument {
  return {
    metadata: {
      source: 'claude-bridge',
      figmaFileName: 'Test',
      lastSynced: '2025-01-01T00:00:00Z',
      version: '1.0.0',
    },
    ...tokens,
  } as DesignTokensDocument;
}

describe('validateDTCG', () => {
  describe('valid documents', () => {
    it('validates a single well-formed color token', () => {
      const doc = makeDoc({
        color: {
          primary: { $type: 'color', $value: '#ff0000', $description: 'Red' },
        },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalChecked).toBe(1);
    });

    it('validates a document with multiple token types', () => {
      const doc = makeDoc({
        color: {
          primary: { $type: 'color', $value: '#ff0000', $description: 'Red' },
        },
        spacing: {
          sm: { $type: 'dimension', $value: '8px', $description: 'Small' },
        },
        font: {
          family: { $type: 'string', $value: 'Inter', $description: 'Main font' },
        },
        feature: {
          dark: { $type: 'boolean', $value: true, $description: 'Dark mode' },
        },
        typography: {
          heading: {
            $type: 'typography',
            $value: { fontFamily: 'Inter', fontSize: '32px', fontWeight: 700, lineHeight: '40px', letterSpacing: '0px' },
            $description: 'Heading',
          },
        },
        shadow: {
          md: {
            $type: 'shadow',
            $value: { color: '#00000040', offsetX: '0px', offsetY: '4px', blur: '8px', spread: '0px' },
            $description: 'Medium shadow',
          },
        },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(true);
      expect(result.totalChecked).toBe(6);
    });
  });

  describe('error detection', () => {
    it('reports error when $type is missing', () => {
      const doc = makeDoc({
        color: { primary: { $value: '#ff0000' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required $type'))).toBe(true);
    });

    it('reports error when $value is missing', () => {
      const doc = makeDoc({
        color: { primary: { $type: 'color' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required $value'))).toBe(true);
    });

    it('reports error for invalid $type value', () => {
      const doc = makeDoc({
        foo: { bar: { $type: 'unknown', $value: 'baz' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid $type'))).toBe(true);
    });

    it('reports error when color value is not a string', () => {
      const doc = makeDoc({
        color: { primary: { $type: 'color', $value: 12345 } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Color value must be a string'))).toBe(true);
    });

    it('reports error when color string does not start with # or rgb', () => {
      const doc = makeDoc({
        color: { primary: { $type: 'color', $value: 'blue' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('should start with "#" or "rgb"'))).toBe(true);
    });

    it('reports error when dimension value is invalid format', () => {
      const doc = makeDoc({
        spacing: { sm: { $type: 'dimension', $value: 'abc' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Dimension value should be'))).toBe(true);
    });

    it('accepts dimension as number', () => {
      const doc = makeDoc({
        spacing: { sm: { $type: 'dimension', $value: 16, $description: 'ok' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(true);
    });

    it('accepts dimension as string with units', () => {
      for (const val of ['16px', '1.5rem', '2em', '50%']) {
        const doc = makeDoc({
          spacing: { sm: { $type: 'dimension', $value: val, $description: 'ok' } },
        });
        expect(validateDTCG(doc).valid).toBe(true);
      }
    });

    it('reports error when string value is not a string', () => {
      const doc = makeDoc({
        font: { family: { $type: 'string', $value: 42 } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('String value must be a string'))).toBe(true);
    });

    it('reports error when boolean value is not a boolean', () => {
      const doc = makeDoc({
        feature: { dark: { $type: 'boolean', $value: 'true' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Boolean value must be a boolean'))).toBe(true);
    });

    it('reports error when typography value is not an object', () => {
      const doc = makeDoc({
        typography: { heading: { $type: 'typography', $value: 'Inter 16px' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Typography value must be an object'))).toBe(true);
    });

    it('reports error when typography object is missing fontFamily', () => {
      const doc = makeDoc({
        typography: {
          heading: {
            $type: 'typography',
            $value: { fontSize: '16px', fontWeight: 400, lineHeight: '24px', letterSpacing: '0px' },
          },
        },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('missing fontFamily'))).toBe(true);
    });

    it('reports error when typography object is missing fontSize', () => {
      const doc = makeDoc({
        typography: {
          heading: {
            $type: 'typography',
            $value: { fontFamily: 'Inter', fontWeight: 400, lineHeight: '24px', letterSpacing: '0px' },
          },
        },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('missing fontSize'))).toBe(true);
    });

    it('reports error when shadow value is not an object', () => {
      const doc = makeDoc({
        shadow: { md: { $type: 'shadow', $value: '0 4px 8px black' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Shadow value must be an object'))).toBe(true);
    });

    it('reports error when shadow object is missing required fields', () => {
      const doc = makeDoc({
        shadow: { md: { $type: 'shadow', $value: { color: '#000' } } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('missing offsetX'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('missing offsetY'))).toBe(true);
    });
  });

  describe('warnings', () => {
    it('warns when $description is missing', () => {
      const doc = makeDoc({
        color: { primary: { $type: 'color', $value: '#ff0000' } },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('Missing $description'))).toBe(true);
    });

    it('does not warn when $description is present', () => {
      const doc = makeDoc({
        color: { primary: { $type: 'color', $value: '#ff0000', $description: 'Primary' } },
      });
      const result = validateDTCG(doc);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty document (only metadata)', () => {
      const doc = makeDoc({});
      const result = validateDTCG(doc);
      expect(result.valid).toBe(true);
      expect(result.totalChecked).toBe(0);
    });

    it('validates deeply nested token groups', () => {
      const doc = makeDoc({
        brand: {
          color: {
            primary: {
              '500': { $type: 'color', $value: '#0D99FF', $description: 'Brand primary 500' },
            },
          },
        },
      });
      const result = validateDTCG(doc);
      expect(result.valid).toBe(true);
      expect(result.totalChecked).toBe(1);
    });
  });
});
