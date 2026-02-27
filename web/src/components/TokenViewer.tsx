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

interface TokenViewerProps {
  projectId: string;
}

type FilterType = 'all' | DTCGTokenType;

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  color: { bg: 'bg-pink-50', text: 'text-pink-700' },
  dimension: { bg: 'bg-blue-50', text: 'text-blue-700' },
  string: { bg: 'bg-gray-50', text: 'text-gray-700' },
  boolean: { bg: 'bg-amber-50', text: 'text-amber-700' },
  typography: { bg: 'bg-purple-50', text: 'text-purple-700' },
  shadow: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
};

function TokenTypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] || { bg: 'bg-gray-50', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
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
      className="inline-block h-4 w-4 rounded border border-gray-300 shrink-0"
      style={{ backgroundColor: value }}
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
        <code className="text-xs text-gray-700">{formatted}</code>
      </span>
    );
  }

  if (type === 'boolean') {
    return (
      <span className={`text-xs font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
        {formatted}
      </span>
    );
  }

  if (type === 'typography' || type === 'shadow') {
    return (
      <code className="text-xs text-gray-600 break-all">{formatted}</code>
    );
  }

  return <code className="text-xs text-gray-700">{formatted}</code>;
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
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-sm text-gray-500">Loading tokens from GitHub...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-sm font-semibold text-red-800">Failed to load tokens</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm font-medium text-red-700 hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (emptyMessage) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">{emptyMessage}</p>
          <p className="mt-1 text-xs text-gray-400">Use the Figma plugin to extract and push tokens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Total Tokens</p>
            <p className="text-lg font-semibold text-gray-900">{summary.total}</p>
          </div>
          {Object.entries(summary.byType).map(([type, count]) => (
            <div key={type} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500 capitalize">{type}</p>
              <p className="text-lg font-semibold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* File Info */}
      {(filePath || repo) && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span>{repo} / {filePath}</span>
        </div>
      )}

      {/* Search + Filter */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'color', 'dimension', 'string', 'boolean', 'typography', 'shadow'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterType === f
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="border-t border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-400">
            {filtered.length} token{filtered.length !== 1 ? 's' : ''}
            {filterType !== 'all' && ` (${filterType})`}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Token Table */}
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No tokens match your search.
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {Array.from(grouped.entries()).map(([group, groupTokens]) => (
              <div key={group}>
                {/* Group header */}
                <div className="sticky top-0 z-10 bg-gray-50 border-t border-gray-100 px-4 py-2">
                  <span className="text-xs font-semibold text-gray-500">{group}</span>
                  <span className="ml-2 text-xs text-gray-400">({groupTokens.length})</span>
                </div>
                {/* Token rows */}
                {groupTokens.map((token) => (
                  <div
                    key={token.path}
                    className="flex items-center gap-4 border-t border-gray-50 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{token.name}</p>
                      {token.description && (
                        <p className="text-xs text-gray-400 truncate">{token.description}</p>
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
