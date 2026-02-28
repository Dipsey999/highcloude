'use client';

import { useState } from 'react';
import type { GeneratedDesignSystem } from '@/lib/ai/types';
import { generateShades } from '@/lib/design-system/color-generation';
import { MockDashboard } from './MockDashboard';
import { MockSettings } from './MockSettings';
import { ComponentGrid } from './ComponentGrid';
import { ColorPaletteDisplay } from './ColorPaletteDisplay';
import { TypographyScale } from './TypographyScale';

type PreviewTab = 'dashboard' | 'settings' | 'components' | 'palette' | 'typography';

const TABS: { id: PreviewTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'settings', label: 'Settings' },
  { id: 'components', label: 'Components' },
  { id: 'palette', label: 'Palette' },
  { id: 'typography', label: 'Typography' },
];

interface LivePreviewPanelProps {
  designSystem: GeneratedDesignSystem;
}

export function LivePreviewPanel({ designSystem }: LivePreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('dashboard');

  const primaryColor = designSystem.config.color.primaryColor;
  const shades = generateShades(primaryColor);

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-primary)',
      }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-2 pt-2 overflow-x-auto"
        style={{
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors duration-150"
              style={{
                color: isActive ? shades['500'] : 'var(--text-tertiary)',
                background: isActive ? 'var(--bg-primary)' : 'transparent',
                borderBottom: isActive ? `2px solid ${shades['500']}` : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        className="h-[500px] overflow-y-auto"
        style={{ background: 'var(--bg-primary)' }}
      >
        {activeTab === 'dashboard' && <MockDashboard designSystem={designSystem} />}
        {activeTab === 'settings' && <MockSettings designSystem={designSystem} />}
        {activeTab === 'components' && <ComponentGrid designSystem={designSystem} />}
        {activeTab === 'palette' && <ColorPaletteDisplay designSystem={designSystem} />}
        {activeTab === 'typography' && <TypographyScale designSystem={designSystem} />}
      </div>
    </div>
  );
}
