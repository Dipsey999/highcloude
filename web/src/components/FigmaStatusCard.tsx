'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { PaletteIcon } from '@/components/Icons';

interface FigmaVariable {
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  collectionName: string;
}

interface FigmaSnapshot {
  variables: FigmaVariable[];
  textStyles: unknown[];
  effectStyles: unknown[];
}

interface FigmaStatusCardProps {
  projectId: string;
}

const TYPE_COLORS: Record<string, string> = {
  COLOR: 'rgb(236,72,153)',
  FLOAT: 'var(--brand)',
  STRING: 'var(--text-secondary)',
  BOOLEAN: 'rgb(245,158,11)',
  text: 'rgb(168,85,247)',
  effect: 'rgb(99,102,241)',
};

export function FigmaStatusCard({ projectId }: FigmaStatusCardProps) {
  const [snapshot, setSnapshot] = useState<FigmaSnapshot | null>(null);
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const [figmaFileName, setFigmaFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/figma-variables`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load');
          return;
        }
        setSnapshot(data.snapshot || null);
        setSnapshotAt(data.snapshotAt || null);
        setFigmaFileName(data.figmaFileName || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const summary = useMemo(() => {
    if (!snapshot) return null;
    const byType: Record<string, number> = {};
    let total = 0;

    for (const v of snapshot.variables) {
      byType[v.resolvedType] = (byType[v.resolvedType] || 0) + 1;
      total++;
    }
    if (snapshot.textStyles.length > 0) {
      byType['text'] = snapshot.textStyles.length;
      total += snapshot.textStyles.length;
    }
    if (snapshot.effectStyles.length > 0) {
      byType['effect'] = snapshot.effectStyles.length;
      total += snapshot.effectStyles.length;
    }

    const collections = new Set(snapshot.variables.map((v) => v.collectionName));
    return { total, byType, collections: collections.size };
  }, [snapshot]);

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
            <PaletteIcon className="h-3.5 w-3.5 text-white" />
          </span>
          Figma Variables
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
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</span>
        </div>
      )}

      {error && (
        <p className="text-sm py-2" style={{ color: 'var(--error)' }}>{error}</p>
      )}

      {!loading && !error && !snapshot && (
        <div className="py-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No variables pushed yet. Use the Figma plugin to extract and push variables.
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
              items across {summary.collections} collection{summary.collections !== 1 ? 's' : ''}
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
                {count} {type.toLowerCase()}
              </span>
            ))}
          </div>

          {/* Meta info */}
          <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {figmaFileName && <span>Source: {figmaFileName}</span>}
            {snapshotAt && (
              <span>Last pushed: {new Date(snapshotAt).toLocaleString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
