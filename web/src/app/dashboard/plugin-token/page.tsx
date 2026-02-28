'use client';

import { useState } from 'react';
import {
  ShieldIcon,
  CopyIcon,
  RefreshIcon,
  LinkIcon,
  DownloadIcon,
  AlertTriangleIcon,
  CheckIcon,
  ExternalLinkIcon,
  FigmaIcon,
} from '@/components/Icons';

const DOWNLOAD_URL =
  'https://github.com/Dipsey999/highcloude/releases/latest/download/cosmikit-figma-plugin.zip';

/* ──────────────────────── Step Data ──────────────────────── */

const installSteps = [
  {
    title: 'Download the plugin ZIP',
    description: 'Click the download button below to get the latest plugin build.',
  },
  {
    title: 'Extract the ZIP file',
    description:
      'Unzip the downloaded file to any folder on your computer. You\'ll see a manifest.json and a dist/ folder inside.',
  },
  {
    title: 'Open Figma Desktop',
    description:
      'Open the Figma desktop app. Development plugins require the desktop app — the browser version won\'t work.',
  },
  {
    title: 'Import the plugin',
    description:
      'In Figma, go to Plugins → Development → Import plugin from manifest… and select the manifest.json file you extracted.',
  },
  {
    title: 'Run the plugin',
    description:
      'Open any Figma file, then go to Plugins → Development → Cosmikit. The plugin panel will open.',
  },
];

const connectSteps = [
  {
    title: 'Generate a token below',
    description: 'Click "Generate Token" in the section below to create a secure JWT.',
  },
  {
    title: 'Copy the token',
    description: 'Click the copy button to save the token to your clipboard.',
  },
  {
    title: 'Paste in the Figma plugin',
    description:
      'In the Cosmikit plugin panel, select the "Cosmikit" tab, paste your token, and click Connect.',
  },
  {
    title: 'Select a project',
    description:
      'Once connected, choose your project from the dropdown. The plugin will sync your design tokens to the linked GitHub repo.',
  },
];

/* ──────────────────────── Numbered Step ──────────────────────── */

function NumberedStep({
  index,
  title,
  description,
  variant = 'brand',
}: {
  index: number;
  title: string;
  description: string;
  variant?: 'brand' | 'muted';
}) {
  return (
    <li className="relative flex gap-4">
      <span
        className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={
          variant === 'brand'
            ? {
                background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                color: '#fff',
              }
            : {
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }
        }
      >
        {index}
      </span>
      <div className="pt-0.5">
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>
    </li>
  );
}

/* ──────────────────────── Main Page ──────────────────────── */

export default function FigmaPluginPage() {
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
        <div className="flex items-center gap-3 mb-1">
          <FigmaIcon className="h-6 w-6" style={{ color: 'var(--brand)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Figma Plugin
          </h1>
        </div>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Download, install, and connect the Cosmikit Figma plugin to sync your design tokens.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* ───── Section 1: Download ───── */}
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-elevated)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <DownloadIcon className="h-4 w-4" style={{ color: 'var(--brand)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              1. Download &amp; Install
            </h3>
          </div>
          <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
            Get the Figma plugin and add it to your Figma Desktop app.
          </p>

          {/* Download Button */}
          <a
            href={DOWNLOAD_URL}
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 w-full sm:w-auto justify-center"
          >
            <span className="relative z-10 flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" />
              Download Plugin (ZIP)
            </span>
          </a>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            v0.1.0 &middot; Contains manifest.json + built plugin files
          </p>

          {/* Install Steps */}
          <div
            className="mt-5 pt-5"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Installation Steps
            </p>
            <ol className="space-y-4">
              {installSteps.map((step, i) => (
                <NumberedStep
                  key={i}
                  index={i + 1}
                  title={step.title}
                  description={step.description}
                  variant="brand"
                />
              ))}
            </ol>
          </div>
        </div>

        {/* Figma Desktop Required Warning */}
        <div
          className="rounded-xl border p-4"
          style={{
            background: 'var(--warning-subtle)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex gap-3">
            <AlertTriangleIcon className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-400">
                Figma Desktop Required
              </p>
              <p className="mt-1 text-xs text-amber-500/80">
                Development plugins only work in the Figma desktop app, not the browser version.{' '}
                <a
                  href="https://www.figma.com/downloads/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium text-amber-400 inline-flex items-center gap-1"
                >
                  Download Figma Desktop <ExternalLinkIcon className="h-3 w-3 inline" />
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* ───── Section 2: Connect ───── */}
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-elevated)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <LinkIcon className="h-4 w-4" style={{ color: 'var(--brand)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              2. Connect Plugin to Cosmikit
            </h3>
          </div>
          <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
            Generate a secure token and paste it into the Figma plugin to connect.
          </p>

          {/* Connect Steps */}
          <ol className="space-y-4 mb-6">
            {connectSteps.map((step, i) => (
              <NumberedStep
                key={i}
                index={i + 1}
                title={step.title}
                description={step.description}
                variant="muted"
              />
            ))}
          </ol>

          {/* Token Generation Card */}
          <div
            className="rounded-lg border p-5"
            style={{
              borderColor: 'var(--border-accent)',
              background: 'var(--bg-primary)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Plugin Token
              </h4>
              <span
                className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--warning-subtle)',
                  color: 'var(--warning)',
                }}
              >
                Expires in 24h
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Tokens are valid for 24 hours. Generate a new one anytime.
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
                    {copied ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
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
        </div>

        {/* Security Note */}
        <div
          className="rounded-xl border p-4"
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
                This token provides access to your encrypted API keys and project data.
                Never share it publicly. If compromised, generate a new one immediately — the
                old token will be invalidated.
              </p>
            </div>
          </div>
        </div>

        {/* Prerequisites Checklist */}
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-elevated)',
          }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Before You Start — Checklist
          </h3>
          <ul className="space-y-3">
            {[
              { text: 'Figma Desktop app installed', link: 'https://www.figma.com/downloads/', linkText: 'Download' },
              { text: 'GitHub token added in API Keys', href: '/dashboard/keys', linkText: 'API Keys' },
              { text: 'At least one project created', href: '/dashboard', linkText: 'Projects' },
            ].map((item, i) => (
              <li key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded border"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <CheckIcon className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {item.text}
                  </span>
                </div>
                {(item.link || item.href) && (
                  <a
                    href={item.link || item.href}
                    target={item.link ? '_blank' : undefined}
                    rel={item.link ? 'noopener noreferrer' : undefined}
                    className="text-xs font-medium flex items-center gap-1 transition-colors duration-200"
                    style={{ color: 'var(--brand)' }}
                  >
                    {item.linkText}
                    {item.link && <ExternalLinkIcon className="h-3 w-3" />}
                    {item.href && <span>&rarr;</span>}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
