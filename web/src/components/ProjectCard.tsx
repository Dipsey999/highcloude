import Link from 'next/link';
import { GitBranchIcon, PaletteIcon } from '@/components/Icons';

interface ProjectCardProps {
  id: string;
  name: string;
  githubRepo: string;
  githubBranch: string;
  syncMode: string;
  updatedAt: string;
  // Design system status
  hasDesignSystem?: boolean;
  accentColor?: string | null;
  designSystemName?: string | null;
}

export function ProjectCard({
  id,
  name,
  githubRepo,
  githubBranch,
  syncMode,
  updatedAt,
  hasDesignSystem,
  accentColor,
  designSystemName,
}: ProjectCardProps) {
  return (
    <Link
      href={`/dashboard/projects/${id}`}
      className="group block rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--border-primary)',
        background: 'var(--bg-elevated)',
      }}
    >
      {/* Gradient accent line — uses project accent color if design system exists */}
      <div
        className="h-1 w-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: hasDesignSystem && accentColor
            ? `linear-gradient(90deg, ${accentColor}, ${adjustColor(accentColor, 40)})`
            : 'linear-gradient(90deg, var(--gradient-from), var(--gradient-to))',
        }}
      />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {name}
            </h3>
            <p className="mt-1 text-sm truncate font-mono" style={{ color: 'var(--text-secondary)' }}>
              {githubRepo}
            </p>
          </div>
          <span
            className="ml-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}
          >
            {syncMode}
          </span>
        </div>

        {/* Design System Status */}
        {hasDesignSystem ? (
          <div className="mt-3 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: accentColor ? `${accentColor}18` : 'var(--brand-subtle)',
                color: accentColor || 'var(--brand)',
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: accentColor || 'var(--brand)' }}
              />
              {designSystemName || 'Design System'}
            </span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-1.5">
            <PaletteIcon className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              No design system
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="flex items-center gap-1">
            <GitBranchIcon className="h-3.5 w-3.5" />
            {githubBranch}
          </span>
          <span>Updated {new Date(updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}

/** Lighten a hex color by rotating lightness up. Simple approach for gradient end. */
function adjustColor(hex: string, amount: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.min(255, r + amount);
    const ng = Math.min(255, g + amount);
    const nb = Math.min(255, b + amount);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  } catch {
    return hex;
  }
}
