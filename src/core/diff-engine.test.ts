import { describe, it, expect } from 'vitest';
import { diffTokenDocuments, formatTokenValue } from './diff-engine';
import type { DesignTokensDocument, DTCGToken } from '../types/messages';

function makeDoc(tokens: Record<string, unknown>): DesignTokensDocument {
  return {
    metadata: {
      source: 'cosmikit',
      figmaFileName: 'Test',
      lastSynced: '2025-01-01T00:00:00Z',
      version: '1.0.0',
    },
    ...tokens,
  } as DesignTokensDocument;
}

const emptyDoc = makeDoc({});

describe('diffTokenDocuments', () => {
  it('detects token added (in local, not in remote)', () => {
    const local = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000' } },
    });
    const result = diffTokenDocuments(local, emptyDoc);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].changeType).toBe('added');
    expect(result.entries[0].path).toBe('color/primary');
    expect(result.summary.added).toBe(1);
  });

  it('detects token removed (in remote, not in local)', () => {
    const remote = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000' } },
    });
    const result = diffTokenDocuments(emptyDoc, remote);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].changeType).toBe('removed');
    expect(result.summary.removed).toBe(1);
  });

  it('detects token modified (same path, different $value)', () => {
    const local = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000' } },
    });
    const remote = makeDoc({
      color: { primary: { $type: 'color', $value: '#0000ff' } },
    });
    const result = diffTokenDocuments(local, remote);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].changeType).toBe('modified');
    expect(result.entries[0].localToken?.$value).toBe('#ff0000');
    expect(result.entries[0].remoteToken?.$value).toBe('#0000ff');
    expect(result.summary.modified).toBe(1);
  });

  it('detects token unchanged (same path, same $type and $value)', () => {
    const local = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000' } },
    });
    const remote = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000' } },
    });
    const result = diffTokenDocuments(local, remote);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].changeType).toBe('unchanged');
    expect(result.summary.unchanged).toBe(1);
  });

  it('ignores $description differences (only compares $type + $value)', () => {
    const local = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000', $description: 'old desc' } },
    });
    const remote = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000', $description: 'new desc' } },
    });
    const result = diffTokenDocuments(local, remote);
    expect(result.entries[0].changeType).toBe('unchanged');
  });

  it('detects type change as modified', () => {
    const local = makeDoc({
      foo: { bar: { $type: 'string', $value: 'hello' } },
    });
    const remote = makeDoc({
      foo: { bar: { $type: 'color', $value: 'hello' } },
    });
    const result = diffTokenDocuments(local, remote);
    expect(result.entries[0].changeType).toBe('modified');
  });

  it('handles complex nested token paths', () => {
    const local = makeDoc({
      color: { brand: { primary: { '500': { $type: 'color', $value: '#0D99FF' } } } },
      spacing: { sm: { $type: 'dimension', $value: '8px' } },
    });
    const remote = makeDoc({
      color: { brand: { primary: { '500': { $type: 'color', $value: '#0D99FF' } } } },
      spacing: { md: { $type: 'dimension', $value: '16px' } },
    });
    const result = diffTokenDocuments(local, remote);
    const paths = result.entries.map(e => e.path);
    expect(paths).toContain('color/brand/primary/500');
    expect(paths).toContain('spacing/sm');
    expect(paths).toContain('spacing/md');
    expect(result.entries.find(e => e.path === 'color/brand/primary/500')?.changeType).toBe('unchanged');
    expect(result.entries.find(e => e.path === 'spacing/sm')?.changeType).toBe('added');
    expect(result.entries.find(e => e.path === 'spacing/md')?.changeType).toBe('removed');
  });

  it('returns entries sorted alphabetically by path', () => {
    const local = makeDoc({
      z: { token: { $type: 'string', $value: 'z' } },
      a: { token: { $type: 'string', $value: 'a' } },
      m: { token: { $type: 'string', $value: 'm' } },
    });
    const result = diffTokenDocuments(local, emptyDoc);
    expect(result.entries[0].path).toBe('a/token');
    expect(result.entries[1].path).toBe('m/token');
    expect(result.entries[2].path).toBe('z/token');
  });

  it('computes correct summary totals', () => {
    const local = makeDoc({
      a: { $type: 'color', $value: '#aaa' },
      b: { $type: 'color', $value: '#bbb' },
      c: { $type: 'color', $value: '#ccc' },
      d: { $type: 'color', $value: '#ddd' },
    });
    const remote = makeDoc({
      b: { $type: 'color', $value: '#bbb' },
      c: { $type: 'color', $value: '#111' },
      d: { $type: 'color', $value: '#ddd' },
      e: { $type: 'color', $value: '#eee' },
    });
    const result = diffTokenDocuments(local, remote);
    expect(result.summary.added).toBe(1);     // a
    expect(result.summary.removed).toBe(1);    // e
    expect(result.summary.modified).toBe(1);   // c
    expect(result.summary.unchanged).toBe(2);  // b, d
    expect(result.summary.total).toBe(5);
  });

  it('handles two empty documents', () => {
    const result = diffTokenDocuments(emptyDoc, emptyDoc);
    expect(result.entries).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });
});

describe('formatTokenValue', () => {
  it('formats string values as-is', () => {
    expect(formatTokenValue({ $type: 'color', $value: '#ff0000' } as DTCGToken)).toBe('#ff0000');
  });

  it('formats number values as string', () => {
    expect(formatTokenValue({ $type: 'dimension', $value: 16 } as DTCGToken)).toBe('16');
  });

  it('formats boolean values as string', () => {
    expect(formatTokenValue({ $type: 'boolean', $value: true } as DTCGToken)).toBe('true');
  });

  it('formats object values as JSON', () => {
    const token: DTCGToken = {
      $type: 'typography',
      $value: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 400, lineHeight: '24px', letterSpacing: '0px' },
    };
    const result = formatTokenValue(token);
    const parsed = JSON.parse(result);
    expect(parsed.fontFamily).toBe('Inter');
    expect(parsed.fontSize).toBe('16px');
  });
});
