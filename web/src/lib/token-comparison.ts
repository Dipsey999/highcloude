/**
 * Token comparison utilities for matching Figma variables to GitHub DTCG tokens.
 */

import type { FlatToken, DTCGTokenType } from './tokens';
import { formatTokenValue } from './tokens';

// Figma variable types (mirrored from FigmaVariablesViewer)
export interface FigmaVariable {
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

export interface FigmaTextStyle {
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

export interface FigmaEffectStyle {
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

export interface FigmaSnapshot {
  variables: FigmaVariable[];
  textStyles: FigmaTextStyle[];
  effectStyles: FigmaEffectStyle[];
}

export type ComparisonStatus = 'synced' | 'needs-sync' | 'figma-only' | 'github-only';

export interface ComparisonItem {
  id: string;
  figmaVariable: FigmaVariable | null;
  githubToken: FlatToken | null;
  matchKey: string;
  collection: string;
  status: ComparisonStatus;
  figmaValue: string | null;
  githubValue: string | null;
  type: string;
  valuesByMode: Record<string, string | number | boolean> | null;
}

export interface ComparisonSummary {
  total: number;
  synced: number;
  needsSync: number;
  figmaOnly: number;
  githubOnly: number;
}

export interface ComparisonResult {
  items: ComparisonItem[];
  summary: ComparisonSummary;
  collections: string[];
  modes: string[];
}

/**
 * Build a canonical match key from a Figma collection name and variable name.
 * Figma uses "/" for nesting (e.g., "colors/primary/500").
 * DTCG uses "." for nesting (e.g., "colors.primary.500").
 * Collection maps to the top-level group.
 */
export function buildMatchKey(collectionName: string, variableName: string): string {
  const parts = [collectionName, ...variableName.split('/')];
  return parts
    .map((p) => p.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
    .join('.');
}

/**
 * Map Figma resolvedType to approximate DTCG type for display.
 */
function figmaTypeToDTCG(resolvedType: string): string {
  switch (resolvedType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      return 'dimension';
    case 'STRING':
      return 'string';
    case 'BOOLEAN':
      return 'boolean';
    default:
      return resolvedType.toLowerCase();
  }
}

/**
 * Normalize a value for comparison (case-insensitive string comparison).
 */
function normalizeForComparison(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return String(value).toLowerCase().trim();
}

/**
 * Format a Figma variable value for display.
 */
function formatFigmaValue(variable: FigmaVariable, selectedMode?: string): string {
  if (variable.aliasName) return `→ ${variable.aliasName}`;

  const val = selectedMode && variable.valuesByMode[selectedMode] !== undefined
    ? variable.valuesByMode[selectedMode]
    : variable.defaultValue;

  if (val === null || val === undefined) return '—';
  if (variable.resolvedType === 'BOOLEAN') return val ? 'true' : 'false';
  return String(val);
}

/**
 * Get the raw value for a Figma variable (for comparison).
 */
function getFigmaRawValue(variable: FigmaVariable, selectedMode?: string): unknown {
  if (selectedMode && variable.valuesByMode[selectedMode] !== undefined) {
    return variable.valuesByMode[selectedMode];
  }
  return variable.defaultValue;
}

/**
 * Compare Figma variables against GitHub DTCG tokens.
 */
export function compareTokens(
  figmaSnapshot: FigmaSnapshot | null,
  githubTokens: FlatToken[],
  selectedMode?: string
): ComparisonResult {
  const items: ComparisonItem[] = [];
  const collectionsSet = new Set<string>();
  const modesSet = new Set<string>();

  // Build Figma lookup map
  const figmaMap = new Map<string, FigmaVariable>();
  if (figmaSnapshot?.variables) {
    for (const v of figmaSnapshot.variables) {
      const key = buildMatchKey(v.collectionName, v.name);
      figmaMap.set(key, v);
      collectionsSet.add(v.collectionName);

      // Collect all mode names
      for (const modeName of Object.keys(v.valuesByMode)) {
        modesSet.add(modeName);
      }
    }
  }

  // Build GitHub lookup map
  const githubMap = new Map<string, FlatToken>();
  for (const t of githubTokens) {
    const key = t.path.toLowerCase();
    githubMap.set(key, t);
    collectionsSet.add(t.group);
  }

  // Match Figma variables to GitHub tokens
  const matchedGithubKeys = new Set<string>();

  for (const [key, figmaVar] of figmaMap) {
    const githubToken = githubMap.get(key) || null;

    if (githubToken) {
      matchedGithubKeys.add(key);

      // Compare values
      const figmaRaw = getFigmaRawValue(figmaVar, selectedMode);
      const figmaNorm = normalizeForComparison(figmaRaw);
      const githubNorm = normalizeForComparison(githubToken.value);

      const status: ComparisonStatus = figmaNorm === githubNorm ? 'synced' : 'needs-sync';

      items.push({
        id: `match-${key}`,
        figmaVariable: figmaVar,
        githubToken,
        matchKey: key,
        collection: figmaVar.collectionName,
        status,
        figmaValue: formatFigmaValue(figmaVar, selectedMode),
        githubValue: formatTokenValue(githubToken.type, githubToken.value),
        type: figmaTypeToDTCG(figmaVar.resolvedType),
        valuesByMode: figmaVar.valuesByMode,
      });
    } else {
      items.push({
        id: `figma-${key}`,
        figmaVariable: figmaVar,
        githubToken: null,
        matchKey: key,
        collection: figmaVar.collectionName,
        status: 'figma-only',
        figmaValue: formatFigmaValue(figmaVar, selectedMode),
        githubValue: null,
        type: figmaTypeToDTCG(figmaVar.resolvedType),
        valuesByMode: figmaVar.valuesByMode,
      });
    }
  }

  // Remaining GitHub tokens (not matched to any Figma variable)
  for (const [key, githubToken] of githubMap) {
    if (!matchedGithubKeys.has(key)) {
      items.push({
        id: `github-${key}`,
        figmaVariable: null,
        githubToken,
        matchKey: key,
        collection: githubToken.group,
        status: 'github-only',
        figmaValue: null,
        githubValue: formatTokenValue(githubToken.type, githubToken.value),
        type: githubToken.type,
        valuesByMode: null,
      });
    }
  }

  // Sort by collection, then by matchKey
  items.sort((a, b) => {
    const collCmp = a.collection.localeCompare(b.collection);
    if (collCmp !== 0) return collCmp;
    return a.matchKey.localeCompare(b.matchKey);
  });

  // Compute summary
  const summary: ComparisonSummary = {
    total: items.length,
    synced: items.filter((i) => i.status === 'synced').length,
    needsSync: items.filter((i) => i.status === 'needs-sync').length,
    figmaOnly: items.filter((i) => i.status === 'figma-only').length,
    githubOnly: items.filter((i) => i.status === 'github-only').length,
  };

  return {
    items,
    summary,
    collections: Array.from(collectionsSet).sort(),
    modes: Array.from(modesSet).sort(),
  };
}
