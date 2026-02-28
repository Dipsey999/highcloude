'use client';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div
            key={step}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: isActive ? 32 : 12,
              background: isCompleted
                ? 'var(--brand)'
                : isActive
                  ? 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))'
                  : 'var(--border-primary)',
              opacity: isCompleted || isActive ? 1 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
