'use client';

import { useState, useEffect } from 'react';

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
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Features — Free via Claude MCP */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-900">AI Features — Free with Claude</h3>
            <p className="mt-1 text-sm text-purple-700">
              AI-powered design features (component generation, auto-mapping, chat) work through Figma&apos;s built-in Claude integration via MCP — <strong>no API key needed</strong>.
            </p>
            <p className="mt-2 text-xs text-purple-600">
              Just connect Claude to Figma using the MCP server and you get full AI capabilities for free.
            </p>
          </div>
        </div>
      </div>

      {/* Current Token Status */}
      {keysData?.hasKeys && keysData.githubHint && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Saved Token</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">GitHub Token</span>
            <StatusBadge saved={true} hint={keysData.githubHint} />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Delete token
          </button>
        </div>
      )}

      {/* GitHub Token Section */}
      <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between mb-1">
          <label htmlFor="githubToken" className="block text-sm font-semibold text-gray-900">
            GitHub Personal Access Token
          </label>
          {!keysData?.githubHint && (
            <StatusBadge saved={false} hint={null} />
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Required for syncing design tokens to your GitHub repository — pushing token files, creating pull requests, and pulling changes.
        </p>

        <StepGuide
          title="How to create a GitHub token (2 minutes)"
          defaultOpen={!keysData?.githubHint}
          steps={[
            {
              text: 'Open GitHub token settings. We recommend "Fine-grained tokens" for better security.',
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
              text: 'Click "Generate token" and copy it immediately — you won\'t be able to see it again.',
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

        {/* Security Note */}
        <div className="flex items-start gap-2.5 mt-4 rounded-lg bg-gray-50 p-3">
          <svg className="h-4 w-4 flex-shrink-0 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-xs text-gray-500">
            Your token is encrypted with AES-256-GCM before storage and only decrypted when your Figma plugin syncs.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
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
          disabled={saving || !githubToken}
          className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
