import Link from 'next/link';

interface DesignSystemCardProps {
  id: string;
  name: string;
  domain: string;
  companyName?: string | null;
  colorConfig: { primaryColor?: string };
  componentConfig: { selectedComponents?: string[] };
  updatedAt: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  tech: 'Technology',
  healthcare: 'Healthcare',
  finance: 'Finance',
  education: 'Education',
  ecommerce: 'E-Commerce',
  creative: 'Creative',
  enterprise: 'Enterprise',
};

export function DesignSystemCard({
  id,
  name,
  domain,
  companyName,
  colorConfig,
  componentConfig,
  updatedAt,
}: DesignSystemCardProps) {
  const primaryColor = colorConfig?.primaryColor || '#6366f1';
  const componentCount = componentConfig?.selectedComponents?.length ?? 0;

  return (
    <Link
      href={`/dashboard/design-systems/${id}`}
      className="group block rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--border-primary)',
        background: 'var(--bg-elevated)',
      }}
    >
      {/* Color accent line */}
      <div
        className="h-1 w-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }}
      />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3
              className="text-base font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {name}
            </h3>
            {companyName && (
              <p
                className="mt-0.5 text-sm truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {companyName}
              </p>
            )}
          </div>
          <span
            className="ml-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}
          >
            {DOMAIN_LABELS[domain] || domain}
          </span>
        </div>

        {/* Color preview */}
        <div className="mt-4 flex gap-1">
          {['50', '200', '400', '500', '600', '800'].map((shade) => (
            <div
              key={shade}
              className="h-5 flex-1 first:rounded-l last:rounded-r"
              style={{ backgroundColor: `${primaryColor}${shade === '50' ? '22' : shade === '200' ? '55' : shade === '400' ? 'aa' : shade === '500' ? '' : shade === '600' ? 'dd' : '44'}` }}
            />
          ))}
        </div>

        <div
          className="mt-4 flex items-center gap-4 text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>{componentCount} components</span>
          <span>Updated {new Date(updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
