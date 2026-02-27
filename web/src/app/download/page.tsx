import Link from 'next/link';
import {
  DownloadIcon,
  AlertTriangleIcon,
  SparklesIcon,
  ExternalLinkIcon,
} from '@/components/Icons';

const DOWNLOAD_URL =
  'https://github.com/Dipsey999/highcloude/releases/latest/download/claude-bridge-figma-plugin.zip';

const installSteps = [
  {
    title: 'Download the plugin',
    description: 'Click the download button above to get the ZIP file.',
  },
  {
    title: 'Extract the ZIP',
    description:
      'Unzip the downloaded file to any folder on your computer. You\'ll see manifest.json and a dist/ folder inside.',
  },
  {
    title: 'Open Figma Desktop',
    description:
      'Open the Figma desktop app. Development plugins require the desktop app — the browser version won\'t work.',
  },
  {
    title: 'Import the plugin',
    description:
      'In Figma, go to Plugins > Development > Import plugin from manifest... and select the manifest.json file from the extracted folder.',
  },
  {
    title: 'Run the plugin',
    description:
      'Open any Figma file, then go to Plugins > Development > Claude Bridge — Design System Sync. The plugin panel will open.',
  },
];

const setupSteps = [
  {
    title: 'Sign in with GitHub',
    description: 'Go to the Claude Bridge dashboard and sign in using your GitHub account.',
    link: { href: '/login', label: 'Sign In' },
  },
  {
    title: 'Add your GitHub token',
    description:
      'In the dashboard, go to API Keys and add a GitHub Personal Access Token with Contents and Pull requests read/write permissions.',
    link: { href: '/dashboard/keys', label: 'API Keys' },
  },
  {
    title: 'Create a project',
    description:
      'Create a project and select the GitHub repository where you want to sync your design tokens.',
    link: { href: '/dashboard/projects/new', label: 'New Project' },
  },
  {
    title: 'Generate a plugin token',
    description:
      'Go to Plugin Token, generate a token, and copy it to your clipboard.',
    link: { href: '/dashboard/plugin-token', label: 'Plugin Token' },
  },
  {
    title: 'Connect the plugin',
    description:
      'Back in Figma, open the Claude Bridge plugin. Select the "Claude Bridge" tab, paste your token, and click Connect. You\'re all set!',
  },
];

export default function DownloadPage() {
  return (
    <main style={{ background: 'var(--bg-primary)' }}>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Download Claude Bridge
          </h1>
          <p
            className="mt-4 text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Get the Figma plugin and start syncing your design tokens in minutes.
          </p>
        </div>

        {/* Download Card */}
        <div className="gradient-border mb-12">
          <div
            className="glass p-8 text-center"
            style={{ background: 'var(--bg-elevated)' }}
          >
            {/* Gradient icon circle */}
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                color: '#fff',
              }}
            >
              <DownloadIcon className="h-8 w-8" />
            </div>

            <a
              href={DOWNLOAD_URL}
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <DownloadIcon className="h-5 w-5" />
              Download Plugin (ZIP)
            </a>

            <p
              className="mt-4 text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Version 0.1.0 &middot; Contains manifest.json + built plugin files
            </p>

            <a
              href="https://github.com/Dipsey999/highcloude/releases"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200"
              style={{ color: 'var(--brand)' }}
            >
              View all releases on GitHub
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Installation Steps */}
        <div
          className="rounded-2xl p-8 mb-8"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <h2
            className="text-xl font-bold mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Installation
          </h2>

          <ol className="relative space-y-6">
            {/* Subtle connecting line between steps */}
            <div
              className="pointer-events-none absolute left-4 top-4 bottom-4 w-px"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(180deg, var(--border-accent) 0px, var(--border-accent) 4px, transparent 4px, transparent 12px)',
              }}
              aria-hidden="true"
            />

            {installSteps.map((step, i) => (
              <li key={i} className="relative flex gap-4">
                {/* Gradient step number */}
                <span
                  className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                    color: '#fff',
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <div
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {step.title}
                  </div>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Account Setup */}
        <div
          className="rounded-2xl p-8 mb-8"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Set Up Your Account
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Connect the plugin to your GitHub repository through the Claude Bridge dashboard.
          </p>

          <ol className="space-y-6">
            {setupSteps.map((step, i) => (
              <li key={i} className="flex gap-4">
                {/* Muted step number */}
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <div
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {step.title}
                  </div>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {step.description}
                  </p>
                  {step.link && (
                    <Link
                      href={step.link.href}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200"
                      style={{ color: 'var(--brand)' }}
                    >
                      {step.link.label} &rarr;
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Figma Desktop Required Warning */}
        <div
          className="rounded-2xl p-5 mb-8"
          style={{
            background: 'var(--warning-subtle)',
            border: '1px solid var(--warning)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex gap-3">
            <AlertTriangleIcon
              className="h-5 w-5 shrink-0 mt-0.5"
              // amber-tinted via the warning variable
            />
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--warning)' }}
              >
                Figma Desktop Required
              </p>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Development plugins only work in the Figma desktop app, not the browser version.
                Download Figma Desktop from{' '}
                <a
                  href="https://www.figma.com/downloads/"
                  className="underline font-medium transition-colors duration-200"
                  style={{ color: 'var(--warning)' }}
                >
                  figma.com/downloads
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* AI Features Note */}
        <div
          className="rounded-2xl p-5 mb-8"
          style={{
            background: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex gap-3">
            <SparklesIcon
              className="h-5 w-5 shrink-0 mt-0.5"
            />
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: 'rgb(139, 92, 246)' }}
              >
                Free AI Features
              </p>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Design generation, chat, and AI features work through Figma&apos;s built-in Claude MCP
                integration — no paid API key needed. Just connect Claude to Figma via the MCP server.
              </p>
            </div>
          </div>
        </div>

        {/* Build from source */}
        <div className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Want to build from source?{' '}
          <a
            href="https://github.com/Dipsey999/highcloude"
            className="font-medium transition-colors duration-200"
            style={{ color: 'var(--brand)' }}
          >
            View the GitHub repository
          </a>
        </div>
      </div>
    </main>
  );
}
