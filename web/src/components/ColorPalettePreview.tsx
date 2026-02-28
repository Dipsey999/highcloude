'use client';

interface ColorPalettePreviewProps {
  shades: Record<string, string>;
  label?: string;
  compact?: boolean;
}

const SHADE_ORDER = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export function ColorPalettePreview({ shades, label, compact }: ColorPalettePreviewProps) {
  const orderedShades = SHADE_ORDER.filter((s) => s in shades);

  return (
    <div>
      {label && (
        <p
          className="mb-1.5 text-xs font-medium capitalize"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </p>
      )}
      <div className="flex gap-0.5">
        {orderedShades.map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={`rounded ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}
              style={{ backgroundColor: shades[step] }}
              title={`${step}: ${shades[step]}`}
            />
            {!compact && (
              <span
                className="mt-1 text-[9px] tabular-nums"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {step}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SemanticColorDots({
  colors,
}: {
  colors: { success: string; warning: string; error: string; info: string };
}) {
  const items = [
    { label: 'Success', color: colors.success },
    { label: 'Warning', color: colors.warning },
    { label: 'Error', color: colors.error },
    { label: 'Info', color: colors.info },
  ];

  return (
    <div className="flex gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
