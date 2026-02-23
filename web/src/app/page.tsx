import Link from 'next/link';

const features = [
  {
    title: 'Token Extraction',
    description: 'Extract all variables, text styles, and effects from Figma into W3C DTCG format automatically.',
    icon: '🎨',
  },
  {
    title: 'Two-Way GitHub Sync',
    description: 'Push tokens to GitHub and pull changes back to Figma. Single-file or multi-file, direct or via PRs.',
    icon: '🔄',
  },
  {
    title: 'AI-Powered Design',
    description: 'Describe a component in natural language and Claude generates the Figma layout using your tokens.',
    icon: '🤖',
  },
  {
    title: 'Smart Auto-Mapping',
    description: 'Automatically detect hard-coded values and map them to the closest matching design token.',
    icon: '🎯',
  },
  {
    title: 'Diff & Merge',
    description: 'See exactly what changed between local and remote tokens before syncing. Resolve conflicts per-file.',
    icon: '📊',
  },
  {
    title: 'Team-Ready',
    description: 'Multi-file sync splits tokens by collection. PR workflow for team review before merging changes.',
    icon: '👥',
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Design tokens,{' '}
              <span className="text-brand-500">synced</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Claude Bridge connects Figma to GitHub, keeping your design tokens in sync
              with AI-powered assistance. Extract, transform, diff, and push — all from
              inside Figma.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-brand-500 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
              >
                Get Started Free
              </Link>
              <a
                href="https://github.com"
                className="rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything you need for design token management
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From extraction to deployment, Claude Bridge handles the entire token lifecycle.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            How it works
          </h2>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold text-lg">
                1
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Configure</h3>
              <p className="mt-2 text-sm text-gray-600">
                Sign in, add your API keys, and connect your GitHub repository.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold text-lg">
                2
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Connect Plugin</h3>
              <p className="mt-2 text-sm text-gray-600">
                Copy your plugin token and paste it into the Figma plugin to link them.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold text-lg">
                3
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Sync & Build</h3>
              <p className="mt-2 text-sm text-gray-600">
                Extract tokens, sync to GitHub, and use AI to generate designs — all inside Figma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          Claude Bridge &mdash; Design System Sync for Figma
        </div>
      </footer>
    </main>
  );
}
