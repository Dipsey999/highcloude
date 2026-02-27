'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, ShieldIcon, ChevronDownIcon, InfoCircleIcon, ExternalLinkIcon } from '@/components/Icons';

interface KeysData {
  hasKeys: boolean;
  githubHint: string | null;
}

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
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-accent)', background: 'var(--brand-subtle)' }}>
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
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
        Not set
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
      Saved ({hint})
    </span>
  );
}

export function KeysForm() {
  const [keysData, setKeysData] = useState<KeysData | null>(null);
  const [githubToken, setGithubToken] = useState('');
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
    if (!githubToken) {
      setMessage({ type: 'error', text: 'Enter your GitHub token' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubToken }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setMessage({ type: 'success', text: 'GitHub token saved and encrypted successfully' });
      setGithubToken('');
      fetchKeys();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save token' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete your GitHub token? Syncing will stop until you add a new one.')) return;
    try {
      const res = await fetch('/api/keys', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setMessage({ type: 'success', text: 'Token deleted' });
      setKeysData({ hasKeys: false, githubHint: null });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete token' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="h-10 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Features */}
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
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Features — Free with Claude</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                AI-powered design features work through Figma&apos;s built-in Claude integration via MCP — <strong>no API key needed</strong>.
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Just connect Claude to Figma using the MCP server and you get full AI capabilities for free.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Token Status */}
      {keysData?.hasKeys && keysData.githubHint && (
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Saved Token</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>GitHub Token</span>
            <StatusBadge saved={true} hint={keysData.githubHint} />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-4 text-sm font-medium transition-colors duration-200"
            style={{ color: 'var(--error)' }}
          >
            Delete token
          </button>
        </div>
      )}

      {/* GitHub Token Section */}
      <form onSubmit={handleSave} className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-elevated)' }}>
        <div className="flex items-start justify-between mb-1">
          <label htmlFor="githubToken" className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            GitHub Personal Access Token
          </label>
          {!keysData?.githubHint && <StatusBadge saved={false} hint={null} />}
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Required for syncing design tokens to your GitHub repository.
        </p>

        <StepGuide
          title="How to create a GitHub token (2 minutes)"
          defaultOpen={!keysData?.githubHint}
          steps={[
            { text: 'Open GitHub token settings. We recommend "Fine-grained tokens" for better security.', link: { url: 'https://github.com/settings/tokens?type=beta', label: 'Open Token Settings' } },
            { text: 'Click "Generate new token". Set a name (e.g. "Cosmikit") and expiration (90 days recommended).' },
            { text: 'Under "Repository access", select "Only select repositories" and pick the repo where your design tokens live.' },
            { text: 'Under "Permissions" > "Repository permissions", set Contents to "Read and write" and Pull requests to "Read and write".' },
            { text: 'Click "Generate token" and copy it immediately — you won\'t be able to see it again.' },
            { text: 'Paste the token below.' },
          ]}
        />

        <div className="mt-4">
          <input
            id="githubToken"
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="github_pat_..."
            className="input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono"
          />
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-2.5 mt-4 rounded-xl p-3" style={{ background: 'var(--bg-tertiary)' }}>
          <ShieldIcon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Your token is encrypted with AES-256-GCM before storage and only decrypted when your Figma plugin syncs.
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
          disabled={saving || !githubToken}
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
            'Save Token'
          )}
        </button>
      </form>
    </div>
  );
}
