'use client';

import { useMemo } from 'react';
import type { GeneratedDesignSystem } from '@/lib/ai/types';
import { generateFullPalette, type PaletteMode } from '@/lib/design-system/color-generation';

interface ColorPaletteDisplayProps {
  designSystem: GeneratedDesignSystem;
}

const SHADE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const SCALE_LABELS: { key: 'primary' | 'secondary' | 'accent' | 'neutral'; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'neutral', label: 'Neutral' },
];

function contrastColor(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000000' : '#ffffff';
}

export function ColorPaletteDisplay({ designSystem }: ColorPaletteDisplayProps) {
  const { config } = designSystem;

  const palette = useMemo(
    () => generateFullPalette(config.color.primaryColor, config.color.paletteMode as PaletteMode),
    [config.color.primaryColor, config.color.paletteMode]
  );

  const semanticColors: { key: 'success' | 'warning' | 'error' | 'info'; label: string }[] = [
    { key: 'success', label: 'Success' },
    { key: 'warning', label: 'Warning' },
    { key: 'error', label: 'Error' },
    { key: 'info', label: 'Info' },
  ];

  return (
    <div className="p-6" style={{ fontFamily: config.typography.fontFamily }}>
      <div className="mb-6">
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: 'var(--text-primary)', fontFamily: config.typography.headingFontFamily }}
        >
          Color Palette
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Generated from{' '}
          <span className="font-mono text-xs" style={{ color: config.color.primaryColor }}>
            {config.color.primaryColor}
          </span>{' '}
          using{' '}
          <span className="font-medium">{config.color.paletteMode}</span>{' '}
          harmony.
        </p>
      </div>

      {/* Color scales */}
      <div className="space-y-6">
        {SCALE_LABELS.map(({ key, label }) => {
          const scaleShades = palette[key];
          return (
            <div key={key}>
              <p
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {label}
              </p>
              <div className="flex rounded-xl overflow-hidden">
                {SHADE_STEPS.map((step) => {
                  const color = scaleShades[step];
                  return (
                    <div
                      key={step}
                      className="flex-1 flex flex-col items-center justify-end group relative"
                      style={{
                        background: color,
                        minHeight: '64px',
                        padding: '4px 0',
                      }}
                    >
                      <span
                        className="text-[9px] font-medium opacity-80"
                        style={{ color: contrastColor(color) }}
                      >
                        {step}
                      </span>
                      {/* Hover tooltip */}
                      <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                        style={{
                          background: '#1e293b',
                          color: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {color}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Semantic colors */}
      <div className="mt-8">
        <p
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Semantic Colors
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          {semanticColors.map(({ key, label }) => {
            const color = palette[key];
            return (
              <div key={key} className="flex items-center gap-2">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 2px 8px ${color}44`,
                    border: '2px solid #ffffff',
                  }}
                />
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-[10px] font-mono"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {color}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary color info */}
      <div
        className="mt-8 rounded-xl p-4"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Base Configuration
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Primary</p>
            <p className="text-xs font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
              {config.color.primaryColor}
            </p>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Harmony</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {config.color.paletteMode}
            </p>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Shades</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              50 - 950
            </p>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Scales</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              4 color scales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
