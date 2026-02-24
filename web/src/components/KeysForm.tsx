'use client';

import { useState, useEffect } from 'react';

interface KeysData {
  hasKeys: boolean;
  claudeHint: string | null;
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
    <div className="rounded-lg border border-blue-100 bg-blue-50/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-blue-800">
          <svg
            className="h-4 w-4 text-blue-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {title}
        </span>
        <svg
          className={`h-4 w-4 text-blue-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-blue-100 px-4 py-3">
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-blue-900">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-800">
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
                        className="inline-flex items-center gap-1 font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                      >
                        {step.link.label}
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
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
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        Not set
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Saved ({hint})
    </span>
  );
}

export function KeysForm() {
  const [keysData, setKeysData] = useState<KeysData | null>(null);
  const [claudeApiKey, setClaudeApiKey] = useState('');
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
    if (!claudeApiKey && !githubToken) {
      setMessage({ type: 'error', text: 'Enter at least one key' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(claudeApiKey && { claudeApiKey }),
          ...(githubToken && { githubToken }),
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setMessage({ type: 'success', text: 'Keys saved and encrypted successfully' });
      setClaudeApiKey('');
      setGithubToken('');
      fetchKeys();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save keys' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete all API keys? Your Figma plugin will stop working until you add new ones.')) return;

    try {
      const res = await fetch('/api/keys', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setMessage({ type: 'success', text: 'All keys deleted' });
      setKeysData({ hasKeys: false, claudeHint: null, githubHint: null });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete keys' });
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Current Keys Status */}
      {keysData?.hasKeys && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Saved Keys</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Claude API Key</span>
              <StatusBadge saved={!!keysData.claudeHint} hint={keysData.claudeHint} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">GitHub Token</span>
              <StatusBadge saved={!!keysData.githubHint} hint={keysData.githubHint} />
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Delete all keys
          </button>
        </div>
      )}

      {/* Claude API Key Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between mb-1">
          <label htmlFor="claudeKey" className="block text-sm font-semibold text-gray-900">
            Claude API Key
          </label>
          {keysData?.claudeHint && (
            <StatusBadge saved={true} hint={keysData.claudeHint} />
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Required for AI-powered features — generating components, auto-mapping tokens, and the chat assistant inside Figma.
        </p>

        <StepGuide
          title="How to get your Claude API key"
          defaultOpen={!keysData?.claudeHint}
          steps={[
            {
              text: 'Go to the Anthropic Console and sign in (or create a free account).',
              link: { url: 'https://console.anthropic.com', label: 'Open Console' },
            },
            {
              text: 'Click "API Keys" in the left sidebar.',
            },
            {
              text: 'Click "Create Key", give it a name (e.g. "Claude Bridge"), and copy the key.',
            },
            {
              text: 'Paste the key below. It starts with sk-ant-...',
            },
          ]}
        />

        <div className="mt-4">
          <input
            id="claudeKey"
            type="password"
            value={claudeApiKey}
            onChange={(e) => setClaudeApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* GitHub Token Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between mb-1">
          <label htmlFor="githubToken" className="block text-sm font-semibold text-gray-900">
            GitHub Personal Access Token
          </label>
          {keysData?.githubHint && (
            <StatusBadge saved={true} hint={keysData.githubHint} />
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Required for syncing design tokens to your GitHub repository — pushing token files, creating pull requests, and pulling changes.
        </p>

        <StepGuide
          title="How to create a GitHub token"
          defaultOpen={!keysData?.githubHint}
          steps={[
            {
              text: 'Open GitHub token settings (Fine-grained tokens are recommended for better security).',
              link: {
                url: 'https://github.com/settings/tokens?type=beta',
                label: 'Open Token Settings',
              },
            },
            {
              text: 'Click "Generate new token". Set a name (e.g. "Claude Bridge") and expiration (90 days recommended).',
            },
            {
              text: 'Under "Repository access", select "Only select repositories" and pick the repo where your design tokens live.',
            },
            {
              text: 'Under "Permissions" > "Repository permissions", set Contents to "Read and write" and Pull requests to "Read and write".',
            },
            {
              text: 'Click "Generate token" and copy it. It starts with github_pat_...',
            },
            {
              text: 'Paste the token below.',
            },
          ]}
        />

        <div className="mt-4">
          <input
            id="githubToken"
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="github_pat_..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <svg className="h-5 w-5 flex-shrink-0 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-700">Your keys are safe</p>
          <p className="text-xs text-gray-500 mt-0.5">
            All keys are encrypted with AES-256-GCM before storage. They are never stored in plain text and are only decrypted when your Figma plugin requests them.
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? '\u2713 ' : '\u2717 '}
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving || (!claudeApiKey && !githubToken)}
        className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
          'Save Keys'
        )}
      </button>
    </form>
  );
}
