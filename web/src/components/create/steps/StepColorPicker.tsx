'use client';

import { useState, useMemo } from 'react';
import { generateShades } from '@/lib/design-system/color-generation';

interface StepColorPickerProps {
  value: string | null;
  suggestedColor: string;
  onChange: (color: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRESET_COLORS = [
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#f59e0b', name: 'Amber' },
  { hex: '#ea580c', name: 'Orange' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#475569', name: 'Slate' },
];

export function StepColorPicker({
  value,
  suggestedColor,
  onChange,
  onNext,
  onBack,
}: StepColorPickerProps) {
  const [hexInput, setHexInput] = useState(value || suggestedColor);
  const selectedColor = value || suggestedColor;

  const shades = useMemo(() => {
    try {
      return generateShades(selectedColor);
    } catch {
      return null;
    }
  }, [selectedColor]);

  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <h2
          className="text-2xl sm:text-3xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Pick your primary color
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
        >
          Optional
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        We've suggested a color based on your product. Pick one or let the AI decide.
      </p>

      {/* Suggested color */}
      <div
        className="flex items-center gap-3 rounded-xl p-3 mb-4"
        style={{
          background: 'var(--bg-elevated)',
          border: selectedColor === suggestedColor ? '2px solid var(--brand)' : '1px solid var(--border-primary)',
        }}
      >
        <div
          className="w-10 h-10 rounded-lg shrink-0"
          style={{ background: suggestedColor }}
        />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Suggested for you
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
            {suggestedColor}
          </p>
        </div>
      </div>

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.hex}
            onClick={() => {
              onChange(color.hex);
              setHexInput(color.hex);
            }}
            className="group relative"
            title={color.name}
          >
            <div
              className="w-9 h-9 rounded-lg transition-transform duration-200 group-hover:scale-110"
              style={{
                background: color.hex,
                boxShadow: selectedColor === color.hex ? '0 0 0 2px var(--bg-primary), 0 0 0 4px var(--brand)' : undefined,
              }}
            />
          </button>
        ))}
      </div>

      {/* Custom hex input */}
      <div className="flex gap-2 items-center mb-4">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => {
            onChange(e.target.value);
            setHexInput(e.target.value);
          }}
          className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#6366f1"
          className="input rounded-lg px-3 py-2 text-sm font-mono w-28"
        />
      </div>

      {/* Shade preview */}
      {shades && (
        <div className="flex rounded-lg overflow-hidden h-8">
          {Object.entries(shades).map(([step, hex]) => (
            <div
              key={step}
              className="flex-1 transition-colors duration-200"
              style={{ background: hex }}
              title={`${step}: ${hex}`}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-xl px-4 py-2.5 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => { onChange(''); onNext(); }}
            className="rounded-xl px-4 py-2.5 text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Let AI decide
          </button>
          <button
            onClick={onNext}
            className="btn-gradient rounded-xl px-6 py-2.5 text-sm font-medium"
          >
            <span className="relative z-10">Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
