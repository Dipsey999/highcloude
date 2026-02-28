'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColorPalettePreview, SemanticColorDots } from './ColorPalettePreview';
import { DownloadIcon, TrashIcon, CopyIcon, CheckIcon } from './Icons';
import { generateFullPalette } from '@/lib/design-system/color-generation';
import { COMPONENT_LABELS } from '@/lib/design-system/component-templates';
import { TYPE_SCALE_RATIOS } from '@/lib/design-system/domain-presets';
import type { TypeScale, ComponentType } from '@/lib/design-system/domain-presets';
import type { PaletteMode } from '@/lib/design-system/color-generation';
import { flattenTokenDocument, computeTokenSummary } from '@/lib/tokens';

interface DesignSystemData {
  id: string;
  name: string;
  domain: string;
  companyName?: string | null;
  productName?: string | null;
  colorConfig: { primaryColor: string; paletteMode: PaletteMode };
  typographyConfig: {
    fontFamily: string;
    headingFontFamily: string;
    baseSize: number;
    scale: TypeScale;
    weights: number[];
  };
  spacingConfig: { baseUnit: number; scale: number[] };
  radiusConfig: { none: number; sm: number; md: number; lg: number; xl: number; full: string };
  shadowConfig: { sm: string; md: string; lg: string; xl: string };
  componentConfig: { selectedComponents: ComponentType[] };
  tokensDocument: Record<string, unknown>;
  documentation: {
    overview: string;
    sections: { title: string; content: string }[];
    colorGuide: { primary: string; usage: string[] };
    typographyGuide: { fontFamily: string; headingFontFamily: string; scaleRatio: string; steps: { name: string; size: string }[] };
    componentList: { name: string; description: string }[];
  };
  createdAt: string;
  updatedAt: string;
}

const TABS = ['Overview', 'Components', 'Documentation', 'Export'] as const;
type Tab = (typeof TABS)[number];

const DOMAIN_LABELS: Record<string, string> = {
  tech: 'Technology',
  healthcare: 'Healthcare',
  finance: 'Finance',
  education: 'Education',
  ecommerce: 'E-Commerce',
  creative: 'Creative',
  enterprise: 'Enterprise',
};

export function DesignSystemDetail({ data }: { data: DesignSystemData }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Overview');
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const palette = generateFullPalette(
    data.colorConfig.primaryColor,
    data.colorConfig.paletteMode,
  );

  const tokens = flattenTokenDocument(data.tokensDocument);
  const summary = computeTokenSummary(tokens);

  async function handleDelete() {
    if (!confirm('Delete this design system? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`/api/design-systems/${data.id}`, { method: 'DELETE' });
      router.push('/dashboard/design-systems');
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  async function handleCopyJSON() {
    await navigator.clipboard.writeText(JSON.stringify(data.tokensDocument, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg"
              style={{ backgroundColor: data.colorConfig.primaryColor }}
            />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {data.name}
            </h1>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}
            >
              {DOMAIN_LABELS[data.domain] || data.domain}
            </span>
            {data.companyName && <span>{data.companyName}</span>}
            <span>{summary.total} tokens</span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors"
          style={{ color: 'var(--error)' }}
        >
          <TrashIcon className="h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 border-b mb-6"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: tab === t ? 'var(--brand)' : 'transparent',
              color: tab === t ? 'var(--brand)' : 'var(--text-secondary)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <OverviewTab
          palette={palette}
          typographyConfig={data.typographyConfig}
          spacingConfig={data.spacingConfig}
          radiusConfig={data.radiusConfig}
          shadowConfig={data.shadowConfig}
          summary={summary}
        />
      )}

      {tab === 'Components' && (
        <ComponentsTab components={data.componentConfig.selectedComponents} tokensDocument={data.tokensDocument} />
      )}

      {tab === 'Documentation' && (
        <DocumentationTab documentation={data.documentation} />
      )}

      {tab === 'Export' && (
        <ExportTab
          id={data.id}
          name={data.name}
          tokensDocument={data.tokensDocument}
          copied={copied}
          onCopyJSON={handleCopyJSON}
        />
      )}
    </div>
  );
}

// ── Overview Tab ──

function OverviewTab({
  palette,
  typographyConfig,
  spacingConfig,
  radiusConfig,
  shadowConfig,
  summary,
}: {
  palette: ReturnType<typeof generateFullPalette>;
  typographyConfig: DesignSystemData['typographyConfig'];
  spacingConfig: DesignSystemData['spacingConfig'];
  radiusConfig: DesignSystemData['radiusConfig'];
  shadowConfig: DesignSystemData['shadowConfig'];
  summary: ReturnType<typeof computeTokenSummary>;
}) {
  const ratio = TYPE_SCALE_RATIOS[typographyConfig.scale];
  const typeSteps = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

  return (
    <div className="space-y-8">
      {/* Token summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(summary.byType).map(([type, count]) => (
          <div
            key={type}
            className="rounded-xl border p-4 text-center"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
          >
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {count}
            </div>
            <div className="text-xs capitalize mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {type}
            </div>
          </div>
        ))}
      </div>

      {/* Color palettes */}
      <Section title="Colors">
        <div className="space-y-3">
          <ColorPalettePreview shades={palette.primary} label="Primary" />
          <ColorPalettePreview shades={palette.secondary} label="Secondary" />
          <ColorPalettePreview shades={palette.accent} label="Accent" />
          <ColorPalettePreview shades={palette.neutral} label="Neutral" />
        </div>
        <div className="mt-4">
          <SemanticColorDots colors={palette} />
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <InfoRow label="Body Font" value={typographyConfig.fontFamily} />
          <InfoRow label="Heading Font" value={typographyConfig.headingFontFamily} />
          <InfoRow label="Base Size" value={`${typographyConfig.baseSize}px`} />
          <InfoRow label="Scale" value={`${typographyConfig.scale} (${ratio})`} />
        </div>
        <div
          className="rounded-xl border p-4 space-y-1"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
        >
          {typeSteps.map((stepName, i) => {
            const scale = Math.pow(ratio, i - 2);
            const px = Math.round(typographyConfig.baseSize * scale * 100) / 100;
            return (
              <div key={stepName} className="flex items-baseline gap-3">
                <span className="w-10 text-right text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {stepName}
                </span>
                <span
                  className="truncate"
                  style={{ fontSize: `${Math.min(px, 32)}px`, color: 'var(--text-primary)' }}
                >
                  {px}px — The quick brown fox
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Spacing */}
      <Section title="Spacing">
        <div className="flex gap-1 items-end">
          {spacingConfig.scale.map((mult, i) => {
            const px = spacingConfig.baseUnit * mult;
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="rounded-sm"
                  style={{
                    width: `${Math.max(4, Math.min(px, 64))}px`,
                    height: `${Math.max(4, Math.min(px, 64))}px`,
                    background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                    opacity: 0.6,
                  }}
                />
                <span className="mt-1 text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {px}px
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Radius & Shadow */}
      <div className="grid grid-cols-2 gap-6">
        <Section title="Border Radius">
          <div className="flex gap-3">
            {(['sm', 'md', 'lg', 'xl'] as const).map((key) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div
                  className="h-12 w-12 border-2"
                  style={{
                    borderRadius: `${radiusConfig[key]}px`,
                    borderColor: 'var(--brand)',
                    opacity: 0.6,
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {key}: {radiusConfig[key]}px
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shadows">
          <div className="flex gap-3">
            {(['sm', 'md', 'lg', 'xl'] as const).map((key) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div
                  className="h-12 w-12 rounded-lg"
                  style={{
                    background: 'var(--bg-elevated)',
                    boxShadow: shadowConfig[key],
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {key}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ── Components Tab ──

function ComponentsTab({
  components,
  tokensDocument,
}: {
  components: ComponentType[];
  tokensDocument: Record<string, unknown>;
}) {
  const componentTokens = (tokensDocument as Record<string, unknown>).components as Record<string, Record<string, unknown>> | undefined;

  return (
    <div className="space-y-4">
      {components.map((comp) => {
        const meta = COMPONENT_LABELS[comp];
        const tokens = componentTokens?.[comp];

        return (
          <div
            key={comp}
            className="rounded-xl border p-5"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
          >
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {meta.label}
            </h4>
            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
              {meta.description}
            </p>

            {tokens && (
              <div className="space-y-1">
                {Object.entries(tokens).map(([group, groupTokens]) => {
                  if (typeof groupTokens === 'object' && groupTokens !== null && '$type' in groupTokens) {
                    const t = groupTokens as { $type: string; $value: string };
                    return (
                      <TokenRow key={group} path={`${comp}.${group}`} type={t.$type} value={t.$value} />
                    );
                  }
                  if (typeof groupTokens === 'object' && groupTokens !== null) {
                    return (
                      <div key={group}>
                        <div className="text-xs font-medium capitalize mt-2 mb-1" style={{ color: 'var(--text-secondary)' }}>
                          {group}
                        </div>
                        {Object.entries(groupTokens as Record<string, unknown>).map(([key, val]) => {
                          const t = val as { $type: string; $value: string };
                          if (!t?.$type) return null;
                          return (
                            <TokenRow key={key} path={`${comp}.${group}.${key}`} type={t.$type} value={t.$value} />
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TokenRow({ path, type, value }: { path: string; type: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-1 px-2 rounded text-xs"
      style={{ background: 'var(--bg-elevated)' }}
    >
      <span className="font-mono truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
        {path}
      </span>
      <span className="flex items-center gap-2 ml-4">
        {type === 'color' && !value.startsWith('{') && value !== 'transparent' && (
          <span
            className="h-3 w-3 rounded-full inline-block border"
            style={{ backgroundColor: value, borderColor: 'var(--border-primary)' }}
          />
        )}
        <span className="font-mono" style={{ color: 'var(--text-tertiary)' }}>
          {value}
        </span>
      </span>
    </div>
  );
}

// ── Documentation Tab ──

function DocumentationTab({ documentation }: { documentation: DesignSystemData['documentation'] }) {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border p-5"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {documentation.overview}
        </p>
      </div>

      {documentation.sections.map((section) => (
        <Section key={section.title} title={section.title}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {section.content}
          </p>
        </Section>
      ))}

      <Section title="Color Usage Guidelines">
        <ul className="space-y-1.5">
          {documentation.colorGuide.usage.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--brand)' }}>•</span>
              {tip}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type Scale">
        <div
          className="rounded-xl border divide-y"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {documentation.typographyGuide.steps.map((step) => (
            <div
              key={step.name}
              className="flex items-center justify-between px-4 py-2"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {step.name}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {step.size}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Component Specs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {documentation.componentList.map((comp) => (
            <div
              key={comp.name}
              className="rounded-xl border p-3"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
            >
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {comp.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {comp.description}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Export Tab ──

function ExportTab({
  id,
  name,
  tokensDocument,
  copied,
  onCopyJSON,
}: {
  id: string;
  name: string;
  tokensDocument: Record<string, unknown>;
  copied: boolean;
  onCopyJSON: () => void;
}) {
  const formats = [
    { label: 'DTCG JSON', format: 'dtcg', description: 'W3C Design Token Community Group format' },
    { label: 'CSS Variables', format: 'css', description: 'CSS custom properties' },
    { label: 'SCSS Variables', format: 'scss', description: 'SCSS/Sass variables' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {formats.map((f) => (
          <a
            key={f.format}
            href={`/api/design-systems/${id}/export?format=${f.format}`}
            download
            className="rounded-xl border p-5 text-center transition-all duration-200 hover:-translate-y-0.5 block"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-tertiary)',
            }}
          >
            <DownloadIcon className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--brand)' }} />
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {f.label}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {f.description}
            </div>
          </a>
        ))}
      </div>

      <Section title="Token JSON Preview">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Full DTCG token document
          </span>
          <button
            onClick={onCopyJSON}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: 'var(--brand)' }}
          >
            {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
        <pre
          className="rounded-xl border p-4 text-xs font-mono overflow-auto max-h-96"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
          }}
        >
          {JSON.stringify(tokensDocument, null, 2)}
        </pre>
      </Section>
    </div>
  );
}

// ── Shared helpers ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
