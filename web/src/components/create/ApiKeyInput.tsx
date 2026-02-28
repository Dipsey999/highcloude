'use client';

import { useState } from 'react';

interface ApiKeyInputProps {
  value: string;
  onChange: (key: string) => void;
}

export function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
          style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}
        >
          🔑
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Enter your Claude API key
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Your key is used for this generation only and is not stored.{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--brand)' }}
              className="hover:underline"
            >
              Get a key →
            </a>
          </p>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="sk-ant-..."
                className="input w-full rounded-lg px-3 py-2 text-sm pr-16"
                style={{ fontFamily: 'monospace' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {value && !value.startsWith('sk-ant-') && (
            <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
              Claude API keys start with sk-ant-
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
