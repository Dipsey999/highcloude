import Link from 'next/link';

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
    <main className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Download Claude Bridge
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Get the Figma plugin and start syncing your design tokens in minutes.
          </p>
        </div>

        {/* Download Card */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-8 shadow-sm text-center mb-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </div>
          <a
            href={DOWNLOAD_URL}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download Plugin (ZIP)
          </a>
          <p className="mt-4 text-sm text-gray-500">
            Version 0.1.0 &middot; Contains manifest.json + built plugin files
          </p>
          <a
            href="https://github.com/Dipsey999/highcloude/releases"
            className="mt-2 inline-block text-sm text-brand-500 hover:text-brand-600"
          >
            View all releases on GitHub &rarr;
          </a>
        </div>

        {/* Installation Steps */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Installation</h2>
          <ol className="space-y-6">
            {installSteps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-gray-900">{step.title}</div>
                  <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Account Setup */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Set Up Your Account</h2>
          <p className="text-sm text-gray-500 mb-6">
            Connect the plugin to your GitHub repository through the Claude Bridge dashboard.
          </p>
          <ol className="space-y-6">
            {setupSteps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-gray-900">{step.title}</div>
                  <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                  {step.link && (
                    <Link
                      href={step.link.href}
                      className="mt-2 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
                    >
                      {step.link.label} &rarr;
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Requirements */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-8">
          <div className="flex gap-3">
            <svg
              className="h-5 w-5 text-amber-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Figma Desktop Required</p>
              <p className="mt-1 text-xs text-amber-700">
                Development plugins only work in the Figma desktop app, not the browser version.
                Download Figma Desktop from{' '}
                <a
                  href="https://www.figma.com/downloads/"
                  className="underline hover:text-amber-900"
                >
                  figma.com/downloads
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* AI Features Note */}
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 mb-8">
          <div className="flex gap-3">
            <span className="text-lg shrink-0">&#10024;</span>
            <div>
              <p className="text-sm font-medium text-purple-800">Free AI Features</p>
              <p className="mt-1 text-xs text-purple-700">
                Design generation, chat, and AI features work through Figma&apos;s built-in Claude MCP
                integration — no paid API key needed. Just connect Claude to Figma via the MCP server.
              </p>
            </div>
          </div>
        </div>

        {/* Build from source */}
        <div className="text-center text-sm text-gray-500">
          Want to build from source?{' '}
          <a
            href="https://github.com/Dipsey999/highcloude"
            className="text-brand-500 hover:text-brand-600 font-medium"
          >
            View the GitHub repository
          </a>
        </div>
      </div>
    </main>
  );
}
