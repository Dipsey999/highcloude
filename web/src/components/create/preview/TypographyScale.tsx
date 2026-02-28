'use client';

import { useMemo } from 'react';
import type { GeneratedDesignSystem } from '@/lib/ai/types';
import { TYPE_SCALE_RATIOS, type TypeScale } from '@/lib/design-system/domain-presets';
import { generateShades } from '@/lib/design-system/color-generation';

interface TypographyScaleProps {
  designSystem: GeneratedDesignSystem;
}

const STEPS = [
  { label: 'xs', index: 0 },
  { label: 'sm', index: 1 },
  { label: 'base', index: 2 },
  { label: 'md', index: 3 },
  { label: 'lg', index: 4 },
  { label: 'xl', index: 5 },
  { label: '2xl', index: 6 },
  { label: '3xl', index: 7 },
  { label: '4xl', index: 8 },
];

const WEIGHT_LABELS: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semibold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
};

export function TypographyScale({ designSystem }: TypographyScaleProps) {
  const { config } = designSystem;
  const bodyFont = config.typography.fontFamily;
  const headingFont = config.typography.headingFontFamily;
  const baseSize = config.typography.baseSize;
  const scaleKey = config.typography.scale as TypeScale;
  const ratio = TYPE_SCALE_RATIOS[scaleKey] || 1.25;
  const weights = config.typography.weights;

  const shades = useMemo(() => generateShades(config.color.primaryColor), [config.color.primaryColor]);

  const computedSizes = useMemo(() => {
    return STEPS.map(({ label, index }) => {
      const exponent = index - 2; // base is index 2
      const size = baseSize * Math.pow(ratio, exponent);
      return {
        label,
        size: Math.round(size * 100) / 100,
        sizeRounded: Math.round(size),
      };
    });
  }, [baseSize, ratio]);

  return (
    <div className="p-6" style={{ fontFamily: bodyFont }}>
      <div className="mb-6">
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: 'var(--text-primary)', fontFamily: headingFont }}
        >
          Typography Scale
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Base size{' '}
          <span className="font-mono text-xs font-medium" style={{ color: shades['500'] }}>
            {baseSize}px
          </span>
          {' '}with{' '}
          <span className="font-medium">{scaleKey}</span>
          {' '}ratio{' '}
          <span className="font-mono text-xs font-medium" style={{ color: shades['500'] }}>
            {ratio}
          </span>
        </p>
      </div>

      {/* Font info header */}
      <div
        className="rounded-xl p-4 mb-6 grid grid-cols-2 gap-4"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div>
          <p className="text-[10px] mb-1" style={{ color: 'var(--text-tertiary)' }}>Body Font</p>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)', fontFamily: bodyFont }}
          >
            {bodyFont}
          </p>
        </div>
        <div>
          <p className="text-[10px] mb-1" style={{ color: 'var(--text-tertiary)' }}>Heading Font</p>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)', fontFamily: headingFont }}
          >
            {headingFont}
          </p>
        </div>
      </div>

      {/* Type scale rows */}
      <div className="space-y-1 mb-8">
        {computedSizes.map((step) => (
          <div
            key={step.label}
            className="flex items-baseline gap-4 py-3 border-b"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {/* Step label */}
            <div className="w-12 shrink-0">
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: 'monospace',
                  color: shades['700'],
                  background: shades['50'],
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Size value */}
            <div className="w-14 shrink-0 text-right">
              <span
                className="text-[11px] font-mono"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {step.sizeRounded}px
              </span>
            </div>

            {/* Sample text */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p
                className="truncate"
                style={{
                  fontSize: `${step.sizeRounded}px`,
                  fontFamily: step.label.startsWith('2') || step.label.startsWith('3') || step.label.startsWith('4') || step.label === 'xl' || step.label === 'lg'
                    ? headingFont
                    : bodyFont,
                  fontWeight: step.label === 'xs' || step.label === 'sm' ? 400 : step.label === 'base' || step.label === 'md' ? 500 : 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                }}
              >
                {step.label === 'xs' || step.label === 'sm'
                  ? 'The quick brown fox jumps over the lazy dog'
                  : step.label === 'base'
                    ? 'Body text for paragraphs and content'
                    : step.label === 'md'
                      ? 'Medium headings and labels'
                      : step.label === 'lg'
                        ? 'Section headings'
                        : step.label === 'xl'
                          ? 'Page Titles'
                          : step.label === '2xl'
                            ? 'Large Titles'
                            : step.label === '3xl'
                              ? 'Display'
                              : 'Hero Text'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Font weights section */}
      <div>
        <h3
          className="text-sm font-semibold mb-4"
          style={{ color: 'var(--text-primary)', fontFamily: headingFont }}
        >
          Font Weights
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {weights.map((weight) => (
            <div
              key={weight}
              className="rounded-lg p-3"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <p
                className="text-base mb-1"
                style={{
                  fontWeight: weight,
                  fontFamily: bodyFont,
                  color: 'var(--text-primary)',
                }}
              >
                Aa
              </p>
              <p className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {weight}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {WEIGHT_LABELS[weight] || `Weight ${weight}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Body vs heading font comparison */}
      {bodyFont !== headingFont && (
        <div className="mt-8">
          <h3
            className="text-sm font-semibold mb-4"
            style={{ color: 'var(--text-primary)', fontFamily: headingFont }}
          >
            Font Pairing
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <p className="text-[10px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Heading Font
              </p>
              <p
                className="text-xl font-semibold mb-1"
                style={{ fontFamily: headingFont, color: 'var(--text-primary)' }}
              >
                {headingFont}
              </p>
              <p
                className="text-sm"
                style={{ fontFamily: headingFont, color: 'var(--text-secondary)' }}
              >
                ABCDEFGHIJKLM
              </p>
              <p
                className="text-sm"
                style={{ fontFamily: headingFont, color: 'var(--text-secondary)' }}
              >
                abcdefghijklm
              </p>
              <p
                className="text-sm"
                style={{ fontFamily: headingFont, color: 'var(--text-secondary)' }}
              >
                0123456789
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <p className="text-[10px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Body Font
              </p>
              <p
                className="text-xl font-semibold mb-1"
                style={{ fontFamily: bodyFont, color: 'var(--text-primary)' }}
              >
                {bodyFont}
              </p>
              <p
                className="text-sm"
                style={{ fontFamily: bodyFont, color: 'var(--text-secondary)' }}
              >
                ABCDEFGHIJKLM
              </p>
              <p
                className="text-sm"
                style={{ fontFamily: bodyFont, color: 'var(--text-secondary)' }}
              >
                abcdefghijklm
              </p>
              <p
                className="text-sm"
                style={{ fontFamily: bodyFont, color: 'var(--text-secondary)' }}
              >
                0123456789
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
