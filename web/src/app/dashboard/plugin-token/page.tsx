'use client';

import { useState } from 'react';
import { ShieldIcon, CopyIcon, RefreshIcon, LinkIcon } from '@/components/Icons';

export default function PluginTokenPage() {
  const [token, setToken] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateToken() {
    setGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch('/api/plugin/auth', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate token');
      const data = await res.json();
      setToken(data.token);
    } catch {
      setError('Failed to generate token. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = token;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Plugin Token
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Generate a token to connect your Figma plugin to Claude Bridge.
        </p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* How it works */}
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-elevated)',
          }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            How It Works
          </h3>
          <ol className="space-y-3 text-sm">
            {[
              <>Click &quot;Generate Token&quot; below to create a secure JWT</>,
              <>Copy the token to your clipboard</>,
              <>Open the Claude Bridge plugin in Figma</>,
              <>Select &quot;Claude Bridge&quot; tab and paste the token</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Token Generation */}
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-elevated)',
          }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Your Token
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Tokens expire after 24 hours. Generate a new one anytime.
          </p>

          {!token ? (
            <button
              onClick={generateToken}
              disabled={generating}
              className="btn-gradient w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              {generating ? 'Generating...' : 'Generate Token'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <pre
                  className="rounded-lg border p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-32"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {token}
                </pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyToken}
                  className="btn-gradient flex-1 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <CopyIcon className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy Token'}
                </button>
                <button
                  onClick={generateToken}
                  disabled={generating}
                  className="btn-ghost rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshIcon className="h-4 w-4" />
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              className="mt-4 rounded-lg border px-4 py-3 text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Security Note */}
        <div
          className="rounded-lg border p-4"
          style={{
            background: 'var(--warning-subtle)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex gap-3">
            <ShieldIcon className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-400">
                Keep your token secure
              </p>
              <p className="mt-1 text-xs text-amber-500/80">
                This token provides access to your encrypted API keys. Never share it publicly.
                If compromised, generate a new one immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
