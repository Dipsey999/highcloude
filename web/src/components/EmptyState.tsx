import Link from 'next/link';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center animate-fade-in"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
        style={{
          background: 'linear-gradient(135deg, var(--brand-subtle), var(--bg-tertiary))',
          color: 'var(--brand)',
        }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="mt-1 text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-gradient mt-6 rounded-lg px-5 py-2.5 text-sm font-medium">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
