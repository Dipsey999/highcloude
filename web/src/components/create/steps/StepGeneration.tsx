'use client';

import { useState, useEffect, useRef } from 'react';

interface StepGenerationProps {
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onBack: () => void;
}

const PROGRESS_STEPS = [
  'Analyzing your product description...',
  'Choosing color palette and typography...',
  'Building component tokens...',
  'Generating documentation...',
];

export function StepGeneration({
  isGenerating,
  error,
  onGenerate,
  onBack,
}: StepGenerationProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Animate progress steps when generating
  useEffect(() => {
    if (isGenerating) {
      setCompletedSteps([]);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      const delays = [3000, 6000, 10000, 14000];
      delays.forEach((delay, index) => {
        const timer = setTimeout(() => {
          setCompletedSteps((prev) => [...prev, index]);
        }, delay);
        timersRef.current.push(timer);
      });
    } else {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [isGenerating]);

  // --- Generating state ---
  if (isGenerating) {
    return (
      <div className="max-w-lg mx-auto text-center">
        {/* Spinner */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-full"
            style={{
              border: '3px solid var(--bg-tertiary)',
              borderTopColor: 'var(--brand)',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>

        <h2
          className="text-2xl sm:text-3xl font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Generating your design system...
        </h2>
        <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
          This usually takes 10-20 seconds
        </p>

        {/* Progress steps */}
        <div className="space-y-3 text-left max-w-sm mx-auto">
          {PROGRESS_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isActive = !isCompleted && (
              index === 0 || completedSteps.includes(index - 1)
            );

            return (
              <div
                key={index}
                className="flex items-center gap-3 transition-all duration-500"
                style={{
                  opacity: isCompleted || isActive ? 1 : 0.3,
                  transform: isCompleted || isActive ? 'translateX(0)' : 'translateX(8px)',
                }}
              >
                {/* Step indicator */}
                <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                  {isCompleted ? (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{ background: 'var(--success)', color: '#fff' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M3 7L6 10L11 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{
                        border: '2px solid var(--brand)',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  ) : (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--text-tertiary)' }}
                    />
                  )}
                </div>

                {/* Step text */}
                <span
                  className="text-sm"
                  style={{
                    color: isCompleted
                      ? 'var(--text-primary)'
                      : isActive
                      ? 'var(--text-secondary)'
                      : 'var(--text-tertiary)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--error-subtle)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M12 3l9.66 16.59A1 1 0 0120.66 21H3.34a1 1 0 01-.86-1.41L12 3z"
              stroke="var(--error)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2
          className="text-2xl sm:text-3xl font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Something went wrong
        </h2>

        <div
          className="rounded-xl p-4 mb-8 text-sm text-left"
          style={{
            background: 'var(--error-subtle)',
            border: '1px solid var(--error)',
            color: 'var(--error)',
          }}
        >
          {error}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="rounded-xl px-4 py-2.5 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Back
          </button>
          <button
            onClick={onGenerate}
            className="btn-gradient rounded-xl px-6 py-2.5 text-sm font-medium"
          >
            <span className="relative z-10">Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Ready state ---
  return (
    <div className="max-w-lg mx-auto text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{
          background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
          boxShadow: '0 8px 32px var(--brand-glow)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="#fff"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        className="text-2xl sm:text-3xl font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Ready to generate
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        We have everything we need. Let the AI create your custom design system.
      </p>

      <button
        onClick={onGenerate}
        className="btn-gradient rounded-xl px-10 py-3.5 text-base font-medium w-full sm:w-auto"
      >
        <span className="relative z-10">Generate Design System</span>
      </button>

      <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
        This usually takes 10-20 seconds
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
