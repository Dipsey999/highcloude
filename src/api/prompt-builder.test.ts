import { describe, it, expect } from 'vitest';
import {
  flattenTokensForPrompt,
  buildSystemPrompt,
  buildUserMessage,
  buildReverseSyncSystemPrompt,
  buildReverseSyncUserMessage,
  buildChatSystemPrompt,
} from './prompt-builder';
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

describe('flattenTokensForPrompt', () => {
  it('flattens a color token to "$color.primary: #ff0000 (color)"', () => {
    const doc = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000' } },
    });
    const lines = flattenTokensForPrompt(doc);
    expect(lines).toContain('$color.primary: #ff0000 (color)');
  });

  it('flattens nested tokens with dot path', () => {
    const doc = makeDoc({
      color: { brand: { primary: { $type: 'color', $value: '#0D99FF' } } },
    });
    const lines = flattenTokensForPrompt(doc);
    expect(lines).toContain('$color.brand.primary: #0D99FF (color)');
  });

  it('skips the metadata key', () => {
    const doc = makeDoc({
      color: { primary: { $type: 'color', $value: '#ff0000' } },
    });
    const lines = flattenTokensForPrompt(doc);
    expect(lines.some(l => l.includes('metadata'))).toBe(false);
  });

  it('handles boolean tokens', () => {
    const doc = makeDoc({
      feature: { darkMode: { $type: 'boolean', $value: true } },
    });
    const lines = flattenTokensForPrompt(doc);
    expect(lines).toContain('$feature.darkMode: true (boolean)');
  });

  it('returns empty array for empty document', () => {
    const doc = makeDoc({});
    const lines = flattenTokensForPrompt(doc);
    expect(lines).toHaveLength(0);
  });
});

describe('buildSystemPrompt', () => {
  it('includes token context when tokenLines are provided', () => {
    const lines = ['$color.primary: #ff0000 (color)'];
    const prompt = buildSystemPrompt(lines);
    expect(prompt).toContain('Available Design Tokens');
    expect(prompt).toContain('$color.primary: #ff0000 (color)');
  });

  it('includes "no tokens" message when tokenLines is empty', () => {
    const prompt = buildSystemPrompt([]);
    expect(prompt).toContain('No design tokens are currently loaded');
  });

  it('includes the JSON schema for design spec nodes', () => {
    const prompt = buildSystemPrompt([]);
    expect(prompt).toContain('"type": "FRAME"');
    expect(prompt).toContain('children');
  });
});

describe('buildUserMessage', () => {
  it('wraps the user prompt with instruction framing', () => {
    const msg = buildUserMessage('Create a login form');
    expect(msg).toContain('Create a login form');
    expect(msg).toContain('JSON design spec');
  });
});

describe('buildReverseSyncSystemPrompt', () => {
  it('includes the exported JSON', () => {
    const prompt = buildReverseSyncSystemPrompt('{"type":"FRAME"}', []);
    expect(prompt).toContain('{"type":"FRAME"}');
  });

  it('includes token context when provided', () => {
    const prompt = buildReverseSyncSystemPrompt('{}', ['$color.bg: #fff (color)']);
    expect(prompt).toContain('$color.bg: #fff (color)');
  });
});

describe('buildReverseSyncUserMessage', () => {
  it('wraps modification request', () => {
    const msg = buildReverseSyncUserMessage('Change the background to blue');
    expect(msg).toContain('Change the background to blue');
    expect(msg).toContain('COMPLETE updated JSON');
  });
});

describe('buildChatSystemPrompt', () => {
  it('includes design system consultant context', () => {
    const prompt = buildChatSystemPrompt([]);
    expect(prompt).toContain('design system consultant');
    expect(prompt).toContain('Claude Bridge');
  });

  it('truncates at 200 tokens with "and N more"', () => {
    const lines = Array.from({ length: 250 }, (_, i) => `$token.${i}: val (color)`);
    const prompt = buildChatSystemPrompt(lines);
    expect(prompt).toContain('and 50 more tokens');
  });

  it('includes selection context when provided', () => {
    const prompt = buildChatSystemPrompt([], 'Frame "Card" 200x300');
    expect(prompt).toContain('Currently selected element');
    expect(prompt).toContain('Frame "Card" 200x300');
  });

  it('omits selection context when not provided', () => {
    const prompt = buildChatSystemPrompt([]);
    expect(prompt).not.toContain('Currently selected element');
  });
});
