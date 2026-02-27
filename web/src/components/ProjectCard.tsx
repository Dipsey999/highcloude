import Link from 'next/link';
import { GitBranchIcon } from '@/components/Icons';

interface ProjectCardProps {
  id: string;
  name: string;
  githubRepo: string;
  githubBranch: string;
  syncMode: string;
  updatedAt: string;
}

export function ProjectCard({ id, name, githubRepo, githubBranch, syncMode, updatedAt }: ProjectCardProps) {
  return (
    <Link
      href={`/dashboard/projects/${id}`}
      className="group block rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--border-primary)',
        background: 'var(--bg-elevated)',
      }}
    >
      {/* Gradient accent line */}
      <div
        className="h-1 w-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'linear-gradient(90deg, var(--gradient-from), var(--gradient-to))' }}
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
        <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
