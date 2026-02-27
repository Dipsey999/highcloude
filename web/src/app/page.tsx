import Link from 'next/link';
import {
  PaletteIcon,
  RefreshIcon,
  RobotIcon,
  TargetIcon,
  ChartIcon,
  UsersIcon,
  DownloadIcon,
  ArrowRightIcon,
  CosmiLogoHero,
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
    num: '01',
    title: 'Download Plugin',
    description:
      'Get the Figma plugin ZIP and import it into Figma Desktop via Plugins > Development > Import.',
  },
  {
    num: '02',
    title: 'Create Account',
    description:
      'Sign in with GitHub, add your token, and create a project for your design token repository.',
  },
  {
    num: '03',
    title: 'Connect Plugin',
    description:
      'Generate a plugin token from the dashboard and paste it into the Cosmikit plugin in Figma.',
  },
  {
    num: '04',
    title: 'Sync & Build',
    description:
      'Extract tokens, sync to GitHub, and use AI to generate designs — all inside Figma.',
  },
];

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ── Hero ── */}
      <section className="hero-mesh relative">
        <div className="mx-auto max-w-5xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
          <div className="text-center">
            {/* Logo mark */}
            <div className="mb-8 flex justify-center">
              <CosmiLogoHero className="h-16 w-16 sm:h-20 sm:w-20" />
            </div>

            {/* Badge */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase"
              style={{
                background: 'var(--brand-subtle)',
                color: 'var(--brand)',
                border: '1px solid var(--border-accent)',
              }}
            >
              Design tokens from Figma to code
            </div>

            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: 'var(--text-primary)', lineHeight: '1.1' }}
            >
              Your design system,
              <br />
              <span className="gradient-text">synced and intelligent</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cosmikit connects Figma to GitHub, keeping your design tokens in sync
              with AI-powered assistance. Extract, transform, diff, and push — all from
              inside Figma.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/download"
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <DownloadIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Download Plugin
                </span>
              </Link>
              <Link
                href="/login"
                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
              >
                Get Started
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="gradient-line" />
      </section>

      {/* ── Features ── */}
      <section className="py-24 sm:py-28" style={{ background: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Everything you need for{' '}
              <span className="gradient-text">design token management</span>
            </h2>
            <p
              className="mt-4 text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              From extraction to deployment, Cosmikit handles the entire token lifecycle.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-shadow duration-200 group-hover:shadow-glow"
                  style={{
                    background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                    color: '#fff',
                  }}
                >
                  <feature.Icon className="h-5 w-5" />
                </div>

                <h3
                  className="text-base font-semibold"
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
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-line" />

      {/* ── How It Works ── */}
      <section className="py-24 sm:py-28" style={{ background: 'var(--bg-primary)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-2xl font-bold sm:text-3xl lg:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Get started in <span className="gradient-text">minutes</span>
            </h2>
            <p
              className="mt-4 text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Four simple steps to connect your design system to your codebase.
            </p>
          </div>

          <div className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line (desktop) */}
            <div
              className="pointer-events-none absolute top-7 left-[12.5%] right-[12.5%] hidden h-px lg:block"
              style={{
                background: 'linear-gradient(90deg, var(--border-accent), var(--gradient-from), var(--gradient-to), var(--border-accent))',
                opacity: 0.3,
              }}
              aria-hidden="true"
            />

            {steps.map((step) => (
              <div key={step.num} className="relative text-center group">
                <div
                  className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 group-hover:shadow-glow"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '2px solid var(--border-primary)',
                    color: 'var(--brand)',
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
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Building
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="hero-mesh relative py-20 sm:py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="gradient-line absolute inset-x-0 top-0" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to sync your <span className="gradient-text">design system</span>?
          </h2>
          <p
            className="mt-4 text-base sm:text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Join teams using Cosmikit to bridge Figma and code.
            Free to get started, open-source plugin.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
            >
              <span className="relative z-10">Get Started Free</span>
            </Link>
            <Link
              href="/download"
              className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base"
            >
              Download Plugin
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--bg-primary)' }}>
        <div className="gradient-line" />
        <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span
            className="text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Cosmikit — Design System Sync for Figma
          </span>
          <div className="flex gap-6 text-sm">
            <Link
              href="/download"
              className="transition-colors duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Download
            </Link>
            <Link
              href="/dashboard/docs"
              className="transition-colors duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
