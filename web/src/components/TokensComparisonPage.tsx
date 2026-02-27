'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon, ChevronDownIcon, CheckIcon, AlertTriangleIcon, RefreshIcon } from '@/components/Icons';
import { flattenTokenDocument } from '@/lib/tokens';
import {
  compareTokens,
  type FigmaSnapshot,
  type ComparisonResult,
  type ComparisonStatus,
  type ComparisonItem,
} from '@/lib/token-comparison';
import type { FlatToken } from '@/lib/tokens';

interface Project {
  id: string;
  name: string;
  githubRepo: string;
}

interface TokensComparisonPageProps {
  projects: Project[];
}

const STATUS_STYLES: Record<ComparisonStatus, { bg: string; color: string; label: string }> = {
  synced: { bg: 'rgba(34,197,94,0.1)', color: 'var(--success)', label: 'Synced' },
  'needs-sync': { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', label: 'Needs Sync' },
  'figma-only': { bg: 'var(--brand-subtle)', color: 'var(--brand)', label: 'Figma Only' },
  'github-only': { bg: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', label: 'GitHub Only' },
};

function StatusBadge({ status }: { status: ComparisonStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

function ColorSwatch({ value }: { value: string | null }) {
  if (!value) return null;
  const isColor = /^#[0-9a-fA-F]{3,8}$/.test(value) || value.startsWith('rgba');
  if (!isColor) return null;
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded border shrink-0"
      style={{ backgroundColor: value, borderColor: 'var(--border-primary)' }}
      title={value}
    />
  );
}

export function TokensComparisonPage({ projects }: TokensComparisonPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project') || '';

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [figmaSnapshot, setFigmaSnapshot] = useState<FigmaSnapshot | null>(null);
  const [githubTokens, setGithubTokens] = useState<FlatToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ComparisonStatus>('all');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [selectedMode, setSelectedMode] = useState('');

  const loadData = useCallback(async (projectId: string) => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    setFigmaSnapshot(null);
    setGithubTokens([]);

    try {
      const [figmaRes, tokensRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/figma-variables`),
        fetch(`/api/projects/${projectId}/tokens`),
      ]);

      const figmaData = await figmaRes.json();
      const tokensData = await tokensRes.json();

      if (!figmaRes.ok && figmaRes.status !== 200) {
        // Non-fatal: Figma data may not exist yet
      }
      if (!tokensRes.ok && tokensRes.status !== 200) {
        // Non-fatal: GitHub tokens may not exist yet
      }

      if (figmaData.snapshot) {
        setFigmaSnapshot(figmaData.snapshot as FigmaSnapshot);
      }

      if (tokensData.tokens) {
        const flat = flattenTokenDocument(tokensData.tokens);
        setGithubTokens(flat);
      }

      // Auto-select first mode if available
      if (figmaData.snapshot?.variables) {
        const modes = new Set<string>();
        for (const v of figmaData.snapshot.variables) {
          for (const m of Object.keys(v.valuesByMode || {})) {
            modes.add(m);
          }
        }
        const modeList = Array.from(modes).sort();
        if (modeList.length > 0 && !selectedMode) {
          setSelectedMode(modeList[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedMode]);

  useEffect(() => {
    if (selectedProjectId) {
      loadData(selectedProjectId);
    }
  }, [selectedProjectId, loadData]);

  // Build comparison result
  const comparison: ComparisonResult | null = useMemo(() => {
    if (!figmaSnapshot && githubTokens.length === 0) return null;
    return compareTokens(figmaSnapshot, githubTokens, selectedMode || undefined);
  }, [figmaSnapshot, githubTokens, selectedMode]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!comparison) return [];
    let items = comparison.items;

    if (filterStatus !== 'all') {
      items = items.filter((i) => i.status === filterStatus);
    }
    if (selectedCollection !== 'all') {
      items = items.filter((i) => i.collection === selectedCollection);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.matchKey.includes(q) ||
          (i.figmaVariable?.name.toLowerCase().includes(q)) ||
          (i.githubToken?.name.toLowerCase().includes(q)) ||
          (i.figmaValue?.toLowerCase().includes(q)) ||
          (i.githubValue?.toLowerCase().includes(q))
      );
    }
    return items;
  }, [comparison, filterStatus, selectedCollection, search]);

  // Group filtered items by collection
  const grouped = useMemo(() => {
    const map = new Map<string, ComparisonItem[]>();
    for (const item of filteredItems) {
      const group = map.get(item.collection) || [];
      group.push(item);
      map.set(item.collection, group);
    }
    return map;
  }, [filteredItems]);

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    setSearch('');
    setFilterStatus('all');
    setSelectedCollection('all');
    setSelectedMode('');
    // Update URL
    const url = projectId ? `/dashboard/tokens?project=${projectId}` : '/dashboard/tokens';
    router.replace(url, { scroll: false });
  }

  const hasData = figmaSnapshot || githubTokens.length > 0;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Tokens
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Compare Figma local variables with GitHub design tokens.
        </p>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Select Project
        </label>
        <div className="relative max-w-sm">
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="input w-full appearance-none rounded-lg border py-2.5 pl-3 pr-10 text-sm focus:outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Choose a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.githubRepo})
              </option>
            ))}
          </select>
          <ChevronDownIcon
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
        >
          <div className="flex items-center justify-center gap-3">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading Figma variables and GitHub tokens...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}
        >
          <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      {/* No Project Selected */}
      {!selectedProjectId && !loading && (
        <div
          className="rounded-xl border p-12 text-center"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-elevated)',
            borderStyle: 'dashed',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Select a project above to compare Figma variables with GitHub tokens.
          </p>
        </div>
      )}

      {/* No Data State */}
      {selectedProjectId && !loading && !error && !hasData && (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No token data found for this project.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Push Figma variables from the plugin or sync tokens to GitHub.
          </p>
        </div>
      )}

      {/* Comparison View */}
      {selectedProjectId && !loading && !error && hasData && comparison && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryCard label="Total" value={comparison.summary.total} color="var(--text-primary)" />
            <SummaryCard label="Synced" value={comparison.summary.synced} color="var(--success)" />
            <SummaryCard label="Needs Sync" value={comparison.summary.needsSync} color="var(--warning)" />
            <SummaryCard label="Figma Only" value={comparison.summary.figmaOnly} color="var(--brand)" />
            <SummaryCard label="GitHub Only" value={comparison.summary.githubOnly} color="var(--text-tertiary)" />
          </div>

          {/* Controls */}
          <div
            className="rounded-xl border"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <SearchIcon
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Mode selector */}
              {comparison.modes.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="appearance-none rounded-lg border py-2 pl-3 pr-8 text-xs font-medium focus:outline-none"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {comparison.modes.map((mode) => (
                      <option key={mode} value={mode}>
                        Mode: {mode}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                </div>
              )}

              {/* Refresh */}
              <button
                onClick={() => loadData(selectedProjectId)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-secondary)',
                }}
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {/* Status filters */}
              {(['all', 'synced', 'needs-sync', 'figma-only', 'github-only'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={
                    filterStatus === s
                      ? { background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: '#fff' }
                      : { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
                  }
                >
                  {s === 'all' ? 'All' : STATUS_STYLES[s].label}
                </button>
              ))}

              {/* Separator */}
              {comparison.collections.length > 1 && (
                <span className="mx-1 self-center text-xs" style={{ color: 'var(--text-tertiary)' }}>|</span>
              )}

              {/* Collection filters */}
              {comparison.collections.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedCollection('all')}
                    className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    style={
                      selectedCollection === 'all'
                        ? { background: 'var(--brand-subtle)', color: 'var(--brand)' }
                        : { background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }
                    }
                  >
                    All Collections
                  </button>
                  {comparison.collections.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCollection(c)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                      style={
                        selectedCollection === c
                          ? { background: 'var(--brand-subtle)', color: 'var(--brand)' }
                          : { background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }
                      }
                    >
                      {c}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Results count */}
            <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {filteredItems.length} token{filteredItems.length !== 1 ? 's' : ''}
                {filterStatus !== 'all' && ` (${STATUS_STYLES[filterStatus].label.toLowerCase()})`}
                {selectedCollection !== 'all' && ` in ${selectedCollection}`}
                {search && ` matching "${search}"`}
              </p>
            </div>

            {/* Comparison Table */}
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No tokens match your filters.
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {/* Table header */}
                <div
                  className="sticky top-0 z-20 grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-primary)',
                    borderBottom: '1px solid var(--border-primary)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <div className="col-span-4">Name</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-3">Figma Value</div>
                  <div className="col-span-3">GitHub Value</div>
                  <div className="col-span-1">Status</div>
                </div>

                {Array.from(grouped.entries()).map(([collection, groupItems]) => (
                  <div key={collection}>
                    {/* Collection header */}
                    <div
                      className="sticky top-[33px] z-10 px-4 py-2"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderTop: '1px solid var(--border-primary)',
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {collection}
                      </span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        ({groupItems.length})
                      </span>
                    </div>

                    {/* Rows */}
                    {groupItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 items-center px-4 py-2 transition-colors"
                        style={{ borderTop: '1px solid var(--border-primary)' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        {/* Name */}
                        <div className="col-span-4 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {item.figmaVariable?.name || item.githubToken?.name || item.matchKey}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                            {item.matchKey}
                          </p>
                        </div>

                        {/* Type */}
                        <div className="col-span-1">
                          <span
                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                          >
                            {item.type}
                          </span>
                        </div>

                        {/* Figma Value */}
                        <div className="col-span-3 min-w-0">
                          {item.figmaValue ? (
                            <span className="flex items-center gap-1.5">
                              {item.type === 'color' && <ColorSwatch value={item.figmaValue} />}
                              <code className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                {item.figmaValue}
                              </code>
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>
                          )}
                        </div>

                        {/* GitHub Value */}
                        <div className="col-span-3 min-w-0">
                          {item.githubValue ? (
                            <span className="flex items-center gap-1.5">
                              {item.type === 'color' && <ColorSwatch value={item.githubValue} />}
                              <code className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                {item.githubValue}
                              </code>
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
    >
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-lg font-semibold" style={{ color }}>{value}</p>
    </div>
  );
}
