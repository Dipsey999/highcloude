'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { DatabaseIcon } from '@/components/Icons';
import { flattenTokenDocument, computeTokenSummary, type TokenSummary } from '@/lib/tokens';

interface TokenStatusCardProps {
  projectId: string;
}

const TYPE_COLORS: Record<string, string> = {
  color: 'rgb(236,72,153)',
  dimension: 'var(--brand)',
  string: 'var(--text-secondary)',
  boolean: 'rgb(245,158,11)',
  typography: 'rgb(168,85,247)',
  shadow: 'rgb(99,102,241)',
};

export function TokenStatusCard({ projectId }: TokenStatusCardProps) {
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setIsEmpty(false);
      try {
        const res = await fetch(`/api/projects/${projectId}/tokens`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load');
          return;
        }
        if (!data.tokens) {
          setIsEmpty(true);
          return;
        }
        setFilePath(data.filePath || null);
        setRepo(data.repo || null);
        const flat = flattenTokenDocument(data.tokens);
        setSummary(computeTokenSummary(flat));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        borderColor: 'var(--border-primary)',
        background: 'var(--bg-elevated)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-hover))' }}
          >
            <DatabaseIcon className="h-3.5 w-3.5 text-white" />
          </span>
          GitHub Design Tokens
        </h3>
        <Link
          href={`/dashboard/tokens?project=${projectId}`}
          className="text-xs font-medium transition-colors"
          style={{ color: 'var(--brand)' }}
        >
          View in Tokens →
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading from GitHub...</span>
        </div>
      )}

      {error && (
        <p className="text-sm py-2" style={{ color: 'var(--error)' }}>{error}</p>
      )}

      {!loading && !error && isEmpty && (
        <div className="py-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Token file not found in repository. Sync from Figma to create it.
          </p>
        </div>
      )}

      {!loading && !error && summary && (
        <div className="space-y-3">
          {/* Big number */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {summary.total}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              tokens across {summary.groups.length} group{summary.groups.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Type breakdown */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byType).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: TYPE_COLORS[type] || 'var(--text-secondary)',
                }}
              >
                {count} {type}
              </span>
            ))}
          </div>

          {/* Meta info */}
          {(repo || filePath) && (
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span className="font-mono">{repo} / {filePath}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
