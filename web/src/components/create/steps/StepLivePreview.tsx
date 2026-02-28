'use client';

import type { GeneratedDesignSystem } from '@/lib/ai/types';
import { LivePreviewPanel } from '@/components/create/preview/LivePreviewPanel';

interface StepLivePreviewProps {
  designSystem: GeneratedDesignSystem;
  onRefine: () => void;
  onAccept: () => void;
  onBack: () => void;
}

export function StepLivePreview({
  designSystem,
  onRefine,
  onAccept,
  onBack,
}: StepLivePreviewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-2xl sm:text-3xl font-semibold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {designSystem.name}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {designSystem.philosophy}
        </p>

        {/* Principles badges */}
        {designSystem.principles && designSystem.principles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {designSystem.principles.map((principle, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200"
                style={{
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand)',
                  border: '1px solid var(--border-accent)',
                }}
              >
                {principle}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Live Preview */}
      <LivePreviewPanel designSystem={designSystem} />

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-xl px-4 py-2.5 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefine}
            className="btn-ghost rounded-xl px-5 py-2.5 text-sm font-medium flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.33l1.79 3.63 4 .58-2.9 2.82.69 3.97L8 10.49l-3.58 1.84.69-3.97-2.9-2.82 4-.58L8 1.33z"
                fill="var(--brand)"
                opacity="0.6"
              />
              <path
                d="M8 1.33l1.79 3.63 4 .58-2.9 2.82.69 3.97L8 10.49l-3.58 1.84.69-3.97-2.9-2.82 4-.58L8 1.33z"
                stroke="var(--brand)"
                strokeWidth="1"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            Refine with AI
          </button>

          <button
            onClick={onAccept}
            className="btn-gradient rounded-xl px-6 py-2.5 text-sm font-medium"
          >
            <span className="relative z-10">Looks great!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
