'use client';

import type { GeneratedDesignSystem } from '@/lib/ai/types';

interface StepSignupWallProps {
  designSystem: GeneratedDesignSystem;
  isAuthenticated: boolean;
  isSaving: boolean;
  onSave: () => void;
  onSignUp: () => void;
  onBack: () => void;
}

const SIGNUP_FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: 'Export as CSS, SCSS, JSON tokens',
    description: 'Ready-to-use design tokens for any framework',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: 'Sync to GitHub repo',
    description: 'Auto-commit tokens on every change',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points="12,15 17,21 7,21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
    title: 'Connect Figma plugin',
    description: 'Keep design and code in perfect sync',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
    title: 'Refine anytime from dashboard',
    description: 'Iterate on your design system whenever you need',
  },
];

function DesignSystemSummaryCard({ designSystem }: { designSystem: GeneratedDesignSystem }) {
  const primaryColor = designSystem.config.color.primaryColor;
  const fontFamily = designSystem.config.typography.fontFamily;
  const componentCount = designSystem.config.components?.length ?? 0;

  return (
    <div
      className="rounded-xl p-5 transition-all duration-200"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Color swatch */}
        <div
          className="w-12 h-12 rounded-xl shrink-0"
          style={{
            background: primaryColor,
            boxShadow: `0 4px 14px ${primaryColor}33`,
          }}
        />

        <div className="flex-1 min-w-0">
          <h4
            className="text-base font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {designSystem.name}
          </h4>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ background: primaryColor }}
              />
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {primaryColor}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-tertiary)' }}>
                <path
                  d="M4 7V4h16v3M9 20h6M12 4v16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {fontFamily}
              </span>
            </div>

            {componentCount > 0 && (
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-tertiary)' }}>
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {componentCount} components
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepSignupWall({
  designSystem,
  isAuthenticated,
  isSaving,
  onSave,
  onSignUp,
  onBack,
}: StepSignupWallProps) {
  // --- Authenticated: Save flow ---
  if (isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'var(--success-subtle)',
            color: 'var(--success)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 21v-8H7v8M7 3v5h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2
          className="text-2xl sm:text-3xl font-semibold mb-2 text-center"
          style={{ color: 'var(--text-primary)' }}
        >
          Save your design system
        </h2>
        <p
          className="text-sm text-center mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          Add it to your projects to export tokens, sync integrations, and refine later.
        </p>

        <DesignSystemSummaryCard designSystem={designSystem} />

        <div className="mt-8 flex justify-center">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn-gradient rounded-xl px-8 py-3 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span className="relative z-10">Saving...</span>
              </>
            ) : (
              <span className="relative z-10">Save as Project</span>
            )}
          </button>
        </div>

        <div className="mt-10 flex justify-start">
          <button
            onClick={onBack}
            className="rounded-xl px-4 py-2.5 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // --- Unauthenticated: Signup wall ---
  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Hero icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{
          background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
          boxShadow: '0 8px 32px var(--brand-glow)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 12l2 2 4-4"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
      </div>

      <h2
        className="text-2xl sm:text-3xl font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Your design system is ready!
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Sign up to save it, export tokens, and sync with your tools.
      </p>

      {/* Summary card */}
      <div className="text-left mb-8">
        <DesignSystemSummaryCard designSystem={designSystem} />
      </div>

      {/* Feature list */}
      <div className="text-left space-y-3 mb-8">
        {SIGNUP_FEATURES.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl p-3 transition-all duration-200"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <div
              className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
              style={{
                background: 'var(--brand-subtle)',
                color: 'var(--brand)',
              }}
            >
              {feature.icon}
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {feature.title}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sign up CTA */}
      <button
        onClick={onSignUp}
        className="btn-gradient rounded-xl px-8 py-3.5 text-base font-medium w-full flex items-center justify-center gap-2.5"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="relative z-10">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <span className="relative z-10">Sign up with GitHub</span>
      </button>

      <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
        Your design system will be saved automatically after signup
      </p>

      <div className="mt-10 flex justify-start">
        <button
          onClick={onBack}
          className="rounded-xl px-4 py-2.5 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
