'use client';

import { useEffect, useState, useMemo } from 'react';

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

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  COLOR: { bg: 'bg-pink-50', text: 'text-pink-700' },
  FLOAT: { bg: 'bg-blue-50', text: 'text-blue-700' },
  STRING: { bg: 'bg-gray-50', text: 'text-gray-700' },
  BOOLEAN: { bg: 'bg-amber-50', text: 'text-amber-700' },
  text: { bg: 'bg-purple-50', text: 'text-purple-700' },
  effect: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
};

function TypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] || { bg: 'bg-gray-50', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
      {type.toLowerCase()}
    </span>
  );
}

function ColorSwatch({ value }: { value: string }) {
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
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span className="text-sm text-gray-500">Loading Figma variables...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-sm font-semibold text-red-800">Failed to load Figma variables</h3>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">{emptyMessage}</p>
          <p className="mt-1 text-xs text-gray-400">
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
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Total Items</p>
            <p className="text-lg font-semibold text-gray-900">{summary.total}</p>
          </div>
          {Object.entries(summary.byType).map(([type, count]) => (
            <div key={type} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500 capitalize">{type.toLowerCase()}</p>
              <p className="text-lg font-semibold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* File Info */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" />
        </svg>
        <span>
          {figmaFileName && <>{figmaFileName} &middot; </>}
          Last pushed: {snapshotAt ? new Date(snapshotAt).toLocaleString() : 'Unknown'}
        </span>
      </div>

      {/* Search + Filter */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterType === f
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="border-t border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-400">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            {filterType !== 'all' && ` (${filterType.toLowerCase()})`}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Variable Table */}
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No variables match your search.
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {Array.from(grouped.entries()).map(([group, groupItems]) => (
              <div key={group}>
                {/* Group header */}
                <div className="sticky top-0 z-10 bg-gray-50 border-t border-gray-100 px-4 py-2">
                  <span className="text-xs font-semibold text-gray-500">{group}</span>
                  <span className="ml-2 text-xs text-gray-400">({groupItems.length})</span>
                </div>
                {/* Item rows */}
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-t border-gray-50 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-400 truncate">{item.description}</p>
                      )}
                    </div>
                    <TypeBadge type={item.type} />
                    <div className="w-40 text-right shrink-0">
                      <span className="flex items-center justify-end gap-2">
                        {item.colorValue && <ColorSwatch value={item.colorValue} />}
                        <code className="text-xs text-gray-700 truncate">{item.value}</code>
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
