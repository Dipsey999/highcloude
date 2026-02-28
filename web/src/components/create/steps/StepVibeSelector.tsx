'use client';

import type { VibePreset } from '@/lib/ai/types';

interface StepVibeSelectorProps {
  value: VibePreset | null;
  onChange: (vibe: VibePreset) => void;
  onNext: () => void;
  onBack: () => void;
}

interface VibeOption {
  id: VibePreset;
  label: string;
  reference: string;
  colors: string[];
  radius: number;
}

const VIBE_OPTIONS: VibeOption[] = [
  {
    id: 'clean-minimal',
    label: 'Clean & Minimal',
    reference: 'Like Linear or Notion',
    colors: ['#6366f1', '#a5b4fc', '#e0e7ff', '#f1f5f9'],
    radius: 4,
  },
  {
    id: 'professional-trustworthy',
    label: 'Professional & Trustworthy',
    reference: 'Like Stripe or Mercury',
    colors: ['#1e40af', '#3b82f6', '#dbeafe', '#f8fafc'],
    radius: 4,
  },
  {
    id: 'warm-friendly',
    label: 'Warm & Friendly',
    reference: 'Like Slack or Asana',
    colors: ['#ea580c', '#fb923c', '#fed7aa', '#fffbeb'],
    radius: 14,
  },
  {
    id: 'bold-energetic',
    label: 'Bold & Energetic',
    reference: 'Like Vercel or Framer',
    colors: ['#dc2626', '#f97316', '#fbbf24', '#111827'],
    radius: 8,
  },
  {
    id: 'soft-approachable',
    label: 'Soft & Approachable',
    reference: 'Like Calm or Headspace',
    colors: ['#8b5cf6', '#c4b5fd', '#ede9fe', '#faf5ff'],
    radius: 14,
  },
  {
    id: 'custom',
    label: 'Custom',
    reference: 'I have something specific in mind',
    colors: ['#7c3aed', '#06b6d4', '#f59e0b', '#ec4899'],
    radius: 8,
  },
];

function MiniPreview({ vibe }: { vibe: VibeOption }) {
  return (
    <div
      className="w-full h-20 rounded-lg overflow-hidden flex"
      style={{
        background: vibe.id === 'bold-energetic' ? vibe.colors[3] : '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Mini sidebar */}
      <div
        className="w-8 h-full flex flex-col gap-1.5 p-1.5"
        style={{ background: vibe.id === 'bold-energetic' ? '#1f2937' : vibe.colors[2] }}
      >
        <div className="w-full h-1.5 rounded-full" style={{ background: vibe.colors[0] }} />
        <div className="w-full h-1 rounded-full" style={{ background: vibe.colors[1], opacity: 0.5 }} />
        <div className="w-full h-1 rounded-full" style={{ background: vibe.colors[1], opacity: 0.3 }} />
      </div>
      {/* Mini content */}
      <div className="flex-1 p-2 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <div
            className="h-6 flex-1"
            style={{
              background: vibe.colors[2],
              borderRadius: vibe.radius / 2,
            }}
          />
          <div
            className="h-6 flex-1"
            style={{
              background: vibe.colors[2],
              borderRadius: vibe.radius / 2,
            }}
          />
        </div>
        <div className="flex gap-1.5 items-center">
          <div
            className="h-4 px-3"
            style={{
              background: vibe.colors[0],
              borderRadius: vibe.radius / 2,
              minWidth: 32,
            }}
          />
          <div
            className="h-2 flex-1 rounded-full"
            style={{ background: vibe.colors[1], opacity: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

export function StepVibeSelector({ value, onChange, onNext, onBack }: StepVibeSelectorProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2
        className="text-2xl sm:text-3xl font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        What vibe should your product have?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Pick the aesthetic direction. You can always refine later.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {VIBE_OPTIONS.map((vibe) => {
          const isSelected = value === vibe.id;
          return (
            <button
              key={vibe.id}
              onClick={() => onChange(vibe.id)}
              className="text-left rounded-xl p-3 transition-all duration-200"
              style={{
                background: 'var(--bg-elevated)',
                border: isSelected
                  ? '2px solid var(--brand)'
                  : '1px solid var(--border-primary)',
                boxShadow: isSelected ? '0 0 0 3px var(--brand-glow)' : undefined,
              }}
            >
              <MiniPreview vibe={vibe} />
              <p
                className="text-sm font-medium mt-2"
                style={{ color: isSelected ? 'var(--brand)' : 'var(--text-primary)' }}
              >
                {vibe.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {vibe.reference}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-xl px-4 py-2.5 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="btn-gradient rounded-xl px-6 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">Continue</span>
        </button>
      </div>
    </div>
  );
}
