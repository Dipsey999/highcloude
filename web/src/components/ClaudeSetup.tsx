'use client';

import { useState, useEffect } from 'react';
import {
  SparklesIcon,
  ShieldIcon,
  ChevronDownIcon,
  InfoCircleIcon,
  ExternalLinkIcon,
  RefreshIcon,
  TargetIcon,
  BoxIcon,
  RobotIcon,
  PaletteIcon,
} from '@/components/Icons';

interface KeysData {
  hasKeys: boolean;
  githubHint: string | null;
  claudeHint: string | null;
  hasClaudeKey: boolean;
}

// ── Reusable sub-components ──

function StepGuide({
  title,
  steps,
  defaultOpen = false,
}: {
  title: string;
  steps: { text: string; link?: { url: string; label: string } }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border-accent)', background: 'var(--brand-subtle)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--brand)' }}>
          <InfoCircleIcon className="h-4 w-4 flex-shrink-0" />
          {title}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border-accent)' }}>
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))' }}
                >
                  {i + 1}
                </span>
                <span>
                  {step.text}
                  {step.link && (
                    <>
                      {' '}
                      <a
                        href={step.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                        style={{ color: 'var(--brand)' }}
                      >
                        {step.link.label}
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ saved, hint }: { saved: boolean; hint: string | null }) {
  if (!saved) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
        Not set
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
      Saved ({hint})
    </span>
  );
}

// ── Feature card data ──

const features = [
  {
    title: 'Design Generation',
    description: 'Describe any UI in natural language and Claude generates a complete Figma layout using your design tokens.',
    Icon: SparklesIcon,
  },
  {
    title: 'Design Refinement',
    description: 'Iteratively improve generated designs with multi-turn conversation. Say "make the button wider" and Claude updates the spec.',
    Icon: RefreshIcon,
  },
  {
    title: 'Design Rules Engine',
    description: 'Auto-validates generated designs against spacing scales, naming conventions, token coverage, and layout best practices.',
    Icon: TargetIcon,
  },
  {
    title: 'Accessibility Checker',
    description: 'WCAG 2.1 contrast ratio checking, touch target validation (44x44px), and minimum text size enforcement.',
    Icon: ShieldIcon,
  },
  {
    title: 'Component Patterns',
    description: 'Save Figma selections as reusable patterns. Claude references saved patterns for structurally consistent generation.',
    Icon: BoxIcon,
  },
  {
    title: 'AI Design Chat',
    description: 'Design system consultant chatbot that knows your tokens. Ask about color usage, spacing, typography, and best practices.',
    Icon: RobotIcon,
  },
  {
    title: 'Reference-Based Generation',
    description: 'Use an existing component as a structural reference and ask Claude to create a new component that follows the same patterns.',
    Icon: PaletteIcon,
  },
];

// ── Main component ──

export function ClaudeSetup() {
  const [keysData, setKeysData] = useState<KeysData | null>(null);
  const [claudeKey, setClaudeKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setKeysData(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load keys' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!claudeKey) {
      setMessage({ type: 'error', text: 'Enter your Claude API key' });
      return;
    }
    if (!claudeKey.startsWith('sk-ant-')) {
      setMessage({ type: 'error', text: 'Claude API key must start with sk-ant-' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claudeApiKey: claudeKey }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setMessage({ type: 'success', text: 'Claude API key saved and encrypted successfully' });
      setClaudeKey('');
      fetchKeys();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save key' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete your Claude API key?')) return;
    try {
      const res = await fetch('/api/keys?key=claude', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setMessage({ type: 'success', text: 'Claude API key deleted' });
      fetchKeys();
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete key' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-2xl" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="h-48 rounded-2xl" style={{ background: 'var(--bg-tertiary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Section 1: MCP Banner ── */}
      <div className="gradient-border rounded-2xl">
        <div className="p-6 rounded-[15px]" style={{ background: 'var(--bg-elevated)' }}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, var(--gradient-to), var(--gradient-from))' }}
            >
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Free with Claude MCP
              </h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                All AI design features work through Figma&apos;s built-in Claude integration via MCP &mdash;{' '}
                <strong>no API key needed</strong>. Just connect Claude to Figma using the MCP server.
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Alternatively, add your own Claude API key below for direct API access from the plugin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Claude API Key ── */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border p-6"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}
      >
        <div className="flex items-start justify-between mb-1">
          <label htmlFor="claudeKey" className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Claude API Key <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(Optional)</span>
          </label>
          <StatusBadge saved={!!keysData?.hasClaudeKey} hint={keysData?.claudeHint ?? null} />
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Required only if you want direct API access instead of Claude MCP.
        </p>

        <StepGuide
          title="How to get a Claude API key"
          defaultOpen={!keysData?.hasClaudeKey}
          steps={[
            {
              text: 'Go to the Anthropic Console and sign in.',
              link: { url: 'https://console.anthropic.com', label: 'Open Console' },
            },
            { text: 'Navigate to "API Keys" in the sidebar and click "Create Key".' },
            { text: 'Name your key (e.g. "Cosmikit") and copy it immediately.' },
            { text: 'Paste the key below. It starts with sk-ant-api03-...' },
          ]}
        />

        <div className="mt-4">
          <input
            id="claudeKey"
            type="password"
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono"
          />
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-2.5 mt-4 rounded-xl p-3" style={{ background: 'var(--bg-tertiary)' }}>
          <ShieldIcon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Your key is encrypted with AES-256-GCM before storage and only decrypted when the Figma plugin makes API calls.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-sm border-l-4"
            style={{
              background: message.type === 'success' ? 'var(--success-subtle)' : 'var(--error-subtle)',
              color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
              borderLeftColor: message.type === 'success' ? 'var(--success)' : 'var(--error)',
            }}
          >
            {message.type === 'success' ? '\u2713 ' : '\u2717 '}{message.text}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving || !claudeKey}
          className="btn-gradient mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Encrypting &amp; Saving...
            </span>
          ) : (
            'Save API Key'
          )}
        </button>

        {/* Delete button (if key is saved) */}
        {keysData?.hasClaudeKey && (
          <button
            type="button"
            onClick={handleDelete}
            className="mt-3 text-sm font-medium transition-colors duration-200"
            style={{ color: 'var(--error)' }}
          >
            Delete Claude API key
          </button>
        )}
      </form>

      {/* ── Section 3: AI Features Grid ── */}
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          AI Features
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          All features are available in the Figma plugin. Here&apos;s what Claude can do with your design system.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card card-hover p-5 transition-all duration-200"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                style={{
                  background: 'linear-gradient(135deg, var(--brand-subtle), var(--bg-tertiary))',
                }}
              >
                <feature.Icon className="h-5 w-5" style={{ color: 'var(--brand)' }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {feature.description}
              </p>
              <div className="mt-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                  Available via MCP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: Configuration Note ── */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }}
      >
        <div className="flex gap-3">
          <InfoCircleIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Configuration
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Model selection, temperature, and generation preferences are configured directly in the Figma plugin.
              Open Cosmikit in Figma to adjust these settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
