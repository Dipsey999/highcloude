import Link from 'next/link';
import {
  PaletteIcon,
  RefreshIcon,
  RobotIcon,
  TargetIcon,
  ChartIcon,
  UsersIcon,
  SparklesIcon,
  DownloadIcon,
} from '@/components/Icons';

const features = [
  {
    title: 'Token Extraction',
    description:
      'Extract all variables, text styles, and effects from Figma into W3C DTCG format automatically.',
    Icon: PaletteIcon,
  },
  {
    title: 'Two-Way GitHub Sync',
    description:
      'Push tokens to GitHub and pull changes back to Figma. Single-file or multi-file, direct or via PRs.',
    Icon: RefreshIcon,
  },
  {
    title: 'AI-Powered Design',
    description:
      'Use Claude MCP to generate Figma layouts from natural language — free, no API key needed.',
    Icon: RobotIcon,
  },
  {
    title: 'Smart Auto-Mapping',
    description:
      'Automatically detect hard-coded values and map them to the closest matching design token.',
    Icon: TargetIcon,
  },
  {
    title: 'Diff & Merge',
    description:
      'See exactly what changed between local and remote tokens before syncing. Resolve conflicts per-file.',
    Icon: ChartIcon,
  },
  {
    title: 'Team-Ready',
    description:
      'Multi-file sync splits tokens by collection. PR workflow for team review before merging changes.',
    Icon: UsersIcon,
  },
];

const steps = [
  {
    num: '1',
    title: 'Download Plugin',
    description:
      'Download the Figma plugin ZIP and import it into Figma Desktop via Plugins > Development > Import plugin from manifest.',
  },
  {
    num: '2',
    title: 'Create Account',
    description:
      'Sign in with GitHub, add your GitHub token, and create a project for your design token repository.',
  },
  {
    num: '3',
    title: 'Connect Plugin',
    description:
      'Generate a plugin token from the dashboard and paste it into the Claude Bridge plugin in Figma.',
  },
  {
    num: '4',
    title: 'Sync & Build',
    description:
      'Extract tokens, sync to GitHub, and use AI to generate designs — all inside Figma.',
  },
];

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Radial gradient backdrop */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 20%, var(--brand-subtle) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Floating decorative dots */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span
            className="absolute h-2 w-2 rounded-full opacity-40 animate-pulse"
            style={{ background: 'var(--brand)', top: '18%', left: '12%', animationDelay: '0s' }}
          />
          <span
            className="absolute h-1.5 w-1.5 rounded-full opacity-30 animate-pulse"
            style={{ background: 'var(--gradient-to)', top: '30%', right: '18%', animationDelay: '1.2s' }}
          />
          <span
            className="absolute h-3 w-3 rounded-full opacity-20 animate-pulse"
            style={{ background: 'var(--brand)', bottom: '22%', left: '24%', animationDelay: '2.4s' }}
          />
          <span
            className="absolute h-2 w-2 rounded-full opacity-25 animate-pulse"
            style={{ background: 'var(--gradient-from)', top: '50%', right: '10%', animationDelay: '0.6s' }}
          />
          <span
            className="absolute h-1 w-1 rounded-full opacity-35 animate-pulse"
            style={{ background: 'var(--brand-glow)', bottom: '35%', right: '30%', animationDelay: '1.8s' }}
          />
          <span
            className="absolute h-2.5 w-2.5 rounded-full opacity-20 animate-pulse"
            style={{ background: 'var(--gradient-to)', top: '12%', left: '60%', animationDelay: '3s' }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium glass">
              <SparklesIcon className="h-4 w-4" />
              <span style={{ color: 'var(--text-secondary)' }}>Design token management, reimagined</span>
            </div>

            <h1
              className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Design tokens,{' '}
              <span className="gradient-text">synced</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Claude Bridge connects Figma to GitHub, keeping your design tokens in sync
              with AI-powered assistance. Extract, transform, diff, and push — all from
              inside Figma.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/download"
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <DownloadIcon className="h-5 w-5" />
                Download Plugin
              </Link>
              <Link
                href="/login"
                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative py-28" style={{ background: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2
              className="text-3xl font-bold sm:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Everything you need for design token management
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              From extraction to deployment, Claude Bridge handles the entire token lifecycle.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-hover group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-primary)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--brand-subtle), transparent 60%)',
                  }}
                  aria-hidden="true"
                />

                <div className="relative">
                  {/* Gradient icon circle */}
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                      color: '#fff',
                    }}
                  >
                    <feature.Icon className="h-6 w-6" />
                  </div>

                  <h3
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative py-28" style={{ background: 'var(--bg-primary)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            className="text-center text-3xl font-bold sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            How it works
          </h2>

          <div className="relative mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting dotted line (visible on lg screens) */}
            <div
              className="pointer-events-none absolute top-6 left-[12.5%] right-[12.5%] hidden h-px lg:block"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, var(--border-accent) 0px, var(--border-accent) 6px, transparent 6px, transparent 14px)',
              }}
              aria-hidden="true"
            />

            {steps.map((step) => (
              <div key={step.num} className="relative text-center">
                {/* Gradient number circle */}
                <div
                  className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                    color: '#fff',
                  }}
                >
                  {step.num}
                </div>

                <h3
                  className="mt-5 font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/download"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative py-8"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* Gradient separator line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--gradient-from), var(--gradient-to), transparent)',
          }}
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span
            className="text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Claude Bridge &mdash; Design System Sync for Figma
          </span>
          <div className="flex gap-6 text-sm">
            <Link
              href="/download"
              className="transition-colors duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Download
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
