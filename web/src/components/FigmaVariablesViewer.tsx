'use client';

import { useEffect, useState, useMemo } from 'react';
import { SearchIcon } from '@/components/Icons';

// Types mirroring the plugin's RawExtractionResult structure
interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  description: string;
  collectionName: string;
  collectionId: string;
  scopes: string[];
  valuesByMode: Record<string, string | number | boolean>;
  defaultValue: string | number | boolean;
  aliasName?: string;
}

interface FigmaTextStyle {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: { value: number; unit: string };
  lineHeight: { value: number; unit: string } | { unit: 'AUTO' };
  paragraphSpacing: number;
  textDecoration: string;
  textCase: string;
}

interface FigmaEffectStyle {
  id: string;
  name: string;
  description: string;
  effects: Array<{
    type: string;
    color: string;
    offsetX: number;
    offsetY: number;
    radius: number;
    spread: number;
  }>;
}

interface FigmaSnapshot {
  variables: FigmaVariable[];
  textStyles: FigmaTextStyle[];
  effectStyles: FigmaEffectStyle[];
}

interface FigmaVariablesViewerProps {
  projectId: string;
}

type FilterType = 'all' | 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' | 'text' | 'effect';

const TYPE_STYLES: Record<string, { background: string; color: string }> = {
  COLOR: { background: 'rgba(236,72,153,0.1)', color: 'rgb(236,72,153)' },
  FLOAT: { background: 'var(--brand-subtle)', color: 'var(--brand)' },
  STRING: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
  BOOLEAN: { background: 'rgba(245,158,11,0.1)', color: 'rgb(245,158,11)' },
  text: { background: 'rgba(168,85,247,0.1)', color: 'rgb(168,85,247)' },
  effect: { background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' },
};

function TypeBadge({ type }: { type: string }) {
  const styles = TYPE_STYLES[type] || { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: styles.background, color: styles.color }}
    >
      {type.toLowerCase()}
    </span>
  );
}

function ColorSwatch({ value }: { value: string }) {
  const isColor = /^#[0-9a-fA-F]{3,8}$/.test(value) || value.startsWith('rgba');
  if (!isColor) return null;
  return (
    <span
      className="inline-block h-4 w-4 rounded border shrink-0"
      style={{ backgroundColor: value, borderColor: 'var(--border-primary)', boxShadow: '0 0 0 1px rgba(0,0,0,0.05)' }}
      title={value}
    />
  );
}

function formatVariableValue(v: FigmaVariable): string {
  const val = v.defaultValue;
  if (val === null || val === undefined) return '\u2014';
  if (v.aliasName) return `\u2192 ${v.aliasName}`;
  if (v.resolvedType === 'BOOLEAN') return val ? 'true' : 'false';
  return String(val);
}

function formatTextStyle(t: FigmaTextStyle): string {
  const lh = 'value' in t.lineHeight ? `/${t.lineHeight.value}` : '/auto';
  return `${t.fontFamily} ${t.fontWeight} ${t.fontSize}px${lh}`;
}

function formatEffectStyle(e: FigmaEffectStyle): string {
  if (e.effects.length === 0) return 'no effects';
  const first = e.effects[0];
  return `${first.type.toLowerCase().replace('_', ' ')} ${first.offsetX}x${first.offsetY} blur ${first.radius}`;
}

// Unified flat item for display
interface DisplayItem {
  id: string;
  name: string;
  group: string;
  type: string;
  value: string;
  description: string;
  colorValue?: string; // raw color for swatch
}

function buildDisplayItems(snapshot: FigmaSnapshot): DisplayItem[] {
  const items: DisplayItem[] = [];

  for (const v of snapshot.variables) {
    const formatted = formatVariableValue(v);
    items.push({
      id: v.id,
      name: v.name,
      group: v.collectionName || '(ungrouped)',
      type: v.resolvedType,
      value: formatted,
      description: v.description,
      colorValue: v.resolvedType === 'COLOR' ? String(v.defaultValue) : undefined,
    });
  }

  for (const t of snapshot.textStyles) {
    items.push({
      id: t.id,
      name: t.name,
      group: 'Text Styles',
      type: 'text',
      value: formatTextStyle(t),
      description: t.description,
    });
  }

  for (const e of snapshot.effectStyles) {
    items.push({
      id: e.id,
      name: e.name,
      group: 'Effect Styles',
      type: 'effect',
      value: formatEffectStyle(e),
      description: e.description,
    });
  }

  return items;
}

export function FigmaVariablesViewer({ projectId }: FigmaVariablesViewerProps) {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const [figmaFileName, setFigmaFileName] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setEmptyMessage(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/figma-variables`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load Figma variables');
          return;
        }

        if (!data.snapshot) {
          setEmptyMessage(data.message || 'No Figma variables snapshot yet.');
          setItems([]);
          return;
        }

        setSnapshotAt(data.snapshotAt);
        setFigmaFileName(data.figmaFileName);

        const snapshot = data.snapshot as FigmaSnapshot;
        setItems(buildDisplayItems(snapshot));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Figma variables');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  // Compute summary
  const summary = useMemo(() => {
    if (items.length === 0) return null;
    const byType: Record<string, number> = {};
    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }
    return { total: items.length, byType };
  }, [items]);

  // Filter + search
  const filtered = useMemo(() => {
    let result = items;
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.group.toLowerCase().includes(q) ||
          t.value.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, filterType, search]);

  // Group filtered items
  const grouped = useMemo(() => {
    const map = new Map<string, DisplayItem[]>();
    for (const item of filtered) {
      const group = map.get(item.group) || [];
      group.push(item);
      map.set(item.group, group);
    }
    return map;
  }, [filtered]);

  // Available filter types
  const availableFilters = useMemo(() => {
    const types = new Set(items.map((i) => i.type));
    return ['all' as FilterType, ...Array.from(types) as FilterType[]];
  }, [items]);

  if (loading) {
    return (
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading Figma variables...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--error)' }}>Failed to load Figma variables</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--error)', opacity: 0.8 }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm font-medium hover:opacity-80"
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
        className="rounded-xl border p-6"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
      >
        <div className="text-center py-8">
          <svg
            className="mx-auto h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
          </svg>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{emptyMessage}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Use the Figma plugin to extract variables, then click &quot;Push Variables to Dashboard&quot;.
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
            className="rounded-lg border p-3"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Items</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{summary.total}</p>
          </div>
          {Object.entries(summary.byType).map(([type, count]) => (
            <div
              key={type}
              className="rounded-lg border p-3"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
            >
              <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{type.toLowerCase()}</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* File Info */}
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
        </svg>
        <span>
          {figmaFileName && <>{figmaFileName} &middot; </>}
          Last pushed: {snapshotAt ? new Date(snapshotAt).toLocaleString() : 'Unknown'}
        </span>
      </div>

      {/* Search + Filter */}
      <div
        className="rounded-xl border"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
      >
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
              <SearchIcon className="h-4 w-4" />
            </span>
            <style>{`
              .figma-vars-search::placeholder { color: var(--text-tertiary); }
              .figma-vars-search:focus { border-color: var(--brand) !important; box-shadow: 0 0 0 1px var(--brand-glow); }
            `}</style>
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="figma-vars-search w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={
                  filterType === f
                    ? { background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: '#fff' }
                    : { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
                }
              >
                {f === 'all' ? 'All' : f.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="border-t px-4 py-2" style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            {filterType !== 'all' && ` (${filterType.toLowerCase()})`}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Variable Table */}
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No variables match your search.
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {Array.from(grouped.entries()).map(([group, groupItems]) => (
              <div key={group}>
                {/* Group header */}
                <div
                  className="sticky top-0 z-10 border-t px-4 py-2"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{group}</span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>({groupItems.length})</span>
                </div>
                {/* Item rows */}
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-t px-4 py-2.5 transition-colors"
                    style={{ borderColor: 'rgba(128,128,128,0.08)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-tertiary)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      {item.description && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{item.description}</p>
                      )}
                    </div>
                    <TypeBadge type={item.type} />
                    <div className="w-40 text-right shrink-0">
                      <span className="flex items-center justify-end gap-2">
                        {item.colorValue && <ColorSwatch value={item.colorValue} />}
                        <code className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.value}</code>
                      </span>
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
