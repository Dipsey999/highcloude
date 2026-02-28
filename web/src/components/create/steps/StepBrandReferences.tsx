'use client';

interface StepBrandReferencesProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BRAND_CHIPS = [
  'Linear', 'Stripe', 'Notion', 'Slack', 'Vercel',
  'Figma', 'Spotify', 'Airbnb', 'GitHub', 'Shopify',
];

export function StepBrandReferences({ value, onChange, onNext, onBack }: StepBrandReferencesProps) {
  const addBrand = (brand: string) => {
    const current = value ? value.split(',').map((b) => b.trim()).filter(Boolean) : [];
    if (!current.includes(brand)) {
      onChange([...current, brand].join(', '));
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <h2
          className="text-2xl sm:text-3xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Any brands you admire?
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-tertiary)',
          }}
        >
          Optional
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        This helps the AI understand your aesthetic preferences. No need to copy their design — just the vibe.
      </p>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Linear, Stripe, Notion"
        className="input w-full rounded-xl px-4 py-3 text-base"
      />

      <div className="mt-4">
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Quick add:
        </p>
        <div className="flex flex-wrap gap-2">
          {BRAND_CHIPS.map((brand) => (
            <button
              key={brand}
              onClick={() => addBrand(brand)}
              className="rounded-full px-3 py-1.5 text-xs transition-all duration-200"
              style={{
                background: value.includes(brand) ? 'var(--brand-subtle)' : 'var(--bg-tertiary)',
                color: value.includes(brand) ? 'var(--brand)' : 'var(--text-secondary)',
                border: value.includes(brand) ? '1px solid var(--brand)' : '1px solid var(--border-primary)',
              }}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

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
            onClick={onNext}
            className="rounded-xl px-4 py-2.5 text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Skip
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
