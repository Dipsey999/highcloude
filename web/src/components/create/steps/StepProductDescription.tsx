'use client';

interface StepProductDescriptionProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

const INSPIRATION_CHIPS = [
  'SaaS dashboard for analytics',
  'Marketplace for freelancers',
  'Health & wellness app',
  'Learning platform for students',
  'Fintech app for small businesses',
  'Creative portfolio tool',
  'Project management for remote teams',
  'E-commerce store',
];

export function StepProductDescription({ value, onChange, onNext }: StepProductDescriptionProps) {
  return (
    <div className="max-w-xl mx-auto">
      <h2
        className="text-2xl sm:text-3xl font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        What are you building?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Describe your product in a sentence or two. The more context you give, the better your design system will be.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., A project management tool for remote design teams with real-time collaboration"
        className="input w-full rounded-xl px-4 py-3 text-base resize-none"
        rows={4}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.metaKey && value.trim().length >= 10) {
            onNext();
          }
        }}
      />

      <div className="mt-4">
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Or try one of these:
        </p>
        <div className="flex flex-wrap gap-2">
          {INSPIRATION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => onChange(chip)}
              className="rounded-full px-3 py-1.5 text-xs transition-all duration-200"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={value.trim().length < 10}
          className="btn-gradient rounded-xl px-6 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">Continue</span>
        </button>
      </div>
    </div>
  );
}
