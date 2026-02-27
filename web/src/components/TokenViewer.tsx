'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  flattenTokenDocument,
  computeTokenSummary,
  formatTokenValue,
  type FlatToken,
  type TokenSummary,
  type DTCGTokenType,
} from '@/lib/tokens';
import { SearchIcon, FileIcon } from '@/components/Icons';

interface TokenViewerProps {
  projectId: string;
}

type FilterType = 'all' | DTCGTokenType;

const TYPE_STYLES: Record<string, { background: string; color: string }> = {
  color: { background: 'rgba(236,72,153,0.1)', color: 'rgb(236,72,153)' },
  dimension: { background: 'var(--brand-subtle)', color: 'var(--brand)' },
  string: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
  boolean: { background: 'rgba(245,158,11,0.1)', color: 'rgb(245,158,11)' },
  typography: { background: 'rgba(168,85,247,0.1)', color: 'rgb(168,85,247)' },
  shadow: { background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' },
};

function TokenTypeBadge({ type }: { type: string }) {
  const styles = TYPE_STYLES[type] || { background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: styles.background, color: styles.color }}
    >
      {type}
    </span>
  );
}

function ColorSwatch({ value }: { value: string }) {
  // Handle hex colors and rgba
  const isColor = /^#[0-9a-fA-F]{3,8}$/.test(value) || value.startsWith('rgba');
  if (!isColor) return null;
  return (
    <span
      className="inline-block h-4 w-4 rounded shrink-0"
      style={{
        backgroundColor: value,
        border: '1px solid var(--border-primary)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}
      title={value}
    />
  );
}

function TokenValueDisplay({ type, value }: { type: DTCGTokenType; value: unknown }) {
  const formatted = formatTokenValue(type, value);

  if (type === 'color' && typeof value === 'string') {
    return (
      <span className="flex items-center gap-2">
        <ColorSwatch value={value} />
        <code className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatted}</code>
      </span>
    );
  }

  if (type === 'boolean') {
    return (
      <span
        className="text-xs font-medium"
        style={{ color: value ? 'var(--success)' : 'var(--error)' }}
      >
        {formatted}
      </span>
    );
  }

  if (type === 'typography' || type === 'shadow') {
    return (
      <code className="text-xs break-all" style={{ color: 'var(--text-tertiary)' }}>{formatted}</code>
    );
  }

  return <code className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatted}</code>;
}

export function TokenViewer({ projectId }: TokenViewerProps) {
  const [tokens, setTokens] = useState<FlatToken[]>([]);
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setEmptyMessage(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/tokens`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load tokens');
          return;
        }

        if (!data.tokens) {
          setEmptyMessage(data.message || 'No tokens found.');
          setTokens([]);
          setSummary(null);
          return;
        }

        setFilePath(data.filePath || null);
        setRepo(data.repo || null);

        const flat = flattenTokenDocument(data.tokens);
        setTokens(flat);
        setSummary(computeTokenSummary(flat));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tokens');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const filtered = useMemo(() => {
    let result = tokens;
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.path.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          formatTokenValue(t.type, t.value).toLowerCase().includes(q)
      );
    }
    return result;
  }, [tokens, filterType, search]);

  // Group filtered tokens
  const grouped = useMemo(() => {
    const map = new Map<string, FlatToken[]>();
    for (const t of filtered) {
      const group = map.get(t.group) || [];
      group.push(t);
      map.set(t.group, group);
    }
    return map;
  }, [filtered]);

  if (loading) {
    return (
      <div
        className="rounded-xl p-6 backdrop-blur-sm"
        style={{
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-elevated)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading tokens from GitHub...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-6 backdrop-blur-sm"
        style={{
          border: '1px solid rgba(239,68,68,0.3)',
          background: 'rgba(239,68,68,0.05)',
        }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--error)' }}>
          Failed to load tokens
        </h3>
        <p className="mt-1 text-sm" style={{ color: 'rgba(239,68,68,0.8)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm font-medium transition-colors"
          style={{ color: 'var(--error)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (emptyMessage) {
    return (
      <div
        className="rounded-xl p-6 backdrop-blur-sm"
        style={{
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-elevated)',
        }}
      >
        <div className="text-center py-8">
          <svg
            className="mx-auto h-10 w-10"
            style={{ color: 'var(--text-tertiary)' }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{emptyMessage}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Use the Figma plugin to extract and push tokens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div
            className="rounded-lg p-3 backdrop-blur-sm"
            style={{
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-elevated)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Tokens</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{summary.total}</p>
          </div>
          {Object.entries(summary.byType).map(([type, count]) => (
            <div
              key={type}
              className="rounded-lg p-3 backdrop-blur-sm"
              style={{
                border: '1px solid var(--border-primary)',
                background: 'var(--bg-elevated)',
              }}
            >
              <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{type}</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* File Info */}
      {(filePath || repo) && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <FileIcon className="h-3.5 w-3.5" />
          <span>{repo} / {filePath}</span>
        </div>
      )}

      {/* Search + Filter */}
      <div
        className="rounded-xl backdrop-blur-sm"
        style={{
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-elevated)',
        }}
      >
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg py-2 pl-9 pr-3 text-sm placeholder:opacity-50 focus:outline-none focus:ring-1"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'color', 'dimension', 'string', 'boolean', 'typography', 'shadow'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={
                  filterType === f
                    ? {
                        background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                        color: '#ffffff',
                      }
                    : {
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                      }
                }
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {filtered.length} token{filtered.length !== 1 ? 's' : ''}
            {filterType !== 'all' && ` (${filterType})`}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Token Table */}
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No tokens match your search.
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {Array.from(grouped.entries()).map(([group, groupTokens]) => (
              <div key={group}>
                {/* Group header */}
                <div
                  className="sticky top-0 z-10 px-4 py-2"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-primary)',
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{group}</span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>({groupTokens.length})</span>
                </div>
                {/* Token rows */}
                {groupTokens.map((token) => (
                  <div
                    key={token.path}
                    className="flex items-center gap-4 px-4 py-2.5 transition-colors"
                    style={{ borderTop: '1px solid var(--border-primary)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{token.name}</p>
                      {token.description && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{token.description}</p>
                      )}
                    </div>
                    <TokenTypeBadge type={token.type} />
                    <div className="w-40 text-right shrink-0">
                      <TokenValueDisplay type={token.type} value={token.value} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
