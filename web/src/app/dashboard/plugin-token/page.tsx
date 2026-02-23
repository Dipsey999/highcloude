'use client';

import { useState } from 'react';

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plugin Token</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate a token to connect your Figma plugin to Claude Bridge.
        </p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* How it works */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">How It Works</h3>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">1</span>
              <span>Click &quot;Generate Token&quot; below to create a secure JWT</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">2</span>
              <span>Copy the token to your clipboard</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">3</span>
              <span>Open the Claude Bridge plugin in Figma</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">4</span>
              <span>Select &quot;Claude Bridge&quot; tab and paste the token</span>
            </li>
          </ol>
        </div>

        {/* Token Generation */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Token</h3>
          <p className="text-xs text-gray-400 mb-4">
            Tokens expire after 24 hours. Generate a new one anytime.
          </p>

          {!token ? (
            <button
              onClick={generateToken}
              disabled={generating}
              className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Token'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <pre className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                  {token}
                </pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyToken}
                  className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy Token'}
                </button>
                <button
                  onClick={generateToken}
                  disabled={generating}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}
        </div>

        {/* Security Note */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Keep your token secure</p>
              <p className="mt-1 text-xs text-amber-700">
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
