'use client';

import { useState, useEffect } from 'react';

interface KeysData {
  hasKeys: boolean;
  claudeHint: string | null;
  githubHint: string | null;
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
    if (!confirm('Are you sure you want to delete all API keys?')) return;

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
    <div className="space-y-6">
      {/* Current Keys Status */}
      {keysData?.hasKeys && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Current Keys</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Claude API Key</span>
              <span className="text-sm font-mono text-gray-900">
                {keysData.claudeHint || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">GitHub Token</span>
              <span className="text-sm font-mono text-gray-900">
                {keysData.githubHint || '—'}
              </span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Delete all keys
          </button>
        </div>
      )}

      {/* Save Keys Form */}
      <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          {keysData?.hasKeys ? 'Update Keys' : 'Add Your API Keys'}
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Keys are encrypted with AES-256-GCM before storage. Only you and your Figma plugin can access them.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="claudeKey" className="block text-sm font-medium text-gray-700 mb-1">
              Claude API Key
            </label>
            <input
              id="claudeKey"
              type="password"
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              Get yours at console.anthropic.com
            </p>
          </div>

          <div>
            <label htmlFor="githubToken" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Personal Access Token
            </label>
            <input
              id="githubToken"
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              Needs repo read/write scope. Create at github.com/settings/tokens
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || (!claudeApiKey && !githubToken)}
          className="mt-6 w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Encrypting & Saving...' : 'Save Keys'}
        </button>
      </form>
    </div>
  );
}
