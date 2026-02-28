'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectDetail } from './ProjectDetail';
import { FigmaStatusCard } from '@/components/FigmaStatusCard';
import { TokenStatusCard } from '@/components/TokenStatusCard';
import { PluginStatusBadge } from '@/components/PluginStatusBadge';
import { ThemeBuilder } from '@/components/ThemeBuilder';
import { DownloadIcon, PaletteIcon } from '@/components/Icons';

interface SerializedProject {
  id: string;
  name: string;
  githubRepo: string;
  githubBranch: string;
  githubFilePath: string;
  syncMode: string;
  pushMode: string;
  defaultDirectory: string;
  updatedAt: string;
  createdAt: string;
  designSystemName: string | null;
  designSystemSource: string | null;
  designSystemDomain: string | null;
  themeConfig: Record<string, any> | null;
  typographyConfig: Record<string, any> | null;
  spacingConfig: Record<string, any> | null;
  componentConfig: Record<string, any> | null;
  tokensDocument: Record<string, any> | null;
  documentation: Record<string, any> | null;
  figmaSnapshot: boolean;
  figmaSnapshotAt: string | null;
  figmaFileName: string | null;
}

interface ProjectTabsProps {
  project: SerializedProject;
  initialTab?: string;
  setup?: string;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'design-system', label: 'Design System' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'sync', label: 'Sync' },
  { id: 'export', label: 'Export' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function ProjectTabs({ project, initialTab = 'overview', setup }: ProjectTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>(
    (TABS.find((t) => t.id === initialTab)?.id ?? 'overview') as TabId
  );
  const [saving, setSaving] = useState(false);

  const hasDesignSystem = !!project.designSystemSource;

  const handleSaveDesignSystem = useCallback(
    async (config: any) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/projects/${project.id}/design-system`, {
          method: hasDesignSystem ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save');
        }
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to save design system');
      } finally {
        setSaving(false);
      }
    },
    [project.id, hasDesignSystem, router]
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {project.name}
            </h1>
            <p className="mt-1 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
              {project.githubRepo}
            </p>
          </div>
          {hasDesignSystem && project.themeConfig?.accentColor && (
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full"
                style={{ background: project.themeConfig.accentColor }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {project.designSystemName || 'Design System'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border p-1"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
            {tab.id === 'design-system' && hasDesignSystem && (
              <span
                className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: project.themeConfig?.accentColor || 'var(--brand)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab project={project} onTabChange={setActiveTab} />
      )}

      {activeTab === 'design-system' && (
        <DesignSystemTab
          project={project}
          onSave={handleSaveDesignSystem}
          saving={saving}
          setup={setup}
        />
      )}

      {activeTab === 'tokens' && <TokensTab project={project} />}

      {activeTab === 'sync' && <SyncTab project={project} />}

      {activeTab === 'export' && <ExportTab project={project} />}
    </div>
  );
}

// ─── Overview Tab ───

function OverviewTab({
  project,
  onTabChange,
}: {
  project: SerializedProject;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Project Config */}
      <ProjectDetail
        project={{
          id: project.id,
          name: project.name,
          githubRepo: project.githubRepo,
          githubBranch: project.githubBranch,
          githubFilePath: project.githubFilePath,
          syncMode: project.syncMode,
          pushMode: project.pushMode,
          defaultDirectory: project.defaultDirectory,
        }}
      />

      {/* Design System Summary */}
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Design System
          </h3>
          <button
            onClick={() => onTabChange('design-system')}
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--brand)' }}
          >
            {project.designSystemSource ? 'Edit' : 'Create'} →
          </button>
        </div>

        {project.designSystemSource ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {project.themeConfig?.accentColor && (
                <div
                  className="h-10 w-10 rounded-lg"
                  style={{ background: project.themeConfig.accentColor }}
                />
              )}
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {project.designSystemName || project.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {project.designSystemSource === 'scratch' ? 'Created from scratch' : 'Imported from Figma'}
                  {project.designSystemDomain && ` · ${project.designSystemDomain}`}
                </p>
              </div>
            </div>

            {project.tokensDocument && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span>Token document generated</span>
                <span>·</span>
                <button
                  onClick={() => onTabChange('export')}
                  className="font-medium"
                  style={{ color: 'var(--brand)' }}
                >
                  Export
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center">
            <PaletteIcon
              className="mx-auto h-8 w-8 mb-3"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No design system configured yet.
            </p>
            <button
              onClick={() => onTabChange('design-system')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}
            >
              <PaletteIcon className="h-3.5 w-3.5" />
              Add Design System
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Design System Tab ───

function DesignSystemTab({
  project,
  onSave,
  saving,
  setup,
}: {
  project: SerializedProject;
  onSave: (config: any) => void;
  saving: boolean;
  setup?: string;
}) {
  const hasDesignSystem = !!project.designSystemSource;

  // Show ThemeBuilder if:
  // 1. Already has a design system (editing)
  // 2. setup=scratch query param (just selected "create from scratch")
  if (hasDesignSystem || setup === 'scratch') {
    return (
      <div>
        {saving && (
          <div
            className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}
          >
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
            />
            Saving design system...
          </div>
        )}
        <ThemeBuilder
          projectId={project.id}
          initialConfig={
            hasDesignSystem
              ? {
                  themeConfig: project.themeConfig,
                  typographyConfig: project.typographyConfig,
                  spacingConfig: project.spacingConfig,
                  componentConfig: project.componentConfig,
                  designSystemName: project.designSystemName ?? undefined,
                  designSystemDomain: project.designSystemDomain ?? undefined,
                }
              : undefined
          }
          onSave={onSave}
          mode={hasDesignSystem ? 'edit' : 'create'}
        />
      </div>
    );
  }

  // No design system yet — show source picker inline
  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center mb-8">
        <PaletteIcon className="mx-auto h-10 w-10 mb-4" style={{ color: 'var(--text-tertiary)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Add a Design System
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Create a design system from scratch or import from Figma.
        </p>
      </div>

      <div className="grid gap-4">
        <a
          href={`/dashboard/projects/${project.id}?tab=design-system&setup=scratch`}
          className="group flex items-center gap-4 rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <PaletteIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Create from scratch
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Build a custom theme with our Radix-inspired builder
            </p>
          </div>
        </a>

        <div
          className="flex items-center gap-4 rounded-2xl border p-6 opacity-60"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Import from Figma
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Use the Figma plugin to push variables — coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tokens Tab ───

function TokensTab({ project }: { project: SerializedProject }) {
  const tokens = project.tokensDocument;

  if (!tokens) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No tokens generated yet. Create a design system first.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-6"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Token Document
      </h3>
      <pre
        className="max-h-[600px] overflow-auto rounded-lg p-4 text-xs font-mono leading-relaxed"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
      >
        {JSON.stringify(tokens, null, 2)}
      </pre>
    </div>
  );
}

// ─── Sync Tab ───

function SyncTab({ project }: { project: SerializedProject }) {
  return (
    <div className="space-y-6">
      <PluginStatusBadge projectId={project.id} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FigmaStatusCard projectId={project.id} />
        <TokenStatusCard projectId={project.id} />
      </div>
    </div>
  );
}

// ─── Export Tab ───

function ExportTab({ project }: { project: SerializedProject }) {
  const [exporting, setExporting] = useState(false);

  if (!project.tokensDocument) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No tokens to export. Create a design system first.
        </p>
      </div>
    );
  }

  async function handleExport(format: string) {
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const ext = format === 'css' ? 'css' : format === 'scss' ? 'scss' : 'json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tokens.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export tokens');
    } finally {
      setExporting(false);
    }
  }

  const formats = [
    { id: 'json', label: 'DTCG JSON', desc: 'W3C Design Tokens Community Group format' },
    { id: 'css', label: 'CSS Variables', desc: 'Ready-to-use CSS custom properties' },
    { id: 'scss', label: 'SCSS Variables', desc: 'Sass variables for preprocessor workflows' },
  ];

  return (
    <div className="max-w-lg">
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Export Design Tokens
      </h3>
      <div className="space-y-3">
        {formats.map((fmt) => (
          <button
            key={fmt.id}
            onClick={() => handleExport(fmt.id)}
            disabled={exporting}
            className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--brand-subtle)' }}
            >
              <DownloadIcon className="h-5 w-5" style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {fmt.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {fmt.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
